package com.wugui.datax.admin.core.util;

import java.sql.*;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/** Database row locking makes daily codes unique across requests and admin instances. */
public final class TemplateBatchCodes {
    public static final ZoneId ZONE = ZoneId.of("Asia/Shanghai");

    private TemplateBatchCodes() {
    }

    public static String next(Connection connection, LocalDate day) throws SQLException {
        boolean ownTransaction = connection.getAutoCommit();
        if (ownTransaction) connection.setAutoCommit(false);
        try {
            try (PreparedStatement update = connection.prepareStatement("INSERT INTO job_json_batch_sequence (issue_day,current_value) VALUES (?,1) ON DUPLICATE KEY UPDATE current_value=current_value+1")) {
                update.setDate(1, Date.valueOf(day));
                update.executeUpdate();
            }
            long value;
            try (PreparedStatement select = connection.prepareStatement("SELECT current_value FROM job_json_batch_sequence WHERE issue_day=? FOR UPDATE")) {
                select.setDate(1, Date.valueOf(day));
                try (ResultSet rows = select.executeQuery()) {
                    if (!rows.next()) throw new SQLException("批次发号失败");
                    value = rows.getLong(1);
                }
            }
            if (ownTransaction) connection.commit();
            return "BST" + day.format(DateTimeFormatter.BASIC_ISO_DATE) + String.format(Locale.ROOT, "%03d", value);
        } catch (SQLException error) {
            if (ownTransaction) connection.rollback();
            throw error;
        } finally {
            if (ownTransaction) connection.setAutoCommit(true);
        }
    }
}
