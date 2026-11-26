package com.wugui.datax.admin.entity;

import lombok.Data;

/**
 * Created by jingwk on 2019/11/17
 */
@Data
public class LoginUser {

    /** 用户名 */
    private String username;
    /** 密码 */
    private String password;
    /** 记住我 */
    private Integer rememberMe;

}
