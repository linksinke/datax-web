package com.wugui.datax.admin.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.wugui.datax.admin.dto.ProjectDatasourceDto;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.util.Date;
import java.util.List;

/**
 * 创建者：jingwk，时间：2020/05/24
 */
@Data
@TableName("job_project")
public class JobProject extends AuditFields {

    @ApiModelProperty("项目Id")
    @TableId(type = IdType.AUTO)
    private int id;

    @ApiModelProperty("项目名称")
    private String name;

    @ApiModelProperty("项目描述")
    private String description;

    @ApiModelProperty("用户Id")
    private int userId;

    @ApiModelProperty("标记")
    private Boolean flag;

    @ApiModelProperty("创建时间")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date createTime;

    @ApiModelProperty("更新时间")
    private Date updateTime;

    @TableField(exist = false)
    private String userName;

    //************** 非数据库字段 **************/
    /** 旧版修改请求未传绑定列表时，保留已有数据源绑定。 */
    @TableField(exist = false)
    private List<Long> datasourceIds;

    @TableField(exist = false)
    private List<ProjectDatasourceDto> datasources;

}
