package com.wugui.datax.admin.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * 项目数据源关联表
 */
@Data
@TableName("job_project_datasource")
public class JobProjectDatasource {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Integer projectId;

    private Long datasourceId;

}
