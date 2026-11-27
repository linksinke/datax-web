package com.wugui.datax.admin.dto;

import com.alibaba.fastjson.JSONObject;
import lombok.Data;

/** 项目内可复用的连接、映射和SQL配置方案。 */
@Data
public class ProjectRecipeDto {
    private Long id;
    private Integer projectId;
    private String name;
    private String description;
    private String mode;
    private Integer version;
    private JSONObject configuration;
}
