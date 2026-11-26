package com.wugui.datax.admin.tool.pojo;

import com.wugui.datax.admin.dto.Range;
import com.wugui.datax.admin.dto.VersionColumn;
import com.wugui.datax.admin.entity.JobDatasource;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class DataxHbasePojo {

    /** 列信息 */
    private List<Map<String, Object>> columns;

    /** 数据源信息 */
    private JobDatasource jdbcDatasource;

    /** 读取HBase配置 */
    private String readerHbaseConfig;

    /** 读取表名 */
    private String readerTable;

    /** 读取模式 */
    private String readerMode;

    /** 读取最大版本 */
    private String readerMaxVersion;

    /** 读取范围 */
    private Range readerRange;

    /** 写入HBase配置 */
    private String writerHbaseConfig;

    /** 写入表名 */
    private String writerTable;

    /** 写入模式 */
    private String writerMode;

    /** 写入版本列 */
    private VersionColumn writerVersionColumn;

    /** 写入行键列 */
    private String writerRowkeyColumn;

}
