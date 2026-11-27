package com.wugui.datatx.core.thread;

import com.wugui.datatx.core.biz.AdminBiz;
import com.wugui.datatx.core.biz.model.HandleProcessCallbackParam;
import com.wugui.datatx.core.biz.model.ReturnT;
import com.wugui.datatx.core.enums.RegistryConfig;
import com.wugui.datatx.core.executor.JobExecutor;
import com.wugui.datatx.core.log.JobFileAppender;
import com.wugui.datatx.core.log.JobLogger;
import com.wugui.datatx.core.util.FileUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

/**
 * 创建者：jingwk，时间：2019/12/14.
 */
public class ProcessCallbackThread {
    private static Logger logger = LoggerFactory.getLogger(ProcessCallbackThread.class);

    private static ProcessCallbackThread instance = new ProcessCallbackThread();

    public static ProcessCallbackThread getInstance() {
        return instance;
    }

    /**
     * 任务结果回调队列
     */
    private LinkedBlockingQueue<HandleProcessCallbackParam> callBackQueue = new LinkedBlockingQueue<>();

    public static void pushCallBack(HandleProcessCallbackParam callback) {
        getInstance().callBackQueue.add(callback);
        logger.debug(">>>>>>>>>>> datax-web, push process callback request, logId:{}", callback.getLogId());
    }

    /**
     * 回调处理线程
     */
    private Thread processCallbackThread;
    private Thread processRetryCallbackThread;
    private volatile boolean toStop = false;

    public void start() {

        // 参数校验
        if (JobExecutor.getAdminBizList() == null) {
            logger.warn(">>>>>>>>>>> datax-web, executor callback config fail, adminAddresses is null.");
            return;
        }

        // 回调处理
        processCallbackThread = new Thread(() -> {

            // 正常回调
            while (!toStop) {
                try {
                    HandleProcessCallbackParam callback = getInstance().callBackQueue.take();

                    // 组装批量回调参数
                    List<HandleProcessCallbackParam> callbackParamList = new ArrayList<HandleProcessCallbackParam>();
                    int drainToNum = getInstance().callBackQueue.drainTo(callbackParamList);
                    callbackParamList.add(callback);

                    // 提交回调，失败时进入重试
                    if (callbackParamList.size() > 0) {
                        doCallback(callbackParamList);
                    }
                } catch (Exception e) {
                    if (!toStop) {
                        logger.error(e.getMessage(), e);
                    }
                }
            }

            // 处理退出前的最后一批回调
            try {
                List<HandleProcessCallbackParam> callbackParamList = new ArrayList<HandleProcessCallbackParam>();
                int drainToNum = getInstance().callBackQueue.drainTo(callbackParamList);
                if (callbackParamList != null && callbackParamList.size() > 0) {
                    doCallback(callbackParamList);
                }
            } catch (Exception e) {
                if (!toStop) {
                    logger.error(e.getMessage(), e);
                }
            }
            logger.info(">>>>>>>>>>> datax-web, executor callback thread destory.");

        });
        processCallbackThread.setDaemon(true);
        processCallbackThread.setName("datax-web, executor TriggerCallbackThread");
        processCallbackThread.start();


        // 失败重试
        processRetryCallbackThread = new Thread(() -> {
            while (!toStop) {
                try {
                    retryFailCallbackFile();
                } catch (Exception e) {
                    if (!toStop) {
                        logger.error(e.getMessage(), e);
                    }

                }
                try {
                    TimeUnit.SECONDS.sleep(RegistryConfig.BEAT_TIMEOUT);
                } catch (InterruptedException e) {
                    if (!toStop) {
                        logger.error(e.getMessage(), e);
                    }
                }
            }
            logger.info(">>>>>>>>>>> datax-web, executor retry callback thread destory.");
        });
        processRetryCallbackThread.setDaemon(true);
        processRetryCallbackThread.start();

    }

