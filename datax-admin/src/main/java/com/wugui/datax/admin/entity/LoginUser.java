package com.wugui.datax.admin.entity;

import lombok.Data;

/**
 * 创建者：jingwk，时间：2019/11/17
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
