package com.wugui.datax.admin.controller;


import com.baomidou.mybatisplus.extension.api.ApiController;
import com.wugui.datax.admin.util.JwtTokenUtils;

import javax.servlet.http.HttpServletRequest;

/**
 * 控制器公共能力
 */
public class BaseController extends ApiController {

    public Integer getCurrentUserId(HttpServletRequest request) {
        String header = request.getHeader(JwtTokenUtils.TOKEN_HEADER);
        if (header == null || !header.startsWith(JwtTokenUtils.TOKEN_PREFIX)) {
            throw new IllegalArgumentException("登录状态无效，请重新登录");
        }
        String token = header.substring(JwtTokenUtils.TOKEN_PREFIX.length());
        return JwtTokenUtils.getUserId(token);
    }
}
