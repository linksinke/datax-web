package com.wugui.datax.admin.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.util.Date;

/**
 * Created by xuxueli on 16/9/30.
 */
@Data
@TableName("job_registry")
public class JobRegistry {

    @TableId(type = IdType.AUTO)
    private int id;

    private String registryGroup;

    private String registryKey;

    private String registryValue;

    private double cpuUsage;

    private double memoryUsage;

    private double loadAverage;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date updateTime;

}
