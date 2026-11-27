package com.wugui.datax.admin.entity;

import com.baomidou.mybatisplus.annotation.*;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import org.springframework.util.StringUtils;

/**
 * @author xuxueli 2019-05-04 16:43:12
 */
@Data
@TableName("job_user")
public class JobUser extends AuditFields {

    @TableId(type = IdType.AUTO)
    private int id;

    @ApiModelProperty("账号")
    @TableField(updateStrategy = FieldStrategy.NEVER)
    private String username;

    @ApiModelProperty("密码")
    @TableField(select = false, updateStrategy = FieldStrategy.NOT_EMPTY)
    private String password;

    @ApiModelProperty("角色：0-普通用户、1-管理员")
    @TableField(updateStrategy = FieldStrategy.IGNORED)
    private String role;

    @ApiModelProperty("权限：执行器ID列表，多个逗号分割")
    @TableField(updateStrategy = FieldStrategy.IGNORED)
    private String permission;


    // 插件配置
    public boolean validPermission(int jobGroup) {
        if ("1".equals(this.role)) {
            return true;
        } else {
            if (StringUtils.hasText(this.permission)) {
                for (String permissionItem : this.permission.split(",")) {
                    if (String.valueOf(jobGroup).equals(permissionItem)) {
                        return true;
                    }
                }
            }
            return false;
        }
    }

}
