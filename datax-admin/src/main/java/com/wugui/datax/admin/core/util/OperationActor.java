package com.wugui.datax.admin.core.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/** 为请求、启动初始化和后台作业提供统一的审计账号。 */
public final class OperationActor {
    private static final ThreadLocal<String> BACKGROUND = new ThreadLocal<>();

    private OperationActor() { }

    public static String current() {
        String actor = BACKGROUND.get();
        if (actor == null) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()
                    && !"anonymousUser".equals(authentication.getPrincipal())) actor = authentication.getName();
        }
        if (actor == null || actor.trim().isEmpty()) actor = "system";
        return actor.length() > 128 ? actor.substring(0, 128) : actor;
    }

    /** 后台线程必须在 finally 中清理，防止线程池串用上一次作业的账号。 */
    public static void runAs(String actor, Runnable work) {
        String previous = BACKGROUND.get();
        BACKGROUND.set(actor);
        try { work.run(); }
        finally {
            if (previous == null) BACKGROUND.remove(); else BACKGROUND.set(previous);
        }
    }
}