    public void toStop() {
        toStop = true;
        // 停止回调线程并等待退出
        if (processCallbackThread != null) {    // 兼容未配置管理端地址的情况
            processCallbackThread.interrupt();
            try {
                processCallbackThread.join();
            } catch (InterruptedException e) {
                logger.error(e.getMessage(), e);
            }
        }

        // 中断重试线程并等待退出
        if (processRetryCallbackThread != null) {
            processRetryCallbackThread.interrupt();
            try {
                processRetryCallbackThread.join();
            } catch (InterruptedException e) {
                logger.error(e.getMessage(), e);
            }
        }

    }

    /**
     * 发送回调，失败后重试
     *
     * @param callbackParamList
     */
    private void doCallback(List<HandleProcessCallbackParam> callbackParamList) {
        boolean callbackRet = false;
        // 提交回调，失败时进入重试
        for (AdminBiz adminBiz : JobExecutor.getAdminBizList()) {
            try {
                ReturnT<String> callbackResult = adminBiz.processCallback(callbackParamList);
                if (callbackResult != null && ReturnT.SUCCESS_CODE == callbackResult.getCode()) {
                    callbackLog(callbackParamList, "<br>----------- datax-web job callback finish.");
                    callbackRet = true;
                    break;
                } else {
                    callbackLog(callbackParamList, "<br>----------- datax-web job callback fail, callbackResult:" + callbackResult);
                }
            } catch (Exception e) {
                callbackLog(callbackParamList, "<br>----------- datax-web job callback error, errorMsg:" + e.getMessage());
            }
        }
        if (!callbackRet) {
            appendFailCallbackFile(callbackParamList);
        }
    }

    /**
     * 记录回调日志
     */
    private void callbackLog(List<HandleProcessCallbackParam> callbackParamList, String logContent) {
        for (HandleProcessCallbackParam callbackParam : callbackParamList) {
            String logFileName = JobFileAppender.makeLogFileName(new Date(callbackParam.getLogDateTime()), callbackParam.getLogId());
            JobFileAppender.contextHolder.set(logFileName);
            JobLogger.log(logContent);
        }
    }


    // 失败回调文件

    private static String failCallbackFilePath = JobFileAppender.getLogPath().concat(File.separator).concat("processcallbacklog").concat(File.separator);
    private static String failCallbackFileName = failCallbackFilePath.concat("datax-web-processcallback-{x}").concat(".log");

    private void appendFailCallbackFile(List<HandleProcessCallbackParam> handleProcessCallbackParams) {
        // 参数校验
        if (handleProcessCallbackParams == null || handleProcessCallbackParams.size() == 0) {
            return;
        }

        // 追加失败记录文件
        byte[] callbackParamList_bytes = JobExecutor.getSerializer().serialize(handleProcessCallbackParams);

        File callbackLogFile = new File(failCallbackFileName.replace("{x}", String.valueOf(System.currentTimeMillis())));
        if (callbackLogFile.exists()) {
            for (int i = 0; i < 100; i++) {
                callbackLogFile = new File(failCallbackFileName.replace("{x}", String.valueOf(System.currentTimeMillis()).concat("-").concat(String.valueOf(i))));
                if (!callbackLogFile.exists()) {
                    break;
                }
            }
        }
        FileUtil.writeFileContent(callbackLogFile, callbackParamList_bytes);
    }

    private void retryFailCallbackFile() {

        // 参数校验
        File callbackLogPath = new File(failCallbackFilePath);
        if (!callbackLogPath.exists()) {
            return;
        }
        if (callbackLogPath.isFile()) {
            callbackLogPath.delete();
        }
        if (!(callbackLogPath.isDirectory() && callbackLogPath.list() != null && callbackLogPath.list().length > 0)) {
            return;
        }

        // 载入并清理失败文件，重新提交回调
        List<HandleProcessCallbackParam> params;
        for (File f : callbackLogPath.listFiles()) {
            byte[] ps = FileUtil.readFileContent(f);
            params = (List<HandleProcessCallbackParam>) JobExecutor.getSerializer().deserialize(ps, HandleProcessCallbackParam.class);
            f.delete();
            doCallback(params);
        }
    }

}
