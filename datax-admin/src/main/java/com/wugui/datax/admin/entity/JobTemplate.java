package com.wugui.datax.admin.entity;

import com.baomidou.mybatisplus.annotation.*;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.util.Date;

/**
 * xxl-job info
 *
 * @author jingwk  2019-11-17 14:25:49
 */
@Data
@TableName("job_template")
public class JobTemplate {

    @ApiModelProperty("主键ID")
    @TableId(type = IdType.AUTO)
    private int id;

    @ApiModelProperty("执行器主键ID")
    private int jobGroup;

    @ApiModelProperty("任务执行CRON表达式")
    @TableField(updateStrategy = FieldStrategy.IGNORED)
    private String jobCron;

    @ApiModelProperty("排序")
    @TableField(updateStrategy = FieldStrategy.IGNORED)
    private String jobDesc;

    @TableField(updateStrategy = FieldStrategy.NEVER)
    private Date addTime;

    @TableField(updateStrategy = FieldStrategy.IGNORED)
    private Date updateTime;

    @ApiModelProperty("修改用户")
    private int userId;

    @ApiModelProperty("报警邮件")
    @TableField(updateStrategy = FieldStrategy.IGNORED)
    private String alarmEmail;

    @ApiModelProperty("执行器路由策略")
    @TableField(updateStrategy = FieldStrategy.IGNORED)
    private String executorRouteStrategy;

    @ApiModelProperty("执行器，任务Handler名称")
    @TableField(updateStrategy = FieldStrategy.IGNORED)
    private String executorHandler;

    @ApiModelProperty("执行器，任务参数")
    @TableField(updateStrategy = FieldStrategy.IGNORED)
    private String executorParam;

    @ApiModelProperty("阻塞处理策略")
    @TableField(updateStrategy = FieldStrategy.IGNORED)
    private String executorBlockStrategy;

    @ApiModelProperty("任务执行超时时间，单位秒")
    private int executorTimeout;

    @ApiModelProperty("失败重试次数")
    private int executorFailRetryCount;

    @ApiModelProperty("GLUE类型\t#com.wugui.datatx.core.glue.GlueTypeEnum")
    @TableField(updateStrategy = FieldStrategy.IGNORED)
    private String glueType;

    @ApiModelProperty("GLUE源代码")
    @TableField(updateStrategy = FieldStrategy.IGNORED)
    private String glueSource;

    @ApiModelProperty("GLUE备注")
    @TableField(updateStrategy = FieldStrategy.IGNORED)
    private String glueRemark;

    @ApiModelProperty("GLUE更新时间")
    @TableField(updateStrategy = FieldStrategy.IGNORED)
    private Date glueUpdatetime;

    @ApiModelProperty("子任务ID")
    @TableField(value = "child_jobid", updateStrategy = FieldStrategy.IGNORED)
    private String childJobId;

    @ApiModelProperty("上次调度时间")
    private long triggerLastTime;

    @ApiModelProperty("下次调度时间")
    private long triggerNextTime;

    @ApiModelProperty("datax运行json")
    @TableField(updateStrategy = FieldStrategy.IGNORED)
    private String jobJson;

    @ApiModelProperty("jvm参数")
    @TableField(updateStrategy = FieldStrategy.IGNORED)
    private String jvmParam;

    @ApiModelProperty("所属项目")
    private int projectId;

    @TableField(exist = false)
    private String projectName;

    @TableField(exist = false)
    private String userName;

}
