package com.wugui.datax.admin.tool.meta;

public interface DatabaseInterface {

    /**
     * Returns the minimal SQL to launch in order to determine the layout of the resultset for a given com.com.wugui.datax.admin.tool.database table
     *
     * @param tableName The name of the table to determine the layout for
     * @return The SQL to launch.
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
     * @return The SQL to launch.
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
     * @return The SQL to launch.
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
