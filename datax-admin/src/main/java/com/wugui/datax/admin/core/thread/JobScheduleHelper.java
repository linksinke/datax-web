package com.wugui.datax.admin.core.thread;

import com.wugui.datax.admin.core.conf.JobAdminConfig;
import com.wugui.datax.admin.core.cron.CronExpression;
import com.wugui.datax.admin.core.trigger.TriggerTypeEnum;
import com.wugui.datax.admin.entity.JobInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.text.ParseException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * @author xuxueli 2019-05-21
 */
public class JobScheduleHelper {
    private static Logger logger = LoggerFactory.getLogger(JobScheduleHelper.class);

    private static JobScheduleHelper instance = new JobScheduleHelper();

    public static JobScheduleHelper getInstance() {
        return instance;
    }

    public static final long PRE_READ_MS = 5000;    // 调度预读窗口

    private Thread scheduleThread;
    private Thread ringThread;
    private volatile boolean scheduleThreadToStop = false;
    private volatile boolean ringThreadToStop = false;
    private volatile static Map<Integer, List<Integer>> ringData = new ConcurrentHashMap<>();

    public void start() {

        // 任务调度线程
        scheduleThread = new Thread(new Runnable() {
            @Override
            public void run() {

                try {
                    TimeUnit.MILLISECONDS.sleep(5000 - System.currentTimeMillis() % 1000);
                } catch (InterruptedException e) {
                    if (!scheduleThreadToStop) {
                        logger.error(e.getMessage(), e);
                    }
                }
                logger.info(">>>>>>>>> init datax-web admin scheduler success.");

                // 预读数量为线程池大小乘以每秒触发量；按单次50毫秒估算，每秒约20次
                int preReadCount = (JobAdminConfig.getAdminConfig().getTriggerPoolFastMax() + JobAdminConfig.getAdminConfig().getTriggerPoolSlowMax()) * 20;

                while (!scheduleThreadToStop) {

                    // 扫描待调度任务
                    long start = System.currentTimeMillis();

                    Connection conn = null;
                    Boolean connAutoCommit = null;
                    PreparedStatement preparedStatement = null;

                    boolean preReadSuc = true;
                    try {

                        conn = JobAdminConfig.getAdminConfig().getDataSource().getConnection();
                        connAutoCommit = conn.getAutoCommit();
                        conn.setAutoCommit(false);

                        preparedStatement = conn.prepareStatement("select * from job_lock where lock_name = 'schedule_lock' for update");
                        preparedStatement.execute();

                        // 开启事务

                        // 预读取即将触发的任务
                        long nowTime = System.currentTimeMillis();
                        List<JobInfo> scheduleList = JobAdminConfig.getAdminConfig().getJobInfoMapper().scheduleJobQuery(nowTime + PRE_READ_MS, preReadCount);
                        if (scheduleList != null && scheduleList.size() > 0) {
                            // 将任务放入时间轮
                            for (JobInfo jobInfo : scheduleList) {

                                // 跳过已过期时间槽
                                if (nowTime > jobInfo.getTriggerNextTime() + PRE_READ_MS) {
                                    // 过期超过5秒：跳过本次并计算下次触发时间
                                    logger.warn(">>>>>>>>>>> datax-web, schedule misfire, jobId = " + jobInfo.getId());

                                    // 刷新下一次触发时间
                                    refreshNextValidTime(jobInfo, new Date());

                                } else if (nowTime > jobInfo.getTriggerNextTime()) {
                                    // 过期不足5秒：立即触发并计算下次触发时间

                                    // 触发任务
                                    JobTriggerPoolHelper.trigger(jobInfo.getId(), TriggerTypeEnum.CRON, -1, null, null);
                                    logger.debug(">>>>>>>>>>> datax-web, schedule push trigger : jobId = " + jobInfo.getId());

                                    // 刷新下一次触发时间
                                    refreshNextValidTime(jobInfo, new Date());

                                    // 下次触发在5秒内时再次预读
                                    if (jobInfo.getTriggerStatus() == 1 && nowTime + PRE_READ_MS > jobInfo.getTriggerNextTime()) {

                                        // 计算时间轮的秒槽位
                                        int ringSecond = (int) ((jobInfo.getTriggerNextTime() / 1000) % 60);

                                        // 将任务加入时间轮
                                        pushTimeRing(ringSecond, jobInfo.getId());

                                        // 更新下一次触发时间
                                        refreshNextValidTime(jobInfo, new Date(jobInfo.getTriggerNextTime()));

                                    }

                                } else {
                                    // 预读任务：进入时间轮并计算下次触发时间

                                    // 计算时间轮的秒槽位
                                    int ringSecond = (int) ((jobInfo.getTriggerNextTime() / 1000) % 60);

                                    // 将任务加入时间轮
                                    pushTimeRing(ringSecond, jobInfo.getId());

                                    // 更新下一次触发时间
                                    refreshNextValidTime(jobInfo, new Date(jobInfo.getTriggerNextTime()));

                                }

                            }

                            // 更新任务触发信息
                            for (JobInfo jobInfo : scheduleList) {
                                JobAdminConfig.getAdminConfig().getJobInfoMapper().scheduleUpdate(jobInfo);
                            }

                        } else {
                            preReadSuc = false;
                        }

                        // 结束事务


                    } catch (Exception e) {
                        if (!scheduleThreadToStop) {
                            logger.error(">>>>>>>>>>> datax-web, JobScheduleHelper#scheduleThread error:{}", e);
                        }
                    } finally {

                        // 提交事务
                        if (conn != null) {
                            try {
                                conn.commit();
                            } catch (SQLException e) {
                                if (!scheduleThreadToStop) {
                                    logger.error(e.getMessage(), e);
                                }
                            }
                            try {
                                conn.setAutoCommit(connAutoCommit);
                            } catch (SQLException e) {
                                if (!scheduleThreadToStop) {
                                    logger.error(e.getMessage(), e);
                                }
                            }
                            try {
                                conn.close();
                            } catch (SQLException e) {
                                if (!scheduleThreadToStop) {
                                    logger.error(e.getMessage(), e);
                                }
                            }
                        }

                        // 关闭预编译语句
                        if (null != preparedStatement) {
                            try {
                                preparedStatement.close();
                            } catch (SQLException e) {
                                if (!scheduleThreadToStop) {
                                    logger.error(e.getMessage(), e);
                                }
                            }
                        }
                    }
                    long cost = System.currentTimeMillis() - start;


                    // 等待并对齐到整秒
                    if (cost < 1000) {  // 扫描超时后立即开始下一轮
                        try {
                            // 预读周期：正常时每秒扫描，失败时跳过当前周期
                            TimeUnit.MILLISECONDS.sleep((preReadSuc ? 1000 : PRE_READ_MS) - System.currentTimeMillis() % 1000);
                        } catch (InterruptedException e) {
                            if (!scheduleThreadToStop) {
                                logger.error(e.getMessage(), e);
                            }
                        }
                    }

                }

                logger.info(">>>>>>>>>>> datax-web, JobScheduleHelper#scheduleThread stop");
            }
        });
        scheduleThread.setDaemon(true);
        scheduleThread.setName("datax-web, admin JobScheduleHelper#scheduleThread");
        scheduleThread.start();


        // 时间轮触发线程
        ringThread = new Thread(() -> {

            // 对齐到整秒
            try {
                TimeUnit.MILLISECONDS.sleep(1000 - System.currentTimeMillis() % 1000);
            } catch (InterruptedException e) {
                if (!ringThreadToStop) {
                    logger.error(e.getMessage(), e);
                }
            }

            while (!ringThreadToStop) {

                try {
                    // 取出当前秒对应的任务
                    List<Integer> ringItemData = new ArrayList<>();
                    int nowSecond = Calendar.getInstance().get(Calendar.SECOND);   // 避免处理耗时太长，跨过刻度，向前校验一个刻度；
                    for (int i = 0; i < 2; i++) {
                        List<Integer> tmpData = ringData.remove((nowSecond + 60 - i) % 60);
                        if (tmpData != null) {
                            ringItemData.addAll(tmpData);
                        }
                    }

                    // 触发时间轮中的任务
                    logger.debug(">>>>>>>>>>> datax-web, time-ring beat : " + nowSecond + " = " + Arrays.asList(ringItemData));
                    if (ringItemData.size() > 0) {
                        // 触发任务
                        for (int jobId : ringItemData) {
                            // 触发任务
                            JobTriggerPoolHelper.trigger(jobId, TriggerTypeEnum.CRON, -1, null, null);
                        }
                        // 清理已处理记录
                        ringItemData.clear();
                    }
                } catch (Exception e) {
                    if (!ringThreadToStop) {
                        logger.error(">>>>>>>>>>> datax-web, JobScheduleHelper#ringThread error:{}", e);
                    }
                }

                // 等待下一整秒
                try {
                    TimeUnit.MILLISECONDS.sleep(1000 - System.currentTimeMillis() % 1000);
                } catch (InterruptedException e) {
                    if (!ringThreadToStop) {
                        logger.error(e.getMessage(), e);
                    }
                }
            }
            logger.info(">>>>>>>>>>> datax-web, JobScheduleHelper#ringThread stop");
        });
        ringThread.setDaemon(true);
        ringThread.setName("datax-web, admin JobScheduleHelper#ringThread");
        ringThread.start();
    }

