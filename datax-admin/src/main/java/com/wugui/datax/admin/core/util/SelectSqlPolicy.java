package com.wugui.datax.admin.core.util;

import net.sf.jsqlparser.parser.CCJSqlParserUtil;
import net.sf.jsqlparser.statement.select.Select;
import org.springframework.util.Assert;


/** 查询方案只接受单条只读 SELECT；表名占位符按数据库类型安全引用。 */
public final class SelectSqlPolicy {
    private SelectSqlPolicy() { }

    public static String expand(String sql, String table, String databaseType) {
        Assert.hasText(sql, "请输入读取SQL");
        Assert.isTrue(sql.length() <= 100000, "读取SQL不能超过100000个字符");
        String value = sql.trim().replaceFirst(";\\s*$", "");
        value = SqlTemplateSupport.expandTable(value, table, databaseType);
        try {
            Assert.isTrue(CCJSqlParserUtil.parseStatements(value).getStatements().size() == 1
                    && CCJSqlParserUtil.parse(value) instanceof Select, "只允许一条SELECT查询");
        } catch (IllegalArgumentException failure) { throw failure; }
        catch (Exception failure) { throw new IllegalArgumentException("SQL语法无法解析，请提供完整SELECT查询"); }
        // 这些语法会写文件、加锁或主动阻塞，不属于结构读取。
        String normalized = value.replaceAll("'([^']|'')*'", "''").replaceAll("(?s)/\\*.*?\\*/|--[^\\r\\n]*", " ");
        Assert.isTrue(!normalized.matches("(?is).*(?:\\b(?:into|for\\s+update|lock\\s+in)\\b|\\b(?:sleep|pg_sleep|benchmark|load_file)\\s*\\().*"),
                "结构查询不允许写入、加锁或阻塞语句");
        return value;
    }

}
