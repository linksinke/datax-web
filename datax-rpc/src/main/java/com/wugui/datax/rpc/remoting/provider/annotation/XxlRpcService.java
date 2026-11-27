package com.wugui.datax.rpc.remoting.provider.annotation;

import java.lang.annotation.*;

/**
 * RPC 服务引用注解；继承注解允许服务配合事务代理使用
 *
 * @author 2015-10-29 19:44:33
 */
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
public @interface XxlRpcService {

    /**
     * @return
     */
    String version() default "";

}
