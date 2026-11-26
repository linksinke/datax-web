package com.wugui.datax.admin.tool.datax;


import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableMap;
import com.google.common.collect.Lists;
import com.google.common.collect.Maps;
import com.wugui.datatx.core.util.Constants;
import com.wugui.datax.admin.dto.*;
import com.wugui.datax.admin.entity.JobDatasource;
import com.wugui.datax.admin.tool.datax.reader.*;
import com.wugui.datax.admin.tool.datax.writer.*;
import com.wugui.datax.admin.tool.pojo.DataxHbasePojo;
import com.wugui.datax.admin.tool.pojo.DataxHivePojo;
import com.wugui.datax.admin.tool.pojo.DataxMongoDBPojo;
import com.wugui.datax.admin.tool.pojo.DataxRdbmsPojo;
import com.wugui.datax.admin.util.JdbcConstants;
import lombok.Data;
import org.apache.commons.lang3.StringUtils;
import org.springframework.util.CollectionUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static com.wugui.datax.admin.util.JdbcConstants.*;

/**
 * 构建 com.wugui.datax json的工具类
 *
 * @author jingwk
 * @ClassName DataxJsonHelper
 * @Version 2.1.1
 * @since 2020/03/14 08:24
 */
@Data
public class DataxJsonHelper implements DataxJsonInterface {

    /**
     * 读取的表，根据datax示例，支持多个表（先不考虑，后面再去实现， 这里先用list保存吧）
     * <p>
     * 目的表的表名称。支持写入一个或者多个表。当配置为多张表时，必须确保所有表结构保持一致
     */
    private List<String> readerTables;
    /**
     * 读取的字段列表
     */
    private List<String> readerColumns;
    /**
     * reader jdbc 数据源
     */
    private JobDatasource readerDatasource;
    /**
     * writer jdbc 数据源
     */
    private JobDatasource writerDatasource;
    /**
     * 写入的表
     */
    private List<String> writerTables;
    /**
     * 写入的字段列表
     */
    private List<String> writerColumns;

    /**
     * 构建 reader
     */
    private Map<String, Object> buildReader;
    /**
     * 构建 writer
     */
    private Map<String, Object> buildWriter;
    /**
     * reader 插件
     */
    private BaseDataxPlugin readerPlugin;
    /**
     * writer 插件
     */
    private BaseDataxPlugin writerPlugin;
    /**
     * hive reader
     */
    private HiveReaderDto hiveReaderDto;
    /**
     * hive writer
     */
    private HiveWriterDto hiveWriterDto;
    /**
     * hbase reader
     */
    private HbaseReaderDto hbaseReaderDto;
    /**
     * hbase writer
     */
    private HbaseWriterDto hbaseWriterDto;
    /**
     * rdbms reader
     */
    private RdbmsReaderDto rdbmsReaderDto;
    /**
     * rdbms writer
     */
    private RdbmsWriterDto rdbmsWriterDto;

    /**
     * mongodb reader
     */
    private MongoDBReaderDto mongoDBReaderDto;
    /**
     * mongodb writer
     */
    private MongoDBWriterDto mongoDBWriterDto;


    /** 额外的参数 */
    private Map<String, Object> extraParams = Maps.newHashMap();

    /**
     * 初始化 reader
     */
    public void initReader(DataXJsonBuildDto dataxJsonDto, JobDatasource readerDatasource) {

        this.readerDatasource = JsonDatasourceCredentials.snapshot(readerDatasource);
        this.readerTables = dataxJsonDto.getReaderTables();
        this.readerColumns = dataxJsonDto.getReaderColumns();
        this.hiveReaderDto = dataxJsonDto.getHiveReader();
        this.rdbmsReaderDto = dataxJsonDto.getRdbmsReader();
        this.hbaseReaderDto = dataxJsonDto.getHbaseReader();
        // reader 插件
        String datasource = readerDatasource.getDatasource();

        this.readerColumns = convertKeywordsColumns(datasource, this.readerColumns);
        if (MYSQL.equals(datasource)) {
            readerPlugin = new MysqlReader();
            buildReader = buildReader();
        } else if (ORACLE.equals(datasource)) {
            readerPlugin = new OracleReader();
            buildReader = buildReader();
        } else if (SQL_SERVER.equals(datasource)) {
            readerPlugin = new SqlServerReader();
            buildReader = buildReader();
        } else if (POSTGRESQL.equals(datasource)) {
            readerPlugin = new PostgresqlReader();
            buildReader = buildReader();
        } else if (CLICKHOUSE.equals(datasource)) {
            readerPlugin = new ClickHouseReader();
            buildReader = buildReader();
        } else if (HIVE.equals(datasource)) {
            readerPlugin = new HiveReader();
            buildReader = buildHiveReader();
        } else if (HBASE.equals(datasource)) {
            readerPlugin = new HBaseReader();
            buildReader = buildHBaseReader();
        } else if (MONGODB.equals(datasource)) {
            readerPlugin = new MongoDBReader();
            buildReader = buildMongoDBReader();
        }
    }

