package com.wugui.datax.admin.service.workbench;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.wugui.datatx.core.biz.model.ReturnT;
import com.wugui.datax.admin.core.util.OperationActor;
import com.wugui.datax.admin.dto.*;
import com.wugui.datax.admin.entity.JobTemplate;
import com.wugui.datax.admin.service.DataxConfigTemplateService;
import com.wugui.datax.admin.service.JobTemplateService;
import com.wugui.datax.admin.util.AESUtil;
import org.springframework.beans.BeanUtils;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.DependsOn;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.Assert;

import javax.annotation.PreDestroy;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import java.util.concurrent.*;

/** 持久化后台作业、完成通知和导出归档，所有结果按登录用户隔离。 */
@Service
@DependsOn("projectDatabaseInitializer")
public class WorkbenchService {
    private static final Set<String> KINDS = new HashSet<>(Arrays.asList("BATCH_GENERATE", "COPY_CONFIG_TEMPLATE",
            "COPY_JOB_TEMPLATE", "COPY_PROJECT_RECIPE", "EXPORT_BATCH", "EXPORT_SELECTION", "EXPORT_TEMPLATE"));
    private static final String JOB_COLUMNS = "id,kind,name,state,progress,message,DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%s') AS createdAt,"
            + "DATE_FORMAT(finished_at,'%Y-%m-%d %H:%i:%s') AS finishedAt,read_at AS readAt";
    private final JdbcTemplate jdbc;
    private final DataxConfigTemplateService templates;
    private final JobTemplateService schedulerTemplates;
    private final ProjectRecipeService recipes;
    private final OperationLogService logs;
    private final TransactionTemplate transactions;
    private final String workerId = UUID.randomUUID().toString();
    private final Set<String> scheduled = ConcurrentHashMap.newKeySet();
    private final ScheduledExecutorService dispatcher = Executors.newSingleThreadScheduledExecutor(task -> {
        Thread thread = new Thread(task, "datax-workbench-dispatch"); thread.setDaemon(true); return thread;
    });
    private final ThreadPoolExecutor workers = new ThreadPoolExecutor(2, 2, 0, TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(64), task -> {
                Thread thread = new Thread(task, "datax-workbench"); thread.setDaemon(true); return thread;
            }, new ThreadPoolExecutor.AbortPolicy());

