package com.wugui.datax.admin.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.util.Date;

@Data
@TableName("job_log_report")
public class JobLogReport {

    @TableId(type = IdType.AUTO)
    private int id;

    private Date triggerDay;

    private int runningCount;

    private int sucCount;

    private int failCount;

}