    /**
     * 初始化 writer
     */
    public void initWriter(DataXJsonBuildDto dataxJsonDto, JobDatasource readerDatasource) {
        this.writerDatasource = JsonDatasourceCredentials.snapshot(readerDatasource);
        this.writerTables = dataxJsonDto.getWriterTables();
        this.writerColumns = dataxJsonDto.getWriterColumns();
        this.hiveWriterDto = dataxJsonDto.getHiveWriter();
        this.rdbmsWriterDto = dataxJsonDto.getRdbmsWriter();
        this.hbaseWriterDto = dataxJsonDto.getHbaseWriter();
        this.mongoDBWriterDto = dataxJsonDto.getMongoDBWriter();
        // writer
        String datasource = readerDatasource.getDatasource();
        this.writerColumns = convertKeywordsColumns(datasource, this.writerColumns);
        if (MYSQL.equals(datasource)) {
            writerPlugin = new MysqlWriter();
            buildWriter = this.buildWriter();
        } else if (ORACLE.equals(datasource)) {
            writerPlugin = new OraclelWriter();
            buildWriter = this.buildWriter();
        } else if (JdbcConstants.SQL_SERVER.equals(datasource)) {
            writerPlugin = new SqlServerlWriter();
            buildWriter = this.buildWriter();
        } else if (POSTGRESQL.equals(datasource)) {
            writerPlugin = new PostgresqllWriter();
            buildWriter = this.buildWriter();
        } else if (JdbcConstants.CLICKHOUSE.equals(datasource)) {
            writerPlugin = new ClickHouseWriter();
            buildWriter = buildWriter();
        } else if (JdbcConstants.HIVE.equals(datasource)) {
            writerPlugin = new HiveWriter();
            buildWriter = this.buildHiveWriter();
        } else if (JdbcConstants.HBASE.equals(datasource)) {
            writerPlugin = new HBaseWriter();
            buildWriter = this.buildHBaseWriter();
        } else if (JdbcConstants.MONGODB.equals(datasource)) {
            writerPlugin = new MongoDBWriter();
            buildWriter = this.buildMongoDBWriter();
        }
    }

    private List<String> convertKeywordsColumns(String datasource, List<String> columns) {
        if (columns == null) {
            return null;
        }

        List<String> toColumns = new ArrayList<>();
        columns.forEach(s -> {
            toColumns.add(doConvertKeywordsColumn(datasource, s));
        });
        return toColumns;
    }

    /**
     * 转换关键字为数据库支持的字段名称  例如：table  -> `table`
     */
    private String doConvertKeywordsColumn(String dbType, String column) {
        if (column == null) {
            return null;
        }

        column = column.trim();
        column = column.replace("[", "");
        column = column.replace("]", "");
        column = column.replace("`", "");
        column = column.replace("\"", "");
        column = column.replace("'", "");

        switch (dbType) {
            case MYSQL:
                return String.format("`%s`", column);
            case SQL_SERVER:
                return String.format("[%s]", column);
            case POSTGRESQL:
            case ORACLE:
                return String.format("\"%s\"", column);
            default:
                return column;
        }
    }

    @Override
    public Map<String, Object> buildJob() {
        Map<String, Object> res = Maps.newLinkedHashMap();
        Map<String, Object> jobMap = Maps.newLinkedHashMap();
        jobMap.put("setting", buildSetting());
        jobMap.put("content", ImmutableList.of(buildContent()));
        res.put("job", jobMap);
        return res;
    }

    @Override
    public Map<String, Object> buildSetting() {
        Map<String, Object> res = Maps.newLinkedHashMap();
        Map<String, Object> speedMap = Maps.newLinkedHashMap();
        Map<String, Object> errorLimitMap = Maps.newLinkedHashMap();

        // 这里设置速度， DataX 同时开启 1 个线程， 每秒传输的字节数上限
        speedMap.putAll(ImmutableMap.of("channel", 2, "byte", 1048576));

        // errorLimit: 设置任务允许的错误数据上限
        // 允许最多 100 条脏数据，或者脏数据占比不超过 2%；一旦超出任一限制，任务即告失败
        /*
            "setting": {
                "errorLimit": {
                    "record": 100,
                    "percentage": 0.02
                }
            }
         */
        // 这里不允许出现脏数据，一旦出现整个任务就中断，此时就需要查看相关的日志内容
        errorLimitMap.putAll(ImmutableMap.of("record", 0, "percentage", 0));
        res.put("speed", speedMap);
        res.put("errorLimit", errorLimitMap);
        return res;
    }