    public WorkbenchService(JdbcTemplate jdbc, DataxConfigTemplateService templates, JobTemplateService schedulerTemplates,
                            ProjectRecipeService recipes, OperationLogService logs, PlatformTransactionManager transactionManager) {
        this.jdbc = jdbc; this.templates = templates; this.schedulerTemplates = schedulerTemplates;
        this.recipes = recipes; this.logs = logs; this.transactions = new TransactionTemplate(transactionManager);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void recover() {
        dispatcher.scheduleWithFixedDelay(this::dispatch, 0, 5, TimeUnit.SECONDS);
    }

    private void dispatch() {
        try {
            jdbc.update("UPDATE job_async_operation SET heartbeat_at=CURRENT_TIMESTAMP(6) WHERE state='RUNNING' AND worker_id=?", workerId);
            // 租约过期才处理遗留作业，不能把其他管理节点正在执行的作业误判为失败。
            jdbc.update("UPDATE job_async_operation SET state='FAILED',message='执行节点已离线，作业中断，请重新提交',finished_at=CURRENT_TIMESTAMP(6) "
                    + "WHERE state='RUNNING' AND COALESCE(heartbeat_at,started_at)<TIMESTAMPADD(SECOND,-120,CURRENT_TIMESTAMP(6))");
            int capacity = workers.getQueue().remainingCapacity();
            if (capacity > 0) for (String id : jdbc.queryForList("SELECT id FROM job_async_operation WHERE state='QUEUED' ORDER BY created_at LIMIT ?", String.class, capacity)) enqueue(id);
        } catch (RuntimeException failure) {
            org.slf4j.LoggerFactory.getLogger(WorkbenchService.class).error("后台作业调度检查失败", failure);
        }
    }

    public Map<String, Object> submit(WorkbenchOperationDto request, int owner) {
        Assert.notNull(request, "请选择后台操作");
        Assert.isTrue(KINDS.contains(request.getKind()), "不支持的后台操作");
        Assert.notNull(request.getPayload(), "缺少操作参数");
        Assert.hasText(request.getRequestKey(), "缺少提交标识，请刷新页面");
        Assert.isTrue(request.getRequestKey().length() <= 128, "提交标识过长");
        String payload = request.getPayload().toJSONString();
        Assert.isTrue(payload.length() <= 8 * 1024 * 1024, "本次配置过大，请拆分提交");
        String fingerprint = digest(request.getKind() + "\n" + payload);
        List<Map<String, Object>> existing = jdbc.queryForList("SELECT id,request_hash FROM job_async_operation WHERE owner_id=? AND request_key=?", owner, request.getRequestKey());
        if (!existing.isEmpty()) {
            Assert.isTrue(fingerprint.equals(existing.get(0).get("request_hash")), "提交标识已用于其他操作，请重新提交");
            return get(existing.get(0).get("id").toString(), owner);
        }
        Assert.isTrue(jdbc.queryForObject("SELECT COUNT(*) FROM job_async_operation WHERE owner_id=? AND state IN ('QUEUED','RUNNING')", Integer.class, owner) < 100,
                "排队作业较多，请等待现有作业完成后再提交");
        String id = UUID.randomUUID().toString();
        String encrypted = AESUtil.encrypt(payload);
        Assert.notNull(encrypted, "参数加密失败，请检查管理库密钥");
        String name = request.getName() == null || request.getName().trim().isEmpty() ? title(request.getKind()) : request.getName().trim();
        Assert.isTrue(name.length() <= 200, "操作名称不能超过200字");
        try {
            jdbc.update("INSERT INTO job_async_operation (id,owner_id,actor,kind,name,request_key,request_hash,request_payload,message) VALUES (?,?,?,?,?,?,?,?,?)",
                    id, owner, OperationActor.current(), request.getKind(), name, request.getRequestKey(), fingerprint, encrypted, "已进入后台队列");
        } catch (org.springframework.dao.DuplicateKeyException concurrent) {
            List<Map<String, Object>> rows = jdbc.queryForList("SELECT id,request_hash FROM job_async_operation WHERE owner_id=? AND request_key=?", owner, request.getRequestKey());
            Assert.isTrue(!rows.isEmpty() && fingerprint.equals(rows.get(0).get("request_hash")), "重复提交的操作参数不一致");
            return get(rows.get(0).get("id").toString(), owner);
        }
        enqueue(id);
        return get(id, owner);
    }

    private void enqueue(String id) {
        if (!scheduled.add(id)) return;
        try { workers.execute(() -> { try { run(id); } finally { scheduled.remove(id); } }); }
        catch (RejectedExecutionException full) {
            scheduled.remove(id); // 保留持久化排队状态，下一次调度会继续接手。
        }
    }

    private void run(String id) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM job_async_operation WHERE id=?", id);
        if (rows.isEmpty()) return;
        Map<String, Object> row = rows.get(0);
        int owner = ((Number) row.get("owner_id")).intValue();
        OperationActor.runAs(row.get("actor").toString(), () -> {
            if (jdbc.update("UPDATE job_async_operation SET state='RUNNING',progress=10,message='正在处理',worker_id=?,heartbeat_at=CURRENT_TIMESTAMP(6),started_at=CURRENT_TIMESTAMP(6) WHERE id=? AND state='QUEUED'", workerId, id) != 1) return;
            long start = System.currentTimeMillis();
            try {
                transactions.execute(status -> {
                    List<String> roles = jdbc.queryForList("SELECT role FROM job_user WHERE id=?", String.class, owner);
                    Assert.isTrue(!roles.isEmpty(), "提交用户不存在，作业已停止");
                    JSONObject input = JSON.parseObject(AESUtil.decrypt(row.get("request_payload").toString()));
                    JSONObject result;
                    try { result = perform(id, row.get("kind").toString(), input, owner, "ROLE_ADMIN".equals(roles.get(0))); }
                    catch (RuntimeException failure) { throw failure; }
                    catch (Exception failure) { throw new IllegalStateException("文件归档失败，请检查配置后重新提交", failure); }
                    String encrypted = AESUtil.encrypt(result.toJSONString());
                    Assert.notNull(encrypted, "结果加密失败");
                    jdbc.update("UPDATE job_async_operation SET state='SUCCEEDED',progress=100,message='处理完成',result_json=?,finished_at=CURRENT_TIMESTAMP(6) WHERE id=?", encrypted, id);
                    return result;
                });
                logs.record(owner, title(row.get("kind").toString()), "/workbench/" + id, "BACKGROUND", true,
                        "后台作业完成", System.currentTimeMillis() - start, id, "");
            } catch (Exception failure) {
                // 库异常可能包含SQL和地址，不将其直接写入通知或操作摘要。
                String message = failure instanceof IllegalArgumentException || failure instanceof IllegalStateException
                        ? failure.getMessage() : "处理失败，请检查配置或联系管理员查看服务日志";
                if (message == null) message = "处理失败，请重新提交";
                if (message.length() > 1000) message = message.substring(0, 1000);
                jdbc.update("UPDATE job_async_operation SET state='FAILED',message=?,finished_at=CURRENT_TIMESTAMP(6) WHERE id=? AND state='RUNNING'", message, id);
                logs.record(owner, title(row.get("kind").toString()), "/workbench/" + id, "BACKGROUND", false,
                        message, System.currentTimeMillis() - start, id, "");
            }
        });
    }

