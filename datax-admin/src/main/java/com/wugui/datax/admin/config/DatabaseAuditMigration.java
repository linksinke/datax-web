package com.wugui.datax.admin.config;

import org.springframework.core.io.ClassPathResource;

import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.util.*;

/** 增量补齐管理库注释和审计字段；保留原列类型、默认值及历史业务数据。 */
public final class DatabaseAuditMigration {
    private static final List<String> AUDIT = Arrays.asList("created_at", "created_by", "updated_at", "updated_by");

    private DatabaseAuditMigration() { }

    public static void migrate(Connection connection) throws Exception {
        Properties comments = new Properties();
        try (InputStreamReader reader = new InputStreamReader(new ClassPathResource(
                "db/bootstrap/comments.properties").getInputStream(), StandardCharsets.UTF_8)) {
            comments.load(reader);
        }
        Set<String> tables = new TreeSet<>();
        for (String key : comments.stringPropertyNames()) if (key.endsWith(".@table")) tables.add(key.split("\\.")[0]);
        for (String table : tables) migrateTable(connection, table, comments);
    }

    private static void migrateTable(Connection connection, String table, Properties comments) throws SQLException {
        Map<String, Map<String, Object>> columns = columns(connection, table);
        if ("job_async_operation".equals(table)) {
            if (!columns.containsKey("worker_id")) execute(connection, "ALTER TABLE job_async_operation ADD COLUMN worker_id VARCHAR(64) NULL COMMENT '执行节点租约标识'");
            if (!columns.containsKey("heartbeat_at")) execute(connection, "ALTER TABLE job_async_operation ADD COLUMN heartbeat_at DATETIME(6) NULL COMMENT '执行节点最近心跳时间'");
        }
        Set<String> added = new HashSet<>();
        for (String field : AUDIT) {
            if (!columns.containsKey(field)) {
                execute(connection, "ALTER TABLE " + id(table) + " ADD COLUMN " + id(field)
                        + (field.endsWith("_at") ? " DATETIME(6)" : " VARCHAR(128)") + " NULL DEFAULT NULL COMMENT "
                        + literal(comments.getProperty(table + "." + field)));
                added.add(field);
            }
        }
        if (!added.isEmpty()) backfill(connection, table, columns.keySet(), added);
        columns = columns(connection, table);
        for (Map.Entry<String, Map<String, Object>> entry : columns.entrySet()) {
            String field = entry.getKey();
            Map<String, Object> column = entry.getValue();
            String comment = comments.getProperty(table + "." + field);
            if (comment == null) continue;
            if (AUDIT.contains(field)) {
                String actual = String.valueOf(column.get("Type"));
                String type = field.endsWith("_at") ? "DATETIME(6)" : "VARCHAR(128)";
                if (!field.endsWith("_at") && actual.matches("(?i)varchar\\(\\d+\\)")) {
                    int length = Integer.parseInt(actual.replaceAll("\\D", ""));
                    if (length > 128) type = actual; // 不缩短已有的账号字段。
                }
                String defaultValue = field.endsWith("_at") ? "CURRENT_TIMESTAMP(6)" : "'system'";
                boolean shapeChanged = !type.equalsIgnoreCase(String.valueOf(column.get("Type")))
                        || !"NO".equals(column.get("Null"))
                        || !(field.endsWith("_at") ? "CURRENT_TIMESTAMP(6)".equalsIgnoreCase(String.valueOf(column.get("Default")))
                            : "system".equals(column.get("Default")));
                if (shapeChanged || !comment.equals(column.get("Comment"))) {
                    execute(connection, "UPDATE " + id(table) + " SET " + id(field) + "=" + defaultValue + " WHERE " + id(field) + " IS NULL");
                    execute(connection, "ALTER TABLE " + id(table) + " MODIFY COLUMN " + id(field) + " " + type
                            + " NOT NULL DEFAULT " + defaultValue + " COMMENT " + literal(comment));
                }
            } else if (!comment.equals(column.get("Comment"))) {
                execute(connection, "ALTER TABLE " + id(table) + " MODIFY COLUMN " + id(field) + " "
                        + definition(column) + " COMMENT " + literal(comment));
            }
        }
        try (PreparedStatement statement = connection.prepareStatement(
                "SELECT TABLE_COMMENT FROM information_schema.tables WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?")) {
            statement.setString(1, table);
            try (ResultSet result = statement.executeQuery()) {
                if (result.next() && !comments.getProperty(table + ".@table").equals(result.getString(1)))
                    execute(connection, "ALTER TABLE " + id(table) + " COMMENT=" + literal(comments.getProperty(table + ".@table")));
            }
        }
        trigger(connection, table, "bi", "BEFORE INSERT", "SET NEW.created_at=COALESCE(NEW.created_at,CURRENT_TIMESTAMP(6)), "
                + "NEW.updated_at=COALESCE(NEW.updated_at,NEW.created_at), "
                + "NEW.created_by=COALESCE(NULLIF(@datax_actor,''),NULLIF(NEW.created_by,''),'system'), "
                + "NEW.updated_by=COALESCE(NULLIF(@datax_actor,''),NULLIF(NEW.updated_by,''),'system')");
        trigger(connection, table, "bu", "BEFORE UPDATE", "SET NEW.created_at=OLD.created_at, NEW.created_by=OLD.created_by, "
                + "NEW.updated_at=CURRENT_TIMESTAMP(6), NEW.updated_by=COALESCE(NULLIF(@datax_actor,''),'system')");
    }

