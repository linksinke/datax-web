package com.wugui.datax.admin.tool.database;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 原始jdbc字段对象
 *
 * @author zhouhongfa@gz-yibo.com
 * @ClassName DasColumn
 * @Version 1.0
 * @since 2019/7/17 16:29
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class DasColumn {

    /** 字段名 */
    private String columnName;
    /** 字段类型 */
    private String columnTypeName;
    /** 字段类名 */
    private String columnClassName;
    /** 字段注释 */
    private String columnComment;
    /** 是否为空 */
    private int isNull;
    /** 是否主键 */
    private boolean isprimaryKey;

}
