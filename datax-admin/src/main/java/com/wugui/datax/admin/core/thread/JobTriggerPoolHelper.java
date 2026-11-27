package com.wugui.datax.admin.core.thread;

import com.wugui.datax.admin.core.conf.JobAdminConfig;
import com.wugui.datax.admin.core.trigger.TriggerTypeEnum;
import com.wugui.datax.admin.core.trigger.JobTrigger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 任务触发线程池辅助类
 *
 * @author xuxueli 2018-07-03 21:08:07
 */
public class JobTriggerPoolHelper {
    private static Logger logger = LoggerFactory.getLogger(JobTriggerPoolHelper.class);


    // 任务触发线程池

    // 快任务与慢任务线程池
    private ThreadPoolExecutor fastTriggerPool = null;
    private ThreadPoolExecutor slowTriggerPool = null;

    public void start() {
        fastTriggerPool = new ThreadPoolExecutor(
                10,
                JobAdminConfig.getAdminConfig().getTriggerPoolFastMax(),
                60L,
                TimeUnit.SECONDS,
                new LinkedBlockingQueue<Runnable>(1000),
                new ThreadFactory() {
                    @Override
                    public Thread newThread(Runnable r) {
                        return new Thread(r, "datax-web, admin JobTriggerPoolHelper-fastTriggerPool-" + r.hashCode());
                    }
                });

        slowTriggerPool = new ThreadPoolExecutor(
                10,
                JobAdminConfig.getAdminConfig().getTriggerPoolSlowMax(),
                60L,
                TimeUnit.SECONDS,
                new LinkedBlockingQueue<Runnable>(2000),
                new ThreadFactory() {
                    @Override
                    public Thread newThread(Runnable r) {
                        return new Thread(r, "datax-web, admin JobTriggerPoolHelper-slowTriggerPool-" + r.hashCode());
                    }
                });
    }


    public void stop() {
        //triggerPool.shutdown();
        fastTriggerPool.shutdownNow();
        slowTriggerPool.shutdownNow();
        logger.info(">>>>>>>>> datax-web trigger thread pool shutdown success.");
    }


    // 任务超时次数
    private volatile long minTim = System.currentTimeMillis() / 60000;     // 将毫秒换算为分钟
    private volatile ConcurrentMap<Integer, AtomicInteger> jobTimeoutCountMap = new ConcurrentHashMap<>();


    /**
     * 提交触发请求
     */
    public void addTrigger(final int jobId, final TriggerTypeEnum triggerType, final int failRetryCount, final String executorShardingParam, final String executorParam) {

        // 选择触发线程池
        ThreadPoolExecutor triggerPool_ = fastTriggerPool;
        AtomicInteger jobTimeoutCount = jobTimeoutCountMap.get(jobId);
        if (jobTimeoutCount != null && jobTimeoutCount.get() > 10) {      // 一分钟内超时超过10次时切换慢线程池
            triggerPool_ = slowTriggerPool;
        }
        // 触发执行
        triggerPool_.execute(() -> {
            long start = System.currentTimeMillis();
            try {
                // 触发任务
                JobTrigger.trigger(jobId, triggerType, failRetryCount, executorShardingParam, executorParam);
            } catch (Exception e) {
                logger.error(e.getMessage(), e);
            } finally {
                // 检查超时统计周期
                long minTim_now = System.currentTimeMillis() / 60000;
                if (minTim != minTim_now) {
                    minTim = minTim_now;
                    jobTimeoutCountMap.clear();
                }
                // 递增任务超时计数
                long cost = System.currentTimeMillis() - start;
                if (cost > 500) {       // 任务超时统计阈值为500毫秒
                    AtomicInteger timeoutCount = jobTimeoutCountMap.putIfAbsent(jobId, new AtomicInteger(1));
                    if (timeoutCount != null) {
                        timeoutCount.incrementAndGet();
                    }
                }
            }
        });
    }


    // 辅助操作

    private static JobTriggerPoolHelper helper = new JobTriggerPoolHelper();

    public static void toStart() {
        helper.start();
    }

    public static void toStop() {
        helper.stop();
    }

    /**
     * @param jobId
     * @param triggerType
     * @param failRetryCount 大于等于0时使用传入的重试次数
     *                              小于0时使用任务配置中的重试次数
     * @param executorShardingParam
     * @param executorParam 执行参数，为空时沿用任务参数
     *                              传入参数非空时覆盖任务参数
     */
    public static void trigger(int jobId, TriggerTypeEnum triggerType, int failRetryCount, String executorShardingParam, String executorParam) {
        helper.addTrigger(jobId, triggerType, failRetryCount, executorShardingParam, executorParam);
    }

}
