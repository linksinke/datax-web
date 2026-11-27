package com.wugui.datax.admin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.wugui.datax.admin.entity.JobTemplate;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;


/**
 * 任务基础信息
 * @author xuxueli 2016-1-12 18:03:45
 */
@Mapper
public interface JobTemplateMapper extends BaseMapper<JobTemplate> {

	public List<JobTemplate> pageList(@Param("offset") int offset,
									  @Param("pagesize") int pagesize,
									  @Param("jobGroup") int jobGroup,
									  @Param("jobDesc") String jobDesc,
									  @Param("executorHandler") String executorHandler,
									  @Param("userId") int userId,
									  @Param("projectIds") Integer[] projectIds);

	public int pageListCount(@Param("offset") int offset,
                             @Param("pagesize") int pagesize,
                             @Param("jobGroup") int jobGroup,
                             @Param("jobDesc") String jobDesc,
                             @Param("executorHandler") String executorHandler,
                             @Param("userId") int userId,
							 @Param("projectIds") Integer[] projectIds);

}
