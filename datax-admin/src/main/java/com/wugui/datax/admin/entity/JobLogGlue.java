package com.wugui.datax.admin.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.IdType;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.util.Date;

/**
 * 任务脚本版本日志，用于追踪脚本修改
 *
 * @author xuxueli 2016-5-19 17:57:46
 */
@Data
@TableName("job_logglue")
public class JobLogGlue extends AuditFields {

    @TableId(type = IdType.AUTO)
    private int id;

    @ApiModelProperty("任务主键ID")
    private int jobId;

    @ApiModelProperty("GLUE类型\t#com.xxl.job.core.glue.GlueTypeEnum")
    private String glueType;

    @ApiModelProperty("GLUE源代码")
    private String glueSource;

    @ApiModelProperty("GLUE备注")
    private String glueRemark;

    private Date addTime;

    private Date updateTime;

}
