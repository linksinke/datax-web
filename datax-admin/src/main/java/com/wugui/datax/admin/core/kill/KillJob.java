package com.wugui.datax.admin.core.kill;

import com.wugui.datatx.core.biz.model.ReturnT;
import com.wugui.datatx.core.biz.model.TriggerParam;
import com.wugui.datatx.core.enums.ExecutorBlockStrategyEnum;
import com.wugui.datatx.core.glue.GlueTypeEnum;
import com.wugui.datax.admin.core.trigger.JobTrigger;

import java.util.Date;

/**
 * DataX 任务触发处理
 * 创建者：jingwk，时间：2019/12/15.
 */
public class KillJob {

    /**
     * 触发任务
     *
     * @param logId 日志ID
     * @param address 执行器地址
     * @param processId 进程ID
     */
    public static ReturnT<String> trigger(long logId, Date triggerTime, String address, String processId) {
        ReturnT<String> triggerResult;
        TriggerParam triggerParam = new TriggerParam();
        triggerParam.setJobId(-1);
        triggerParam.setExecutorHandler("killJobHandler");
        triggerParam.setProcessId(processId);
        triggerParam.setLogId(logId);
        triggerParam.setGlueType(GlueTypeEnum.BEAN.getDesc());
        triggerParam.setExecutorBlockStrategy(ExecutorBlockStrategyEnum.SERIAL_EXECUTION.getTitle());
        triggerParam.setLogDateTime(triggerTime.getTime());
        if (address != null) {
            triggerResult = JobTrigger.runExecutor(triggerParam, address);
        } else {
            triggerResult = new ReturnT<>(ReturnT.FAIL_CODE, null);
        }
        return triggerResult;
    }

}
