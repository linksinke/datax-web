package com.wugui.datatx.core.thread;

import com.wugui.datatx.core.biz.model.HandleCallbackParam;
import com.wugui.datatx.core.biz.model.ReturnT;
import com.wugui.datatx.core.biz.model.TriggerParam;
import com.wugui.datatx.core.executor.JobExecutor;
import com.wugui.datatx.core.handler.IJobHandler;
import com.wugui.datatx.core.log.JobFileAppender;
import com.wugui.datatx.core.log.JobLogger;
import com.wugui.datatx.core.util.ShardingUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Collections;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.FutureTask;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;


/**
 * 任务处理线程
 *
 * @author xuxueli 2016-1-16 19:52:47
 */
public class JobThread extends Thread {
    private static Logger logger = LoggerFactory.getLogger(JobThread.class);

    private int jobId;
    private IJobHandler handler;
    private LinkedBlockingQueue<TriggerParam> triggerQueue;
    private Set<Long> triggerLogIdSet;        // 防止同一触发日志编号重复入队

    private volatile boolean toStop = false;
    private String stopReason;

    private boolean running = false;    // if running job
    private int idleTimes = 0;            // 连续空闲次数


    public JobThread(int jobId, IJobHandler handler) {
        this.jobId = jobId;
        this.handler = handler;
        this.triggerQueue = new LinkedBlockingQueue<>();
        this.triggerLogIdSet = Collections.synchronizedSet(new HashSet<>());
    }

    public IJobHandler getHandler() {
        return handler;
    }

    /**
     * 将新的触发请求加入队列
     *
     * @param triggerParam
     * @return
     */
    public ReturnT<String> pushTriggerQueue(TriggerParam triggerParam) {
        // 防止重复提交
        if (triggerLogIdSet.contains(triggerParam.getLogId())) {
            logger.info(">>>>>>>>>>> repeate trigger job, logId:{}", triggerParam.getLogId());
            return new ReturnT<>(ReturnT.FAIL_CODE, "repeate trigger job, logId:" + triggerParam.getLogId());
        }

        triggerLogIdSet.add(triggerParam.getLogId());
        triggerQueue.add(triggerParam);
        return ReturnT.SUCCESS;
    }

    /**
     * 终止任务线程
     *
     * @param stopReason
     */
    public void toStop(String stopReason) {
        /**
         * Thread.interrupt只支持终止线程的阻塞状态(wait、join、sleep)，
         * 在阻塞出抛出InterruptedException异常,但是并不会终止运行的线程本身；
         * 所以需要注意，此处彻底销毁本线程，需要通过共享变量方式；
         */
        this.toStop = true;
        this.stopReason = stopReason;
    }

    /**
     * 判断任务是否正在执行
     *
     * @return
     */
    public boolean isRunningOrHasQueue() {
        return running || triggerQueue.size() > 0;
    }

