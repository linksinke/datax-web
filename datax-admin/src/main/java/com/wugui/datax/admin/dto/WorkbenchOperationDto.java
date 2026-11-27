package com.wugui.datax.admin.dto;

import com.alibaba.fastjson.JSONObject;
import lombok.Data;

/** 幂等提交的后台操作请求；身份始终由登录上下文取得。 */
@Data
public class WorkbenchOperationDto {
    private String kind;
    private String name;
    private String requestKey;
    private JSONObject payload;
}