    private static void backfill(Connection connection, String table, Set<String> existing, Set<String> added) throws SQLException {
        List<String> assignments = new ArrayList<>();
        String created = coalesce(existing, Arrays.asList("create_time", "create_date", "add_time"), "CURRENT_TIMESTAMP(6)");
        String updated = coalesce(existing, Arrays.asList("update_time", "update_date", "glue_updatetime"), created);
        String actor = coalesce(existing, Arrays.asList("create_by", "user_id", "owner_id"), "'system'");
        for (String field : AUDIT) if (added.contains(field)) {
            String value = field.equals("created_at") ? created : field.equals("updated_at") ? updated : actor;
            assignments.add(id(field) + "=" + value);
        }
        execute(connection, "UPDATE " + id(table) + " SET " + String.join(",", assignments));
    }

    private static String coalesce(Set<String> columns, List<String> candidates, String fallback) {
        List<String> values = new ArrayList<>();
        for (String candidate : candidates) if (columns.contains(candidate)) {
            values.add(candidate.endsWith("_by") || candidate.endsWith("_id")
                    ? "NULLIF(NULLIF(CAST(" + id(candidate) + " AS CHAR),''),'0')" : id(candidate));
        }
        values.add(fallback);
        return values.size() == 1 ? fallback : "COALESCE(" + String.join(",", values) + ")";
    }

    private static Map<String, Map<String, Object>> columns(Connection connection, String table) throws SQLException {
        Map<String, Map<String, Object>> result = new LinkedHashMap<>();
        try (Statement statement = connection.createStatement(); ResultSet rows = statement.executeQuery("SHOW FULL COLUMNS FROM " + id(table))) {
            while (rows.next()) {
                Map<String, Object> column = new HashMap<>();
                for (String key : Arrays.asList("Field", "Type", "Collation", "Null", "Default", "Extra", "Comment")) column.put(key, rows.getObject(key));
                result.put(rows.getString("Field"), column);
            }
        }
        return result;
    }

    private static String definition(Map<String, Object> column) {
        String result = column.get("Type").toString();
        if (column.get("Collation") != null) result += " COLLATE " + column.get("Collation");
        boolean nullable = "YES".equals(column.get("Null"));
        result += nullable ? " NULL" : " NOT NULL";
        Object defaultValue = column.get("Default");
        if (defaultValue != null) {
            String text = defaultValue.toString();
            result += " DEFAULT " + (text.matches("(?i)current_timestamp(?:\\(\\d*\\))?") ? text : literal(text));
        } else if (nullable) result += " DEFAULT NULL";
        String extra = String.valueOf(column.get("Extra")).replaceAll("(?i)DEFAULT_GENERATED", "").trim();
        if (!extra.isEmpty()) result += " " + extra;
        return result;
    }

    private static void trigger(Connection connection, String table, String suffix, String event, String body) throws SQLException {
        String name = "trg_dx_" + table + "_" + suffix;
        try (PreparedStatement statement = connection.prepareStatement(
                "SELECT COUNT(*) FROM information_schema.triggers WHERE TRIGGER_SCHEMA=DATABASE() AND TRIGGER_NAME=?")) {
            statement.setString(1, name);
            try (ResultSet result = statement.executeQuery()) {
                result.next();
                if (result.getInt(1) != 0) return;
            }
        }
        execute(connection, "CREATE TRIGGER " + id(name) + " " + event + " ON " + id(table) + " FOR EACH ROW " + body);
    }

    private static String id(String value) {
        if (!value.matches("[a-zA-Z0-9_]+")) throw new IllegalArgumentException("管理库标识无效");
        return "`" + value + "`";
    }

    private static String literal(String value) { return "'" + value.replace("'", "''") + "'"; }

    private static void execute(Connection connection, String sql) throws SQLException {
        try (Statement statement = connection.createStatement()) { statement.execute(sql); }
    }
}