    @Override
    public Map<String, Object> buildContent() {
        Map<String, Object> res = Maps.newLinkedHashMap();
        res.put("reader", this.buildReader);
        res.put("writer", this.buildWriter);
        return res;
    }

    @Override
    public Map<String, Object> buildReader() {
        DataxRdbmsPojo dataxPluginPojo = new DataxRdbmsPojo();
        dataxPluginPojo.setJobDatasource(readerDatasource);
        dataxPluginPojo.setTables(readerTables);
        dataxPluginPojo.setRdbmsColumns(readerColumns);
        dataxPluginPojo.setSplitPk(rdbmsReaderDto.getReaderSplitPk());
        if (StringUtils.isNotBlank(rdbmsReaderDto.getQuerySql())) {
            dataxPluginPojo.setQuerySql(rdbmsReaderDto.getQuerySql());
        }
        //where
        if (StringUtils.isNotBlank(rdbmsReaderDto.getWhereParams())) {
            dataxPluginPojo.setWhereParam(rdbmsReaderDto.getWhereParams());
        }
        return readerPlugin.build(dataxPluginPojo);
    }

    @Override
    public Map<String, Object> buildHiveReader() {
        DataxHivePojo dataxHivePojo = new DataxHivePojo();
        dataxHivePojo.setJdbcDatasource(readerDatasource);
        List<Map<String, Object>> columns = Lists.newArrayList();
        readerColumns.forEach(c -> {
            Map<String, Object> column = Maps.newLinkedHashMap();
            column.put("index", c.split(Constants.SPLIT_SCOLON)[0]);
            column.put("type", c.split(Constants.SPLIT_SCOLON)[2]);
            columns.add(column);
        });
        dataxHivePojo.setColumns(columns);
        dataxHivePojo.setReaderDefaultFS(hiveReaderDto.getReaderDefaultFS());
        dataxHivePojo.setReaderFieldDelimiter(hiveReaderDto.getReaderFieldDelimiter());
        dataxHivePojo.setReaderFileType(hiveReaderDto.getReaderFileType());
        dataxHivePojo.setReaderPath(hiveReaderDto.getReaderPath());
        dataxHivePojo.setSkipHeader(hiveReaderDto.getReaderSkipHeader());
        return readerPlugin.buildHive(dataxHivePojo);
    }

    @Override
    public Map<String, Object> buildHBaseReader() {
        DataxHbasePojo dataxHbasePojo = new DataxHbasePojo();
        dataxHbasePojo.setJdbcDatasource(readerDatasource);
        List<Map<String, Object>> columns = Lists.newArrayList();
        for (int i = 0; i < readerColumns.size(); i++) {
            Map<String, Object> column = Maps.newLinkedHashMap();
            column.put("name", readerColumns.get(i));
            column.put("type", "string");
            columns.add(column);
        }
        dataxHbasePojo.setColumns(columns);
        dataxHbasePojo.setReaderHbaseConfig(readerDatasource.getZkAdress());
        String readerTable = !CollectionUtils.isEmpty(readerTables) ? readerTables.get(0) : Constants.STRING_BLANK;
        dataxHbasePojo.setReaderTable(readerTable);
        dataxHbasePojo.setReaderMode(hbaseReaderDto.getReaderMode());
        dataxHbasePojo.setReaderRange(hbaseReaderDto.getReaderRange());
        return readerPlugin.buildHbase(dataxHbasePojo);
    }

    @Override
    public Map<String, Object> buildMongoDBReader() {
        DataxMongoDBPojo dataxMongoDBPojo = new DataxMongoDBPojo();
        dataxMongoDBPojo.setJdbcDatasource(readerDatasource);
        List<Map<String, Object>> columns = Lists.newArrayList();
        buildColumns(readerColumns, columns);
        dataxMongoDBPojo.setColumns(columns);
        dataxMongoDBPojo.setAddress(readerDatasource.getJdbcUrl());
        dataxMongoDBPojo.setDbName(readerDatasource.getDatabaseName());
        dataxMongoDBPojo.setReaderTable(readerTables.get(0));
        return readerPlugin.buildMongoDB(dataxMongoDBPojo);
    }


