package com.wugui.datax.admin.controller;

import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.extension.api.R;
import com.wugui.datax.admin.dto.ProjectRecipeDto;
import com.wugui.datax.admin.service.workbench.ProjectRecipeService;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;

/** 项目可复用配置方案与模拟查询输出列接口。 */
@RestController
@RequestMapping("/api/projectRecipes")
public class ProjectRecipeController extends BaseController {
    private final ProjectRecipeService service;
    public ProjectRecipeController(ProjectRecipeService service) { this.service = service; }

    @GetMapping
    public R<Map<String, Object>> list(@RequestParam(required = false) Integer projectId,
            @RequestParam(defaultValue = "") String keyword, @RequestParam(defaultValue = "1") int current,
            @RequestParam(defaultValue = "10") int size) {
        return success(service.list(projectId, keyword, current, size));
    }

    @GetMapping("/{id}")
    public R<ProjectRecipeDto> get(@PathVariable long id) { return success(service.get(id)); }

    @PostMapping
    public R<ProjectRecipeDto> save(@RequestBody ProjectRecipeDto dto, HttpServletRequest request) {
        return success(service.save(dto, getCurrentUserId(request), administrator()));
    }

    @DeleteMapping("/{id}")
    public R<Boolean> delete(@PathVariable long id, HttpServletRequest request) {
        service.delete(id, getCurrentUserId(request), administrator()); return success(true);
    }

    @PostMapping("/queryColumns")
    public R<List<String>> queryColumns(@RequestBody JSONObject body) throws SQLException {
        return success(service.queryColumns(body.getIntValue("projectId"), body.getLongValue("metadataDatasourceId"), body.getString("table"), body.getString("sql")));
    }

    static boolean administrator() {
        return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream().anyMatch(role -> "ROLE_ADMIN".equals(role.getAuthority()));
    }
}
