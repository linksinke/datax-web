package com.wugui.datax.admin.core.util;

import com.wugui.datax.admin.entity.JobDatasource;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/** 连接缓存键包含数据库、凭据和数据源类型，避免同名连接串用。 */
public final class DatasourceCacheKey {
    private DatasourceCacheKey() {
    }

    public static String of(JobDatasource source) {
        StringBuilder identity = new StringBuilder();
        Object[] values = {source.getId(), source.getDatasource(), source.getJdbcUrl(),
                source.getJdbcDriverClass(), source.getJdbcUsername(), source.getJdbcPassword(),
                source.getZkAdress(), source.getDatabaseName()};
        for (Object value : values) {
            String text = value == null ? "" : value.toString();
            identity.append(text.length()).append(':').append(text);
        }
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(identity.toString().getBytes(StandardCharsets.UTF_8));
            StringBuilder key = new StringBuilder("datasource:");
            for (byte item : digest) {
                key.append(Character.forDigit((item >>> 4) & 15, 16));
                key.append(Character.forDigit(item & 15, 16));
            }
            return key.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is unavailable", e);
        }
    }
}
