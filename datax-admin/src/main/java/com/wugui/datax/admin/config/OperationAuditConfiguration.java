package com.wugui.datax.admin.config;

import com.baomidou.mybatisplus.extension.api.R;
import com.wugui.datatx.core.biz.model.ReturnT;
import com.wugui.datax.admin.service.workbench.OperationLogService;
import com.wugui.datax.admin.util.JwtTokenUtils;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.UUID;

/** 在控制器边界记录写操作和下载，兼容业务失败仍返回HTTP 200的原有接口。 */
@Configuration
@ControllerAdvice
public class OperationAuditConfiguration implements WebMvcConfigurer, ResponseBodyAdvice<Object> {
    private final OperationLogService logs;

    public OperationAuditConfiguration(OperationLogService logs) { this.logs = logs; }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new HandlerInterceptor() {
            @Override
            public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
                request.setAttribute("audit.started", System.currentTimeMillis());
                return true;
            }

            @Override
            public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception failure) {
                String path = request.getRequestURI();
                String method = request.getMethod();
                if (("GET".equals(method) && !path.toLowerCase().contains("download")) || "OPTIONS".equals(method)
                        || path.equals("/api/auth/login") || path.equals("/api/callback") || path.equals("/api/registry")
                        || path.equals("/api/registryRemove") || path.equals("/api/processCallback")) return;
                String header = request.getHeader(JwtTokenUtils.TOKEN_HEADER);
                if (header == null || !header.startsWith(JwtTokenUtils.TOKEN_PREFIX)) return;
                Integer owner;
                try { owner = JwtTokenUtils.getUserId(header.substring(JwtTokenUtils.TOKEN_PREFIX.length())); }
                catch (RuntimeException ignored) { return; }
                boolean success = failure == null && response.getStatus() < 400 && !Boolean.FALSE.equals(request.getAttribute("audit.success"));
                long started = request.getAttribute("audit.started") instanceof Long ? (Long) request.getAttribute("audit.started") : System.currentTimeMillis();
                // 不写入异常全文，避免数据库异常带出SQL或连接信息。
                logs.record(owner, method + " " + path, path, method, success, success ? "操作完成" : "操作未完成，请结合页面提示处理",
                        System.currentTimeMillis() - started, UUID.randomUUID().toString(), request.getRemoteAddr());
            }
        }).addPathPatterns("/api/**");
    }

    @Override
    public boolean supports(MethodParameter parameter, Class<? extends HttpMessageConverter<?>> converter) { return true; }

    @Override
    public Object beforeBodyWrite(Object body, MethodParameter parameter, MediaType mediaType,
                                  Class<? extends HttpMessageConverter<?>> converter, ServerHttpRequest request, ServerHttpResponse response) {
        if (request instanceof ServletServerHttpRequest) {
            boolean success = !(body instanceof R) || (((R<?>) body).getCode() == 0 && !Boolean.FALSE.equals(((R<?>) body).getData()));
            if (body instanceof ReturnT) success = ((ReturnT<?>) body).getCode() == ReturnT.SUCCESS_CODE;
            ((ServletServerHttpRequest) request).getServletRequest().setAttribute("audit.success", success);
        }
        return body;
    }
}