    @Override
    public void run() {

        // 初始化
        try {
            handler.init();
        } catch (Throwable e) {
            logger.error(e.getMessage(), e);
        }

        // 执行任务
        while (!toStop) {
            running = false;
            idleTimes++;

            TriggerParam tgParam = null;
            ReturnT<String> executeResult = null;
            try {
                // 使用带超时的轮询，保证线程可以定期检查停止信号
                tgParam = triggerQueue.poll(3L, TimeUnit.SECONDS);
                if (tgParam != null) {
                    running = true;
                    idleTimes = 0;
                    triggerLogIdSet.remove(tgParam.getLogId());

                    // 日志文件路径示例：logPath/yyyy-MM-dd/9999.log
                    String logFileName = JobFileAppender.makeLogFileName(new Date(tgParam.getLogDateTime()), tgParam.getLogId());
                    JobFileAppender.contextHolder.set(logFileName);
                    ShardingUtil.setShardingVo(new ShardingUtil.ShardingVO(tgParam.getBroadcastIndex(), tgParam.getBroadcastTotal()));

                    // 执行任务
                    JobLogger.log("<br>----------- datax-web job execute start -----------<br>----------- Param:" + tgParam.getExecutorParams());

                    if (tgParam.getExecutorTimeout() > 0) {
                        // 限制任务执行时间
                        Thread futureThread = null;
                        try {
                            final TriggerParam tgParamT = tgParam;
                            FutureTask<ReturnT<String>> futureTask = new FutureTask<>(() -> handler.execute(tgParamT));
                            futureThread = new Thread(futureTask);
                            futureThread.start();

                            executeResult = futureTask.get(tgParam.getExecutorTimeout(), TimeUnit.MINUTES);
                        } catch (TimeoutException e) {

                            JobLogger.log("<br>----------- datax-web job execute timeout");
                            JobLogger.log(e);

                            executeResult = new ReturnT<>(IJobHandler.FAIL_TIMEOUT.getCode(), "job execute timeout ");
                        } finally {
                            futureThread.interrupt();
                        }
                    } else {
                        // 直接执行任务
                        executeResult = handler.execute(tgParam);
                    }

                    if (executeResult == null) {
                        executeResult = IJobHandler.FAIL;
                    } else {
                        executeResult.setMsg(
                                (executeResult != null && executeResult.getMsg() != null && executeResult.getMsg().length() > 50000)
                                        ? executeResult.getMsg().substring(0, 50000).concat("...")
                                        : executeResult.getMsg());
                        executeResult.setContent(null);    // 限制结果对象大小
                    }
                    JobLogger.log("<br>----------- datax-web job execute end(finish) -----------<br>----------- ReturnT:" + executeResult);

                } else {
                    if (idleTimes > 30) {
                        if (triggerQueue.size() == 0) {    // 保留任务日志上下文，避免并发触发时编号丢失
                            JobExecutor.removeJobThread(jobId, "executor idel times over limit.");
                        }
                    }
                }
            } catch (Throwable e) {
                if (toStop) {
                    JobLogger.log("<br>----------- JobThread toStop, stopReason:" + stopReason);
                }

                StringWriter stringWriter = new StringWriter();
                e.printStackTrace(new PrintWriter(stringWriter));
                String errorMsg = stringWriter.toString();
                executeResult = new ReturnT<>(ReturnT.FAIL_CODE, errorMsg);

                JobLogger.log("<br>----------- JobThread Exception:" + errorMsg + "<br>----------- datax-web job execute end(error) -----------");
            } finally {
                // 终止操作暂不监控状态
                if (tgParam != null && tgParam.getJobId() != -1) {
                    // 回调任务处理结果
                    if (!toStop) {
                        // 普通执行结果
                        TriggerCallbackThread.pushCallBack(new HandleCallbackParam(tgParam.getLogId(), tgParam.getLogDateTime(), executeResult));
                    } else {
                        // 任务已被终止
                        ReturnT<String> stopResult = new ReturnT<String>(ReturnT.FAIL_CODE, stopReason + " [job running, killed]");
                        TriggerCallbackThread.pushCallBack(new HandleCallbackParam(tgParam.getLogId(), tgParam.getLogDateTime(), stopResult));
                    }
                }
            }
        }

        // 回调队列中尚未执行的触发请求
        while (triggerQueue != null && triggerQueue.size() > 0) {
            TriggerParam triggerParam = triggerQueue.poll();
            if (triggerParam != null) {
                // 任务已被终止
                ReturnT<String> stopResult = new ReturnT<String>(ReturnT.FAIL_CODE, stopReason + " [job not executed, in the job queue, killed.]");
                TriggerCallbackThread.pushCallBack(new HandleCallbackParam(triggerParam.getLogId(), triggerParam.getLogDateTime(), stopResult));
            }
        }

        // 释放资源
        try {
            handler.destroy();
        } catch (Throwable e) {
            logger.error(e.getMessage(), e);
        }

        logger.info(">>>>>>>>>>> datax-web JobThread stoped, hashCode:{}", Thread.currentThread());
    }
}