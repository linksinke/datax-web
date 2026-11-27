package com.wugui.datatx.core.biz;

import com.wugui.datatx.core.biz.model.LogResult;
import com.wugui.datatx.core.biz.model.ReturnT;
import com.wugui.datatx.core.biz.model.TriggerParam;

/**
 * 创建者：xuxueli，时间：17/3/1.
 */
public interface ExecutorBiz {

    /**
     * 检测心跳
     *
     * @return
     */
    ReturnT<String> beat();

    /**
     * 检测执行器空闲状态
     *
     * @param jobId
     * @return
     */
    ReturnT<String> idleBeat(int jobId);

    /**
     * 终止任务
     *
     * @param jobId
     * @return
     */
    ReturnT<String> kill(int jobId);

    /**
     * 执行日志
     *
     * @param logDateTim
     * @param logId
     * @param fromLineNum
     * @return
     */
    ReturnT<LogResult> log(long logDateTim, long logId, int fromLineNum);

    /**
     * 运行任务
     *
     * @param triggerParam
     * @return
     */
    ReturnT<String> run(TriggerParam triggerParam);

}
