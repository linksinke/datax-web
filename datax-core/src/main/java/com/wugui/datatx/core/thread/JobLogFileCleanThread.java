package com.wugui.datatx.core.thread;

import com.wugui.datatx.core.log.JobFileAppender;
import com.wugui.datatx.core.util.FileUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.concurrent.TimeUnit;

/**
 * 任务日志文件清理线程
 *
 * @author xuxueli 2017-12-29 16:23:43
 */
public class JobLogFileCleanThread {
    private static Logger logger = LoggerFactory.getLogger(JobLogFileCleanThread.class);

    private static JobLogFileCleanThread instance = new JobLogFileCleanThread();

    public static JobLogFileCleanThread getInstance() {
        return instance;
    }

    private Thread localThread;
    private volatile boolean toStop = false;

    public void start(final long logRetentionDays) {

        // 限制最小保留天数
        if (logRetentionDays < 3) {
            return;
        }

        localThread = new Thread(() -> {
            while (!toStop) {
                try {
                    // 清理超过保留天数的日志目录
                    File[] childDirs = new File(JobFileAppender.getLogPath()).listFiles();
                    if (childDirs != null && childDirs.length > 0) {

                        // 当天统计
                        Calendar todayCal = Calendar.getInstance();
                        todayCal.set(Calendar.HOUR_OF_DAY, 0);
                        todayCal.set(Calendar.MINUTE, 0);
                        todayCal.set(Calendar.SECOND, 0);
                        todayCal.set(Calendar.MILLISECOND, 0);

                        Date todayDate = todayCal.getTime();
                        for (File childFile : childDirs) {

                            // 参数校验
                            if (!childFile.isDirectory() || childFile.getName().indexOf("-") == -1) {
                                continue;
                            }
                            // 日志文件创建日期
                            Date logFileCreateDate = null;
                            try {
                                SimpleDateFormat simpleDateFormat = new SimpleDateFormat("yyyy-MM-dd");
                                logFileCreateDate = simpleDateFormat.parse(childFile.getName());
                            } catch (ParseException e) {
                                logger.error(e.getMessage(), e);
                            }
                            // 参数校验
                            if (logFileCreateDate == null) {
                                continue;
                            }
                            if ((todayDate.getTime() - logFileCreateDate.getTime()) >= logRetentionDays * (24 * 60 * 60 * 1000)) {
                                FileUtil.deleteRecursively(childFile);
                            }
                        }
                    }

                } catch (Exception e) {
                    if (!toStop) {
                        logger.error(e.getMessage(), e);
                    }

                }

                try {
                    TimeUnit.DAYS.sleep(1);
                } catch (InterruptedException e) {
                    if (!toStop) {
                        logger.error(e.getMessage(), e);
                    }
                }
            }
            logger.info(">>>>>>>>>>> datax-web, executor JobLogFileCleanThread thread destory.");

        });
        localThread.setDaemon(true);
        localThread.setName("datax-web, executor JobLogFileCleanThread");
        localThread.start();
    }

    public void toStop() {
        toStop = true;

        if (localThread == null) {
            return;
        }

        // 发送中断信号并等待线程退出
        localThread.interrupt();
        try {
            localThread.join();
        } catch (InterruptedException e) {
            logger.error(e.getMessage(), e);
        }
    }

}
