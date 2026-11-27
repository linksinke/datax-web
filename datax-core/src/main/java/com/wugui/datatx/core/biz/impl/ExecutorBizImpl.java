package com.wugui.datatx.core.biz.impl;

import com.wugui.datatx.core.biz.ExecutorBiz;
import com.wugui.datatx.core.biz.model.LogResult;
import com.wugui.datatx.core.biz.model.ReturnT;
import com.wugui.datatx.core.biz.model.TriggerParam;
import com.wugui.datatx.core.enums.ExecutorBlockStrategyEnum;
import com.wugui.datatx.core.executor.JobExecutor;
import com.wugui.datatx.core.glue.GlueFactory;
import com.wugui.datatx.core.glue.GlueTypeEnum;
import com.wugui.datatx.core.handler.IJobHandler;
import com.wugui.datatx.core.handler.impl.GlueJobHandler;
import com.wugui.datatx.core.handler.impl.ScriptJobHandler;
import com.wugui.datatx.core.log.JobFileAppender;
import com.wugui.datatx.core.thread.JobThread;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Date;


/**
 * 创建者：xuxueli，时间：17/3/1.
 */
public class ExecutorBizImpl implements ExecutorBiz {
    private static Logger logger = LoggerFactory.getLogger(ExecutorBizImpl.class);

    @Override
    public ReturnT<String> beat() {
        return ReturnT.SUCCESS;
    }

    @Override
    public ReturnT<String> idleBeat(int jobId) {
        // 检查正在运行或仍有排队请求的任务
        JobThread jobThread = JobExecutor.loadJobThread(jobId);
        if (jobThread != null && jobThread.isRunningOrHasQueue()) {
            return new ReturnT<>(ReturnT.FAIL_CODE, "job thread is running or has trigger queue.");
        }
        return ReturnT.SUCCESS;
    }

    @Override
    public ReturnT<String> kill(int jobId) {
        // 终止原处理线程并创建新线程
        JobThread jobThread = JobExecutor.loadJobThread(jobId);
        if (jobThread != null) {
            JobExecutor.removeJobThread(jobId, "scheduling center kill job.");
            return ReturnT.SUCCESS;
        }

        return new ReturnT<>(ReturnT.SUCCESS_CODE, "job thread already killed.");
    }

    @Override
    public ReturnT<LogResult> log(long logDateTim, long logId, int fromLineNum) {
        // 日志文件路径：logPath/yyyy-MM-dd/9999.log
        String logFileName = JobFileAppender.makeLogFileName(new Date(logDateTim), logId);

        LogResult logResult = JobFileAppender.readLog(logFileName, fromLineNum);
        return new ReturnT<>(logResult);
    }

    @Override
    public ReturnT<String> run(TriggerParam triggerParam) {
        // 加载已有任务处理器和任务线程
        JobThread jobThread = JobExecutor.loadJobThread(triggerParam.getJobId());
        IJobHandler jobHandler = jobThread != null ? jobThread.getHandler() : null;
        String removeOldReason = null;

        // 校验任务处理器与任务线程
        GlueTypeEnum glueTypeEnum = GlueTypeEnum.match(triggerParam.getGlueType());
        if (GlueTypeEnum.BEAN == glueTypeEnum) {

            // 创建任务处理器
            IJobHandler newJobHandler = JobExecutor.loadJobHandler(triggerParam.getExecutorHandler());

            // 校验已有任务线程
            if (jobThread != null && jobHandler != newJobHandler) {
                // 处理器变更时终止旧线程
                removeOldReason = "change jobhandler or glue type, and terminate the old job thread.";

                jobThread = null;
                jobHandler = null;
            }

            // 校验任务处理器
            if (jobHandler == null) {
                jobHandler = newJobHandler;
                if (jobHandler == null) {
                    return new ReturnT<>(ReturnT.FAIL_CODE, "job handler [" + triggerParam.getExecutorHandler() + "] not found.");
                }
            }

        } else if (GlueTypeEnum.GLUE_GROOVY == glueTypeEnum) {

            // 校验已有任务线程
            if (jobThread != null &&
                    !(jobThread.getHandler() instanceof GlueJobHandler
                            && ((GlueJobHandler) jobThread.getHandler()).getGlueUpdatetime() == triggerParam.getGlueUpdatetime())) {
                // 处理器或动态脚本变更时终止旧线程
                removeOldReason = "change job source or glue type, and terminate the old job thread.";

                jobThread = null;
                jobHandler = null;
            }

            // 校验任务处理器
            if (jobHandler == null) {
                try {
                    IJobHandler originJobHandler = GlueFactory.getInstance().loadNewInstance(triggerParam.getGlueSource());
                    jobHandler = new GlueJobHandler(originJobHandler, triggerParam.getGlueUpdatetime());
                } catch (Exception e) {
                    logger.error(e.getMessage(), e);
                    return new ReturnT<String>(ReturnT.FAIL_CODE, e.getMessage());
                }
            }
        } else if (glueTypeEnum != null && glueTypeEnum.isScript()) {

            // 校验已有任务线程
            if (jobThread != null &&
                    !(jobThread.getHandler() instanceof ScriptJobHandler
                            && ((ScriptJobHandler) jobThread.getHandler()).getGlueUpdatetime() == triggerParam.getGlueUpdatetime())) {
                // 脚本内容更新时终止旧线程
                removeOldReason = "change job source or glue type, and terminate the old job thread.";

                jobThread = null;
                jobHandler = null;
            }

            // 校验任务处理器
            if (jobHandler == null) {
                jobHandler = new ScriptJobHandler(triggerParam.getJobId(), triggerParam.getGlueUpdatetime(), triggerParam.getGlueSource(), GlueTypeEnum.match(triggerParam.getGlueType()));
            }
        } else {
            return new ReturnT<>(ReturnT.FAIL_CODE, "glueType[" + triggerParam.getGlueType() + "] is not valid.");
        }

        // 执行器阻塞策略
        if (jobThread != null) {
            ExecutorBlockStrategyEnum blockStrategy = ExecutorBlockStrategyEnum.match(triggerParam.getExecutorBlockStrategy(), null);
            if (ExecutorBlockStrategyEnum.DISCARD_LATER == blockStrategy) {
                // 已有任务运行时丢弃本次请求
                if (jobThread.isRunningOrHasQueue()) {
                    return new ReturnT<>(ReturnT.FAIL_CODE, "block strategy effect：" + ExecutorBlockStrategyEnum.DISCARD_LATER.getTitle());
                }
            } else if (ExecutorBlockStrategyEnum.COVER_EARLY == blockStrategy) {
                // 终止正在运行的任务线程
                if (jobThread.isRunningOrHasQueue()) {
                    removeOldReason = "block strategy effect：" + ExecutorBlockStrategyEnum.COVER_EARLY.getTitle();

                    jobThread = null;
                }
            } else {
                // 将触发请求加入队列
            }
        }

        // 原线程失效或不存在时替换任务线程
        if (jobThread == null) {
            jobThread = JobExecutor.registJobThread(triggerParam.getJobId(), jobHandler, removeOldReason);
        }

        // 将执行参数加入队列
        ReturnT<String> pushResult = jobThread.pushTriggerQueue(triggerParam);
        return pushResult;
    }

}
