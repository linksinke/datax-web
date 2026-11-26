package com.wugui.datax.admin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.wugui.datax.admin.dto.ProjectDatasourceDto;
import com.wugui.datax.admin.entity.JobProjectDatasource;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.Collection;
import java.util.List;

@Mapper
public interface JobProjectDatasourceMapper extends BaseMapper<JobProjectDatasource> {

    /**
     * 根据项目ID集合查询项目数据源列表
     *
     * @param projectIds 项目ID集合
     * @return 项目数据源列表
     */
    List<ProjectDatasourceDto> selectProjectDatasources(@Param("projectIds") Collection<Integer> projectIds);

}
