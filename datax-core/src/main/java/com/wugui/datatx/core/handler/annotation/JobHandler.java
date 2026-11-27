package com.wugui.datatx.core.handler.annotation;

import java.lang.annotation.*;

/**
 * 任务处理器注解
 * @author 2016-5-17 21:06:49
 */
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
public @interface JobHandler {

    String value() default "";
    
}
