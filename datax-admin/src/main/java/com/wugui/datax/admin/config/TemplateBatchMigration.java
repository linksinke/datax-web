package com.wugui.datax.admin.config;

import com.wugui.datax.admin.core.util.TemplateBatchCodes;
import com.wugui.datax.admin.dto.DataXJsonBuildDto;
import com.wugui.datax.admin.service.TemplateConfigJson;

import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.time.LocalDate;
import java.util.*;

/** 幂等归并历史模板批次，保留原 JSON 内容和文件名。 */
final class TemplateBatchMigration {
    private TemplateBatchMigration() {
    }

    static void migrate(Connection connection) throws SQLException {
        Map<String, List<Long>> groups = new LinkedHashMap<>();
        Map<String, String> names = new HashMap<>();
        Map<String, Integer> owners = new HashMap<>();
        Map<String, Timestamp> times = new HashMap<>();
        String sql = "SELECT t.id,t.owner_id,t.build_config,t.create_time FROM job_json_template t LEFT JOIN job_json_batch_item i ON i.template_id=t.id WHERE i.template_id IS NULL ORDER BY t.create_time,t.id";
        try (Statement select = connection.createStatement(); ResultSet rows = select.executeQuery(sql)) {
            while (rows.next()) {
                long id = rows.getLong("id");
                int owner = rows.getInt("owner_id");
                DataXJsonBuildDto config = TemplateConfigJson.read(rows.getString("build_config"));
                String old = config.getBatchId();
                if (old == null || old.trim().isEmpty()) old = "single-" + id;
                String group = "legacy-" + owner + "-" + UUID.nameUUIDFromBytes(old.getBytes(StandardCharsets.UTF_8)).toString().replace("-", "");
                groups.computeIfAbsent(group, ignored -> new ArrayList<>()).add(id);
                names.putIfAbsent(group, config.getBatchName() == null ? "历史模板" : config.getBatchName());
                owners.put(group, owner);
                times.putIfAbsent(group, rows.getTimestamp("create_time"));
            }
        }
        for (Map.Entry<String, List<Long>> group : groups.entrySet()) {
            boolean exists;
            try (PreparedStatement select = connection.prepareStatement("SELECT id FROM job_json_batch WHERE id=?")) {
                select.setString(1, group.getKey());
                try (ResultSet row = select.executeQuery()) {
                    exists = row.next();
                }
            }
            if (!exists) {
                Timestamp created = times.get(group.getKey());
                LocalDate day = created == null ? LocalDate.now(TemplateBatchCodes.ZONE) : created.toLocalDateTime().toLocalDate();
                String code = TemplateBatchCodes.next(connection, day);
                try (PreparedStatement insert = connection.prepareStatement("INSERT INTO job_json_batch (id,batch_code,owner_id,name,create_time) VALUES (?,?,?,?,?)")) {
                    insert.setString(1, group.getKey());
                    insert.setString(2, code);
                    insert.setInt(3, owners.get(group.getKey()));
                    String name = names.get(group.getKey());
                    insert.setString(4, name.length() > 100 ? name.substring(0, 100) : name);
                    insert.setTimestamp(5, created == null ? new Timestamp(System.currentTimeMillis()) : created);
                    insert.executeUpdate();
                }
            }
            try (PreparedStatement link = connection.prepareStatement("INSERT IGNORE INTO job_json_batch_item (template_id,batch_id) VALUES (?,?)")) {
                for (Long id : group.getValue()) {
                    link.setLong(1, id);
                    link.setString(2, group.getKey());
                    link.addBatch();
                }
                link.executeBatch();
            }
        }
    }
}