    @Override
    public Map<String, Object> buildWriter() {
        DataxRdbmsPojo dataxPluginPojo = new DataxRdbmsPojo();
        dataxPluginPojo.setJobDatasource(writerDatasource);
        dataxPluginPojo.setTables(writerTables);
        dataxPluginPojo.setRdbmsColumns(writerColumns);
        dataxPluginPojo.setPreSql(rdbmsWriterDto.getPreSql());
        dataxPluginPojo.setPostSql(rdbmsWriterDto.getPostSql());
        return writerPlugin.build(dataxPluginPojo);
    }

    @Override
    public Map<String, Object> buildHiveWriter() {
        DataxHivePojo dataxHivePojo = new DataxHivePojo();
        dataxHivePojo.setJdbcDatasource(writerDatasource);
        List<Map<String, Object>> columns = Lists.newArrayList();
        writerColumns.forEach(c -> {
            Map<String, Object> column = Maps.newLinkedHashMap();
            column.put("name", c.split(Constants.SPLIT_SCOLON)[1]);
            column.put("type", c.split(Constants.SPLIT_SCOLON)[2]);
            columns.add(column);
        });
        dataxHivePojo.setColumns(columns);
        dataxHivePojo.setWriterDefaultFS(hiveWriterDto.getWriterDefaultFS());
        dataxHivePojo.setWriteFieldDelimiter(hiveWriterDto.getWriteFieldDelimiter());
        dataxHivePojo.setWriterFileType(hiveWriterDto.getWriterFileType());
        dataxHivePojo.setWriterPath(hiveWriterDto.getWriterPath());
        dataxHivePojo.setWriteMode(hiveWriterDto.getWriteMode());
        dataxHivePojo.setWriterFileName(hiveWriterDto.getWriterFileName());
        return writerPlugin.buildHive(dataxHivePojo);
    }

    @Override
    public Map<String, Object> buildHBaseWriter() {
        DataxHbasePojo dataxHbasePojo = new DataxHbasePojo();
        dataxHbasePojo.setJdbcDatasource(writerDatasource);
        List<Map<String, Object>> columns = Lists.newArrayList();
        for (int i = 0; i < writerColumns.size(); i++) {
            Map<String, Object> column = Maps.newLinkedHashMap();
            column.put("index", i + 1);
            column.put("name", writerColumns.get(i));
            column.put("type", "string");
            columns.add(column);
        }
        dataxHbasePojo.setColumns(columns);
        dataxHbasePojo.setWriterHbaseConfig(writerDatasource.getZkAdress());
        String writerTable = !CollectionUtils.isEmpty(writerTables) ? writerTables.get(0) : Constants.STRING_BLANK;
        dataxHbasePojo.setWriterTable(writerTable);
        dataxHbasePojo.setWriterVersionColumn(hbaseWriterDto.getWriterVersionColumn());
        dataxHbasePojo.setWriterRowkeyColumn(hbaseWriterDto.getWriterRowkeyColumn());
        dataxHbasePojo.setWriterMode(hbaseWriterDto.getWriterMode());
        return writerPlugin.buildHbase(dataxHbasePojo);
    }


    @Override
    public Map<String, Object> buildMongoDBWriter() {
        DataxMongoDBPojo dataxMongoDBPojo = new DataxMongoDBPojo();
        dataxMongoDBPojo.setJdbcDatasource(writerDatasource);
        List<Map<String, Object>> columns = Lists.newArrayList();
        buildColumns(writerColumns, columns);
        dataxMongoDBPojo.setColumns(columns);
        dataxMongoDBPojo.setAddress(writerDatasource.getJdbcUrl());
        dataxMongoDBPojo.setDbName(writerDatasource.getDatabaseName());
        dataxMongoDBPojo.setWriterTable(readerTables.get(0));
        dataxMongoDBPojo.setUpsertInfo(mongoDBWriterDto.getUpsertInfo());
        return writerPlugin.buildMongoDB(dataxMongoDBPojo);
    }

    private void buildColumns(List<String> columns, List<Map<String, Object>> returnColumns) {
        columns.forEach(c -> {
            Map<String, Object> column = Maps.newLinkedHashMap();
            column.put("name", c.split(Constants.SPLIT_SCOLON)[0]);
            column.put("type", c.split(Constants.SPLIT_SCOLON)[1]);
            returnColumns.add(column);
        });
    }

}
