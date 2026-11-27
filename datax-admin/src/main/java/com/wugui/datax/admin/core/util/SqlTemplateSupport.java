package com.wugui.datax.admin.core.util;

import org.springframework.util.Assert;
import java.util.*;
import java.util.stream.Collectors;

/** SQL 模板只展开当前表名；前后置语句仅写入 DataX 配置，不在管理端执行。 */
public final class SqlTemplateSupport {
    private SqlTemplateSupport() { }

    public static String expandTable(String sql, String table, String databaseType) {
        if (sql == null || !sql.contains("{{table}}")) return sql;
        Assert.hasText(table, "请选择用于替换SQL占位符的表");
        String quoted = Arrays.stream(table.split("\\.", -1)).map(part -> quote(part, databaseType)).collect(Collectors.joining("."));
        return sql.replace("{{table}}", quoted);
    }

    private static String quote(String name, String databaseType) {
        Assert.isTrue(!name.isEmpty() && name.length() <= 255, "表名无效");
        if ("mysql".equals(databaseType) || "clickhouse".equals(databaseType)) return "`" + name.replace("`", "``") + "`";
        if ("sqlserver".equals(databaseType)) return "[" + name.replace("]", "]]") + "]";
        return "\"" + name.replace("\"", "\"\"") + "\"";
    }

    /** 按语句边界拆分，保留字符串、引用标识符及注释内的分号和换行。 */
    public static String[] statements(String sql) {
        if (sql == null || sql.trim().isEmpty()) return new String[0];
        List<String> result = new ArrayList<>();
        int start = 0; char quote = 0; boolean lineComment = false, blockComment = false;
        for (int index = 0; index < sql.length(); index++) {
            char current = sql.charAt(index), next = index + 1 < sql.length() ? sql.charAt(index + 1) : 0;
            if (lineComment) { if (current == '\n' || current == '\r') lineComment = false; continue; }
            if (blockComment) { if (current == '*' && next == '/') { blockComment = false; index++; } continue; }
            if (quote != 0) {
                if (current == '\\' && quote != ']') { index++; continue; }
                if (current == quote) { if (next == quote) index++; else quote = 0; }
                continue;
            }
            if (current == '-' && next == '-') { lineComment = true; index++; }
            else if (current == '/' && next == '*') { blockComment = true; index++; }
            else if (current == '\'' || current == '"' || current == '`') quote = current;
            else if (current == '[') quote = ']';
            else if (current == ';') { add(result,sql.substring(start,index)); start = index + 1; }
        }
        Assert.isTrue(quote == 0 && !blockComment, "前后置SQL存在未闭合的字符串、标识符或注释");
        add(result,sql.substring(start)); return result.toArray(new String[0]);
    }

    private static void add(List<String> result, String value) { if (!value.trim().isEmpty()) result.add(value.trim()); }
}