    private JSONObject perform(String operationId, String kind, JSONObject input, int owner, boolean administrator) throws Exception {
        JSONObject result = new JSONObject(true);
        if ("BATCH_GENERATE".equals(kind)) {
            JSONObject payload = input;
            if (input.getLong("recipeId") != null) {
                ProjectRecipeDto recipe = recipes.get(input.getLongValue("recipeId"));
                payload = recipe.getConfiguration();
                payload.put("name", recipe.getName());
            }
            DataxTemplateBatchDto batch = JSON.parseObject(payload.toJSONString(), DataxTemplateBatchDto.class);
            List<DataxConfigTemplateDto> generated = templates.generateBatch(batch, owner);
            result.put("batchId", generated.get(0).getBatchId()); result.put("batchCode", generated.get(0).getBatchCode());
            result.put("templateCount", generated.size()); result.put("templateId", generated.get(0).getId());
        } else if ("COPY_CONFIG_TEMPLATE".equals(kind)) {
            DataxConfigTemplateDto source = templates.get(input.getLongValue("id"), owner);
            source.setId(null); source.setVersion(null); source.setName(copyName(input.getString("name"), source.getName()));
            DataxConfigTemplateDto copied = templates.save(source, owner);
            result.put("templateId", copied.getId()); result.put("batchId", copied.getBatchId()); result.put("batchCode", copied.getBatchCode());
        } else if ("COPY_JOB_TEMPLATE".equals(kind)) {
            JobTemplate source = schedulerTemplates.getById(input.getIntValue("id"));
            Assert.isTrue(source != null && (administrator || source.getUserId() == owner), "调度模板不存在或无权复制");
            JobTemplate copy = new JobTemplate(); BeanUtils.copyProperties(source, copy);
            copy.setId(0); copy.setUserId(owner); copy.setJobDesc(copyName(input.getString("name"), source.getJobDesc()));
            copy.setTriggerLastTime(0); copy.setTriggerNextTime(0);
            ReturnT<String> saved = schedulerTemplates.add(copy);
            Assert.isTrue(saved.getCode() == ReturnT.SUCCESS_CODE, saved.getMsg());
            result.put("schedulerTemplateId", copy.getId()); result.put("name", copy.getJobDesc());
        } else if ("COPY_PROJECT_RECIPE".equals(kind)) {
            ProjectRecipeDto recipe = recipes.get(input.getLongValue("id"));
            recipe.setId(null); recipe.setVersion(null); recipe.setName(copyName(input.getString("name"), recipe.getName()));
            ProjectRecipeDto copy = recipes.save(recipe, owner, administrator);
            result.put("recipeId", copy.getId()); result.put("projectId", copy.getProjectId());
        } else {
            byte[] bytes; String name; String scope; int count;
            if ("EXPORT_BATCH".equals(kind)) {
                String batch = input.getString("batchId");
                Map<String, Object> group = templates.getBatch(batch, owner);
                List<Long> ids = jdbc.queryForList("SELECT t.id FROM job_json_template t JOIN job_json_batch_item i ON i.template_id=t.id WHERE i.batch_id=? AND t.owner_id=?", Long.class, batch, owner);
                checkExportSize(ids, owner); bytes = templates.downloadBatchGroup(batch, owner);
                name = group.get("batchCode") + ".zip"; scope = batch; count = ids.size();
            } else if ("EXPORT_TEMPLATE".equals(kind)) {
                long templateId = input.getLongValue("id"); checkExportSize(Collections.singletonList(templateId), owner);
                DataxConfigTemplateDto template = templates.get(templateId, owner);
                bytes = template.getJobJson().getBytes(StandardCharsets.UTF_8); name = template.getFileName();
                scope = String.valueOf(templateId); count = 1;
            } else {
                List<Long> ids = input.getJSONArray("ids") == null ? Collections.emptyList() : input.getJSONArray("ids").toJavaList(Long.class);
                checkExportSize(ids, owner); bytes = templates.downloadBatch(ids, owner);
                name = "datax-templates-" + operationId.substring(0, 8) + ".zip"; scope = "所选" + ids.size() + "份配置"; count = new HashSet<>(ids).size();
            }
            String fileId = UUID.randomUUID().toString();
            String encrypted = AESUtil.encrypt(Base64.getEncoder().encodeToString(bytes));
            Assert.notNull(encrypted, "导出文件归档失败");
            jdbc.update("INSERT INTO job_export_record (id,operation_id,owner_id,name,scope_type,scope_id,file_count,file_size,encrypted_content) VALUES (?,?,?,?,?,?,?,?,?)",
                    fileId, operationId, owner, name, kind, scope, count, bytes.length, encrypted);
            result.put("exportId", fileId); result.put("fileName", name); result.put("fileCount", count); result.put("fileSize", bytes.length);
        }
        return result;
    }

