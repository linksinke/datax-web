package com.wugui.datax.admin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.wugui.datax.admin.entity.JobLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.Date;
import java.util.List;
import java.util.Map;

/**
 * 任务执行日志
 *
 * @author xuxueli 2016-1-12 18:03:06
 */
@Mapper
public interface JobLogMapper extends BaseMapper<JobLog> {

    // 指定任务编号时按任务筛选，否则按执行器分组筛选
    List<JobLog> pageList(@Param("offset") int offset,
                          @Param("pagesize") int pagesize,
                          @Param("jobGroup") int jobGroup,
                          @Param("jobId") int jobId,
                          @Param("triggerTimeStart") Date triggerTimeStart,
                          @Param("triggerTimeEnd") Date triggerTimeEnd,
                          @Param("logStatus") int logStatus);

    int pageListCount(@Param("offset") int offset,
                      @Param("pagesize") int pagesize,
                      @Param("jobGroup") int jobGroup,
                      @Param("jobId") int jobId,
                      @Param("triggerTimeStart") Date triggerTimeStart,
                      @Param("triggerTimeEnd") Date triggerTimeEnd,
                      @Param("logStatus") int logStatus);

    int updateTriggerInfo(JobLog jobLog);

    int updateHandleInfo(JobLog jobLog);

    int updateProcessId(@Param("id") long id,
                        @Param("processId") String processId);

    int deleteByJobId(@Param("jobId") int jobId);

    Map<String, Object> findLogReport(@Param("from") Date from,
                                      @Param("to") Date to);

    List<Long> findClearLogIds(@Param("jobGroup") int jobGroup,
                               @Param("jobId") int jobId,
                               @Param("clearBeforeTime") Date clearBeforeTime,
                               @Param("clearBeforeNum") int clearBeforeNum,
                               @Param("pagesize") int pagesize);

    int clearLog(@Param("logIds") List<Long> logIds);

    List<Long> findFailJobLogIds(@Param("pagesize") int pagesize);

    int updateAlarmStatus(@Param("logId") long logId,
                          @Param("oldAlarmStatus") int oldAlarmStatus,
                          @Param("newAlarmStatus") int newAlarmStatus);

}
