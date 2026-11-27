package com.wugui.datax.admin.controller;

import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.extension.api.R;
import com.wugui.datax.admin.dto.WorkbenchOperationDto;
import com.wugui.datax.admin.service.workbench.OperationLogService;
import com.wugui.datax.admin.service.workbench.WorkbenchService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.net.URLEncoder;
import java.util.Map;

/** 后台作业、站内通知、导出与操作留痕的统一入口。 */
@RestController
@RequestMapping("/api/workbench")
public class WorkbenchController extends BaseController {
    private final WorkbenchService service;
    private final OperationLogService logs;
    public WorkbenchController(WorkbenchService service, OperationLogService logs) { this.service = service; this.logs = logs; }

    @PostMapping("/operations")
    public R<Map<String, Object>> submit(@RequestBody WorkbenchOperationDto dto, HttpServletRequest request) {
        return success(service.submit(dto, getCurrentUserId(request)));
    }

    @GetMapping("/operations")
    public R<Map<String, Object>> list(@RequestParam(defaultValue = "") String state,
            @RequestParam(defaultValue = "1") int current, @RequestParam(defaultValue = "10") int size, HttpServletRequest request) {
        return success(service.list(getCurrentUserId(request), state, current, size));
    }

    @GetMapping("/operations/{id}")
    public R<Map<String, Object>> get(@PathVariable String id, HttpServletRequest request) { return success(service.get(id, getCurrentUserId(request))); }

    @PostMapping("/operations/{id}/cancel")
    public R<Boolean> cancel(@PathVariable String id, HttpServletRequest request) { service.cancel(id, getCurrentUserId(request)); return success(true); }

    @PostMapping("/operations/{id}/retry")
    public R<Map<String, Object>> retry(@PathVariable String id, HttpServletRequest request) { return success(service.retry(id, getCurrentUserId(request))); }

    @GetMapping("/notifications")
    public R<Map<String, Object>> notifications(HttpServletRequest request) { return success(service.notifications(getCurrentUserId(request))); }

    @PostMapping("/notifications/read")
    public R<Boolean> markRead(@RequestBody JSONObject input, HttpServletRequest request) { service.markRead(getCurrentUserId(request), input.getString("id")); return success(true); }

    @GetMapping("/exports")
    public R<Map<String, Object>> exports(@RequestParam(defaultValue = "1") int current, @RequestParam(defaultValue = "10") int size, HttpServletRequest request) {
        return success(service.exports(getCurrentUserId(request), current, size));
    }

    @GetMapping("/exports/{id}/download")
    public ResponseEntity<byte[]> download(@PathVariable String id, HttpServletRequest request) throws Exception {
        Map<String, Object> file = service.download(id, getCurrentUserId(request));
        String name = file.get("name").toString();
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + URLEncoder.encode(name, "UTF-8").replace("+", "%20"))
                .contentType(name.endsWith(".json") ? MediaType.APPLICATION_JSON_UTF8 : MediaType.parseMediaType("application/zip"))
                .body((byte[]) file.get("bytes"));
    }

    @GetMapping("/audit")
    public R<Map<String, Object>> audit(@RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "1") int current, @RequestParam(defaultValue = "10") int size, HttpServletRequest request) {
        return success(logs.list(getCurrentUserId(request), ProjectRecipeController.administrator(), keyword, current, size));
    }
}
