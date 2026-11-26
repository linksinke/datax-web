package com.wugui.datax.admin.entity;

import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

/**
 * @author xuxueli 2019-05-04 16:43:12
 */
@Data
public class JobRole {

    private int id;

    @ApiModelProperty("账号")
    private String name;

}