    private void refreshNextValidTime(JobInfo jobInfo, Date fromTime) throws ParseException {
        Date nextValidTime = new CronExpression(jobInfo.getJobCron()).getNextValidTimeAfter(fromTime);
        if (nextValidTime != null) {
            jobInfo.setTriggerLastTime(jobInfo.getTriggerNextTime());
            jobInfo.setTriggerNextTime(nextValidTime.getTime());
        } else {
            jobInfo.setTriggerStatus(0);
            jobInfo.setTriggerLastTime(0);
            jobInfo.setTriggerNextTime(0);
        }
    }

    private void pushTimeRing(int ringSecond, int jobId) {
        // 异步放入时间轮
        List<Integer> ringItemData = ringData.get(ringSecond);
        if (ringItemData == null) {
            ringItemData = new ArrayList<Integer>();
            ringData.put(ringSecond, ringItemData);
        }
        ringItemData.add(jobId);

        logger.debug(">>>>>>>>>>> datax-web, schedule push time-ring : " + ringSecond + " = " + Arrays.asList(ringItemData));
    }

    public void toStop() {

        // 停止调度扫描线程
        scheduleThreadToStop = true;
        try {
            TimeUnit.SECONDS.sleep(1);  // 等待处理完成
        } catch (InterruptedException e) {
            logger.error(e.getMessage(), e);
        }
        if (scheduleThread.getState() != Thread.State.TERMINATED) {
            // 发送中断信号并等待线程退出
            scheduleThread.interrupt();
            try {
                scheduleThread.join();
            } catch (InterruptedException e) {
                logger.error(e.getMessage(), e);
            }
        }

        // if has ring data
        boolean hasRingData = false;
        if (!ringData.isEmpty()) {
            for (int second : ringData.keySet()) {
                List<Integer> tmpData = ringData.get(second);
                if (tmpData != null && tmpData.size() > 0) {
                    hasRingData = true;
                    break;
                }
            }
        }
        if (hasRingData) {
            try {
                TimeUnit.SECONDS.sleep(8);
            } catch (InterruptedException e) {
                logger.error(e.getMessage(), e);
            }
        }

        // 等待内存任务处理后停止时间轮
        ringThreadToStop = true;
        try {
            TimeUnit.SECONDS.sleep(1);
        } catch (InterruptedException e) {
            logger.error(e.getMessage(), e);
        }
        if (ringThread.getState() != Thread.State.TERMINATED) {
            // 发送中断信号并等待线程退出
            ringThread.interrupt();
            try {
                ringThread.join();
            } catch (InterruptedException e) {
                logger.error(e.getMessage(), e);
            }
        }

        logger.info(">>>>>>>>>>> datax-web, JobScheduleHelper stop");
    }

}
