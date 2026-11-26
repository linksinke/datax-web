package com.wugui.datax.admin.entity;

import com.baomidou.mybatisplus.annotation.*;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Created by jingwk on 2019/11/17
 */
@Data
@TableName("job_group")
public class JobGroup {

    @ApiModelProperty("执行器Id")
    @TableId(type = IdType.AUTO)
    private int id;
    @ApiModelProperty("执行器AppName")
    private String appName;
    @ApiModelProperty("执行器名称")
    private String title;
    @ApiModelProperty("排序")
    @TableField("`order`")
    private int order;
    @ApiModelProperty("执行器地址类型：0=自动注册、1=手动录入")
    private int addressType;
    @ApiModelProperty("执行器地址列表，多地址逗号分隔(手动录入)")
    @TableField(updateStrategy = FieldStrategy.IGNORED)
    private String addressList;

    //************** 非数据库字段 **************/
    // 执行器地址列表(系统注册)
    @TableField(exist = false)
    private List<String> registryList;

    public List<String> getRegistryList() {
        if (addressList != null && addressList.trim().length() > 0) {
            registryList = new ArrayList<>(Arrays.asList(addressList.split(",")));
        }
        return registryList;
    }

}