    private void checkExportSize(List<Long> ids, int owner) {
        Assert.isTrue(ids != null && !ids.isEmpty() && ids.size() <= 500 && !ids.contains(null), "请选择1至500份配置");
        long bytes = 0;
        for (Long id : new HashSet<>(ids)) {
            List<Long> sizes = jdbc.queryForList("SELECT OCTET_LENGTH(job_json) FROM job_json_template WHERE id=? AND owner_id=?", Long.class, id, owner);
            Assert.isTrue(!sizes.isEmpty(), "配置不存在或无权导出"); bytes += sizes.get(0);
            Assert.isTrue(bytes <= 32 * 1024 * 1024, "本次导出超过32MB，请分批导出");
        }
    }

    public Map<String, Object> get(String id, int owner) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT " + JOB_COLUMNS + ",result_json FROM job_async_operation WHERE id=? AND owner_id=?", id, owner);
        Assert.isTrue(!rows.isEmpty(), "后台作业不存在或无权访问");
        Map<String, Object> row = rows.get(0); Object encrypted = row.remove("result_json");
        row.put("result", encrypted == null ? null : JSON.parseObject(AESUtil.decrypt(encrypted.toString())));
        return row;
    }

    public Map<String, Object> retry(String id, int owner) {
        Map<String, Object> operation = get(id, owner);
        Assert.isTrue(Arrays.asList("FAILED", "CANCELLED").contains(operation.get("state")), "只有失败或已取消的作业可以重试");
        Map<String, Object> stored = jdbc.queryForMap("SELECT kind,name,request_payload FROM job_async_operation WHERE id=? AND owner_id=?", id, owner);
        WorkbenchOperationDto request = new WorkbenchOperationDto();
        request.setKind(stored.get("kind").toString()); request.setName(stored.get("name").toString());
        request.setRequestKey("retry:" + id); request.setPayload(JSON.parseObject(AESUtil.decrypt(stored.get("request_payload").toString())));
        return submit(request, owner);
    }

    public Map<String, Object> list(int owner, String state, int current, int size) {
        List<Object> args = new ArrayList<>(Collections.singletonList(owner));
        String where = " FROM job_async_operation WHERE owner_id=?";
        if (state != null && !state.isEmpty()) { where += " AND state=?"; args.add(state); }
        Map<String, Object> page = new LinkedHashMap<>();
        page.put("total", jdbc.queryForObject("SELECT COUNT(*)" + where, Long.class, args.toArray()));
        int limit = Math.max(1, Math.min(100, size)); args.add(limit); args.add((Math.max(1, current) - 1) * limit);
        page.put("records", jdbc.queryForList("SELECT " + JOB_COLUMNS + where + " ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?", args.toArray()));
        return page;
    }

    public Map<String, Object> notifications(int owner) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("unread", jdbc.queryForObject("SELECT COUNT(*) FROM job_async_operation WHERE owner_id=? AND finished_at IS NOT NULL AND read_at IS NULL", Long.class, owner));
        result.put("running", jdbc.queryForObject("SELECT COUNT(*) FROM job_async_operation WHERE owner_id=? AND state IN ('QUEUED','RUNNING')", Long.class, owner));
        result.put("records", jdbc.queryForList("SELECT " + JOB_COLUMNS + " FROM job_async_operation WHERE owner_id=? AND finished_at IS NOT NULL ORDER BY finished_at DESC LIMIT 20", owner));
        return result;
    }

    public void markRead(int owner, String id) {
        if (id == null || id.isEmpty()) jdbc.update("UPDATE job_async_operation SET read_at=CURRENT_TIMESTAMP(6) WHERE owner_id=? AND finished_at IS NOT NULL AND read_at IS NULL", owner);
        else jdbc.update("UPDATE job_async_operation SET read_at=CURRENT_TIMESTAMP(6) WHERE id=? AND owner_id=? AND finished_at IS NOT NULL", id, owner);
    }

    public void cancel(String id, int owner) {
        Assert.isTrue(jdbc.update("UPDATE job_async_operation SET state='CANCELLED',message='已取消排队作业',finished_at=CURRENT_TIMESTAMP(6) WHERE id=? AND owner_id=? AND state='QUEUED'", id, owner) == 1,
                "作业已开始或已结束，无法取消");
    }

    public Map<String, Object> exports(int owner, int current, int size) {
        Map<String, Object> page = new LinkedHashMap<>();
        page.put("total", jdbc.queryForObject("SELECT COUNT(*) FROM job_export_record WHERE owner_id=?", Long.class, owner));
        int limit = Math.max(1, Math.min(100, size));
        page.put("records", jdbc.queryForList("SELECT id,operation_id AS operationId,name,scope_type AS scopeType,scope_id AS scopeId,file_count AS fileCount,file_size AS fileSize,"
                + "download_count AS downloadCount,DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%s') AS createdAt FROM job_export_record WHERE owner_id=? ORDER BY created_at DESC LIMIT ? OFFSET ?", owner, limit, (Math.max(1, current) - 1) * limit));
        return page;
    }

    public Map<String, Object> download(String id, int owner) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT name,encrypted_content FROM job_export_record WHERE id=? AND owner_id=?", id, owner);
        Assert.isTrue(!rows.isEmpty(), "导出文件不存在或无权下载");
        Map<String, Object> result = new HashMap<>(); result.put("name", rows.get(0).get("name"));
        String content = AESUtil.decrypt(rows.get(0).get("encrypted_content").toString());
        Assert.notNull(content, "导出文件解密失败，请检查管理库密钥");
        result.put("bytes", Base64.getDecoder().decode(content));
        jdbc.update("UPDATE job_export_record SET download_count=download_count+1,last_downloaded_at=CURRENT_TIMESTAMP(6) WHERE id=? AND owner_id=?", id, owner);
        return result;
    }

    private static String copyName(String requested, String original) {
        String name = requested == null || requested.trim().isEmpty() ? (original.length() > 97 ? original.substring(0, 97) : original) + " 副本" : requested.trim();
        Assert.isTrue(name.length() <= 100, "副本名称不能超过100字"); return name;
    }

    private static String digest(String text) {
        try {
            StringBuilder value = new StringBuilder();
            for (byte b : MessageDigest.getInstance("SHA-256").digest(text.getBytes(StandardCharsets.UTF_8))) value.append(String.format("%02x", b & 255));
            return value.toString();
        } catch (Exception failure) { throw new IllegalStateException("无法计算请求摘要", failure); }
    }

    public static String title(String kind) {
        switch (kind) {
            case "BATCH_GENERATE": return "生成配置批次";
            case "COPY_CONFIG_TEMPLATE": return "复制配置模板";
            case "COPY_JOB_TEMPLATE": return "复制调度模板";
            case "COPY_PROJECT_RECIPE": return "复制项目方案";
            case "EXPORT_BATCH": return "导出配置批次";
            case "EXPORT_TEMPLATE": return "导出当前配置";
            default: return "导出所选配置";
        }
    }

    @PreDestroy
    public void stop() { dispatcher.shutdownNow(); workers.shutdownNow(); }
}
