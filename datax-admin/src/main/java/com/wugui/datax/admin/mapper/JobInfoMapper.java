package com.wugui.datax.admin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.wugui.datax.admin.entity.JobInfo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.Date;
import java.util.List;


/**
 * 任务基础信息
 *
 * @author xuxueli 2016-1-12 18:03:45
 */
@Mapper
public interface JobInfoMapper extends BaseMapper<JobInfo> {

    List<JobInfo> pageList(@Param("offset") int offset,
                           @Param("pagesize") int pagesize,
                           @Param("jobGroup") int jobGroup,
                           @Param("triggerStatus") int triggerStatus,
                           @Param("jobDesc") String jobDesc,
                           @Param("glueType") String glueType,
                           @Param("userId") int userId,
                           @Param("projectIds") Integer[] projectIds);

    int pageListCount(@Param("offset") int offset,
                      @Param("pagesize") int pagesize,
                      @Param("jobGroup") int jobGroup,
                      @Param("triggerStatus") int triggerStatus,
                      @Param("jobDesc") String jobDesc,
                      @Param("glueType") String glueType,
                      @Param("userId") int userId,
                      @Param("projectIds") Integer[] projectIds);

    List<JobInfo> getJobsByGroup(@Param("jobGroup") int jobGroup);

    List<JobInfo> scheduleJobQuery(@Param("maxNextTime") long maxNextTime, @Param("pagesize") int pagesize);

    int scheduleUpdate(JobInfo xxlJobInfo);

    int incrementTimeUpdate(@Param("id") int id, @Param("incStartTime") Date incStartTime);

	public int updateLastHandleCode(@Param("id") int id,@Param("lastHandleCode")int lastHandleCode);

    void incrementIdUpdate(@Param("id") int id, @Param("incStartId")Long incStartId);
}
