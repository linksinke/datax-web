package com.wugui.datax.admin.service.workbench;

import com.wugui.datax.admin.core.util.OperationActor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

/** 仅保存操作摘要，不记录请求正文、SQL全文、连接密码或访问令牌。 */
@Service
public class OperationLogService {
    private static final Logger LOGGER = LoggerFactory.getLogger(OperationLogService.class);
    private final JdbcTemplate jdbc;

    public OperationLogService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public void record(Integer owner, String action, String resource, String method, boolean success,
                       String message, long duration, String requestId, String address) {
        try {
            jdbc.update("INSERT INTO job_operation_log (owner_id,actor,action,resource,request_method,result,message,duration_ms,request_id,client_address) "
                            + "VALUES (?,?,?,?,?,?,?,?,?,?)", owner, OperationActor.current(), truncate(action, 100), truncate(resource, 255), method,
                    success ? "SUCCESS" : "FAILED", truncate(message, 1000), Math.max(0, duration), requestId, truncate(address, 128));
        } catch (RuntimeException failure) {
            LOGGER.error("操作留痕写入失败，追踪标识：{}", requestId, failure);
        }
    }

    public Map<String, Object> list(int owner, boolean administrator, String keyword, int current, int size) {
        List<Object> args = new ArrayList<>();
        String where = " FROM job_operation_log WHERE 1=1";
        if (!administrator) { where += " AND owner_id=?"; args.add(owner); }
        if (keyword != null && !keyword.trim().isEmpty()) {
            where += " AND (action LIKE ? OR resource LIKE ? OR actor LIKE ?)";
            String term = "%" + keyword.trim().replace("%", "\\%").replace("_", "\\_") + "%";
            args.add(term); args.add(term); args.add(term);
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", jdbc.queryForObject("SELECT COUNT(*)" + where, Long.class, args.toArray()));
        int limit = Math.max(1, Math.min(100, size)); args.add(limit); args.add((Math.max(1, current) - 1) * limit);
        result.put("records", jdbc.queryForList("SELECT id,actor,action,resource,request_method AS method,result,message,duration_ms AS durationMs,"
                + "request_id AS requestId,client_address AS clientAddress,DATE_FORMAT(created_at,'%Y-%m-%d %H:%i:%s') AS createdAt"
                + where + " ORDER BY id DESC LIMIT ? OFFSET ?", args.toArray()));
        return result;
    }

    private static String truncate(String value, int limit) {
        if (value == null) return "";
        return value.length() <= limit ? value : value.substring(0, limit);
    }
}
