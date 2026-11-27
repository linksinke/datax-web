package com.wugui.datax.admin.tool.meta;

public interface DatabaseInterface {

    /**
     * 返回用于确定指定表结果集结构的最小查询语句。
     *
     * @param tableName 需要读取结果集结构的表名
     * @return 用于读取结果集结构的查询语句
     */
    String getSQLQueryFields(String tableName);

    /**
     * 获取主键字段
     *
     * @return
     */
    String getSQLQueryPrimaryKey();

    /**
     * 获取表注释
     *
     * @return
     */
    String getSQLQueryTableNameComment();

    /**
     * 获取所有表名和注释
     *
     * @return
     */
    String getSQLQueryTablesNameComments();

    /**
     * 获取所有表名的sql
     *
     * @return
     */
    String getSQLQueryTables(String... tableSchema);

    /**
     * 获取所有表名的sql
     *
     * @return
     */
    String getSQLQueryTables();

    /**
     * 获取表的schema
     *
     * @param args 表名
     * @return 用于读取结果集结构的查询语句
     */
    String getSQLQueryTableSchema(String... args);

    /**
     * 获取所有的字段的sql
     *
     * @return
     */
    String getSQLQueryColumns(String... args);

    /**
     * 获取表和字段注释的sql语句
     *
     * @return 用于读取结果集结构的查询语句
     */
    String getSQLQueryComment(String schemaName, String tableName, String columnName);


    /**
     * 获取当前表maxId
     *
     * @param tableName 表名
     * @param primaryKey 主键
     * @return String maxId 主键最大值
     */
    String getMaxId(String tableName, String primaryKey);

}
