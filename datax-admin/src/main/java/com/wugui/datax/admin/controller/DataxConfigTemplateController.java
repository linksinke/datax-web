package com.wugui.datax.admin.controller;

import com.baomidou.mybatisplus.extension.api.R;
import com.wugui.datax.admin.dto.*;
import com.wugui.datax.admin.service.DataxConfigTemplateService;
import org.springframework.web.bind.annotation.*;
import javax.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.List;
import java.io.IOException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api/dataxConfigTemplate")
public class DataxConfigTemplateController extends BaseController {
    private final DataxConfigTemplateService service;
    public DataxConfigTemplateController(DataxConfigTemplateService service) { this.service = service; }

    @GetMapping
    public R<Map<String, Object>> list(@RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "1") int current, @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String batchId,
            HttpServletRequest request) {
        return success(service.list(getCurrentUserId(request), keyword, current, size, batchId));
    }

    @GetMapping("/batches")
    public R<Map<String, Object>> batches(@RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "1") int current, @RequestParam(defaultValue = "10") int size, HttpServletRequest request) {
        return success(service.listBatches(getCurrentUserId(request), keyword, current, size));
    }

    @GetMapping("/batches/{id}/download")
    public ResponseEntity<byte[]> downloadGroup(@PathVariable String id, HttpServletRequest request) throws IOException {
        int owner = getCurrentUserId(request);
        String code = service.getBatch(id, owner).get("batchCode").toString();
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + code + ".zip")
                .contentType(MediaType.parseMediaType("application/zip")).body(service.downloadBatchGroup(id, owner));
    }

    @GetMapping("/{id}")
    public R<DataxConfigTemplateDto> get(@PathVariable long id, HttpServletRequest request) {
        return success(service.get(id, getCurrentUserId(request)));
    }

    @PostMapping("/generate")
    public R<String> generate(@RequestBody DataXJsonBuildDto config) { return success(service.generate(config)); }

    @PostMapping("/batchGenerate")
    public R<List<DataxConfigTemplateDto>> generateBatch(@RequestBody DataxTemplateBatchDto batch, HttpServletRequest request) {
        return success(service.generateBatch(batch, getCurrentUserId(request)));
    }

    @PostMapping("/downloadBatch")
    public ResponseEntity<byte[]> downloadBatch(@RequestBody List<Long> ids, HttpServletRequest request) throws IOException {
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=datax-templates.zip")
                .contentType(MediaType.parseMediaType("application/zip"))
                .body(service.downloadBatch(ids, getCurrentUserId(request)));
    }

    @PostMapping
    public R<DataxConfigTemplateDto> save(@RequestBody DataxConfigTemplateDto dto, HttpServletRequest request) {
        return success(service.save(dto, getCurrentUserId(request)));
    }

    @DeleteMapping("/{id}")
    public R<Boolean> delete(@PathVariable long id, HttpServletRequest request) {
        service.delete(id, getCurrentUserId(request));
        return success(true);
    }
}
