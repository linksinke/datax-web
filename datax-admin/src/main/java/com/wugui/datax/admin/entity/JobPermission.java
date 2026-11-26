package com.wugui.datax.admin.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("job_permission")
public class JobPermission {

    @TableId(type = IdType.AUTO)
    private int id;

    /** 权限名称 */
    @TableField("name")
    private String name;

    /** 权限描述 */
    @TableField("description")
    private String descritpion;

    /** 授权链接 */
    @TableField("url")
    private String url;

    /** 父节点id */
    @TableField("pid")
    private int pid;

}