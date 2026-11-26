package com.wugui.datax.admin.service;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.wugui.datax.admin.core.util.TemplateBatchCodes;
import com.wugui.datax.admin.dto.*;
import com.wugui.datax.admin.entity.JobDatasource;
import com.wugui.datax.admin.tool.datax.DataxJsonHelper;
import com.wugui.datax.admin.tool.datax.JsonDatasourceCredentials;
import com.wugui.datax.admin.util.AESUtil;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.Assert;
import org.springframework.util.CollectionUtils;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class DataxConfigTemplateService {

    private static final Set<String> TYPES = new HashSet<>(Arrays.asList(
            "mysql", "oracle", "sqlserver", "postgresql", "clickhouse"));
    private final JdbcTemplate jdbc;
    private final JobDatasourceService datasources;
    private final DataxJsonService generator;

    public DataxConfigTemplateService(JdbcTemplate jdbc, JobDatasourceService datasources, DataxJsonService generator) {
        this.jdbc = jdbc;
        this.datasources = datasources;
        this.generator = generator;
    }

    static String fileName(DataXJsonBuildDto spec, String text) {
        JSONObject content = JSON.parseObject(text).getJSONObject("job").getJSONArray("content").getJSONObject(0);
        String reader = content.getJSONObject("reader").getString("name");
        String writer = content.getJSONObject("writer").getString("name");
        Assert.hasText(reader, "JSON缺少reader插件名称");
        Assert.hasText(writer, "JSON缺少writer插件名称");
        int sequence = spec.getSequence() == null ? 1 : spec.getSequence();
        Assert.isTrue(sequence > 0 && sequence <= 999999, "序号必须为1至999999");
        String name = String.format(Locale.ROOT, "%03d_%s2%s_%s%%2%%%s.json", sequence, reader, writer,
                spec.getReaderTables().get(0), spec.getWriterTables().get(0));
        name = name.replaceAll("[<>:\"/\\\\|?*\\p{Cntrl}]", "_");
        Assert.isTrue(name.getBytes(StandardCharsets.UTF_8).length <= 240, "表名过长，生成文件名超过240字节");
        return name;
    }

    static void validateJson(String text) {
        Assert.hasText(text, "请先生成JSON");
        Assert.isTrue(text.length() <= 2 * 1024 * 1024, "JSON不能超过2MB");
        JSONObject root;
        try {
            root = JSON.parseObject(text);
            JSONObject job = root.getJSONObject("job");
            JSONArray content = job.getJSONArray("content");
            Assert.isTrue(content != null && !content.isEmpty(), "缺少job.content");
            for (int i = 0; i < content.size(); i++) {
                JSONObject entry = content.getJSONObject(i);
                Assert.notNull(entry.getJSONObject("reader"), "缺少reader");
                Assert.notNull(entry.getJSONObject("writer"), "缺少writer");
            }
        } catch (RuntimeException ex) {
            throw new IllegalArgumentException("请输入有效的DataX JSON，必须包含job.content及reader/writer");
        }
    }

    public Map<String, Object> list(int owner, String keyword, int current, int size) {
        return list(owner, keyword, current, size, null);
    }

    public Map<String, Object> list(int owner, String keyword, int current, int size, String batchId) {
        current = Math.max(1, current);
        size = Math.max(1, Math.min(100, size));
        String term = keyword == null ? "" : keyword.trim();
        String search = "%" + term.replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%";
        String where = " FROM job_json_template t LEFT JOIN job_json_batch_item i ON i.template_id=t.id LEFT JOIN job_json_batch b ON b.id=i.batch_id "
                + "WHERE t.owner_id=? AND (t.name LIKE ? ESCAPE '!' OR t.build_config LIKE ? ESCAPE '!')";
        List<Object> parameters = new ArrayList<>(Arrays.asList(owner, search, search));
        if (batchId != null && !batchId.isEmpty()) {
            where += " AND i.batch_id=?";
            parameters.add(batchId);
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", jdbc.queryForObject("SELECT COUNT(*)" + where, Long.class, parameters.toArray()));
        parameters.add(size);
        parameters.add((current - 1) * size);
        List<Map<String, Object>> records = jdbc.queryForList("SELECT t.id,t.name,t.description,'DataX任务模板' AS type," +
                "t.reader_datasource_id AS readerDatasourceId,t.writer_datasource_id AS writerDatasourceId," +
                "t.build_config AS buildConfig,t.job_json AS encryptedJson,b.id AS batchId,b.batch_code AS batchCode,b.name AS batchName," +
                "t.version,DATE_FORMAT(t.update_time,'%Y-%m-%d %H:%i:%s') AS updateTime" + where +
                " ORDER BY t.id ASC LIMIT ? OFFSET ?", parameters.toArray());
        for (Map<String, Object> row : records) {
            DataXJsonBuildDto spec = TemplateConfigJson.read((String) row.remove("buildConfig"));
            String encrypted = (String) row.remove("encryptedJson");
            row.put("fileName", spec.getFileName() == null ? fileName(spec, AESUtil.decrypt(encrypted)) : spec.getFileName());
            row.put("readerMetadataDatasourceId", spec.getReaderMetadataDatasourceId());
            row.put("writerMetadataDatasourceId", spec.getWriterMetadataDatasourceId());
            row.put("readerTable", spec.getReaderTables().get(0));
            row.put("writerTable", spec.getWriterTables().get(0));
        }
        result.put("records", records);
        if (batchId != null && !batchId.isEmpty()) result.put("batch", getBatch(batchId, owner));
        return result;
    }

    public Map<String, Object> listBatches(int owner, String keyword, int current, int size) {
        current = Math.max(1, current);
        size = Math.max(1, Math.min(100, size));
        String term = keyword == null ? "" : keyword.trim();
        String search = "%" + term.replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%";
        String where = " FROM job_json_batch b WHERE b.owner_id=? AND (b.batch_code LIKE ? ESCAPE '!' OR b.name LIKE ? ESCAPE '!')";
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", jdbc.queryForObject("SELECT COUNT(*)" + where, Long.class, owner, search, search));
        result.put("records", jdbc.queryForList("SELECT b.id,b.batch_code AS batchCode,b.name," +
                "(SELECT COUNT(*) FROM job_json_batch_item i JOIN job_json_template t ON t.id=i.template_id WHERE i.batch_id=b.id AND t.owner_id=b.owner_id) AS templateCount," +
                "DATE_FORMAT(b.create_time,'%Y-%m-%d %H:%i:%s') AS createTime" + where +
                " ORDER BY b.create_time DESC,b.batch_code DESC LIMIT ? OFFSET ?", owner, search, search, size, (current - 1) * size));
        return result;
    }

    public Map<String, Object> getBatch(String id, int owner) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT id,batch_code AS batchCode,name,DATE_FORMAT(create_time,'%Y-%m-%d %H:%i:%s') AS createTime FROM job_json_batch WHERE id=? AND owner_id=?", id, owner);
        Assert.isTrue(!rows.isEmpty(), "批次不存在或无权访问");
        return rows.get(0);
    }

    public byte[] downloadBatchGroup(String id, int owner) throws IOException {
        getBatch(id, owner);
        List<Long> ids = jdbc.queryForList("SELECT t.id FROM job_json_template t JOIN job_json_batch_item i ON i.template_id=t.id WHERE i.batch_id=? AND t.owner_id=? ORDER BY t.id", Long.class, id, owner);
        Assert.isTrue(!ids.isEmpty(), "该批次没有可下载的模板");
        return downloadBatch(ids, owner);
    }

    public DataxConfigTemplateDto get(long id, int owner) {
        List<DataxConfigTemplateDto> rows = jdbc.query("SELECT t.*,b.id AS group_id,b.batch_code AS group_code,b.name AS group_name FROM job_json_template t LEFT JOIN job_json_batch_item i ON i.template_id=t.id LEFT JOIN job_json_batch b ON b.id=i.batch_id WHERE t.id=? AND t.owner_id=?",
                (rs, row) -> {
                    DataxConfigTemplateDto dto = new DataxConfigTemplateDto();
                    dto.setId(rs.getLong("id"));
                    dto.setName(rs.getString("name"));
                    dto.setDescription(rs.getString("description"));
                    dto.setVersion(rs.getInt("version"));
                    dto.setBuildConfig(TemplateConfigJson.read(rs.getString("build_config")));
                    dto.setBatchId(rs.getString("group_id"));
                    dto.setBatchCode(rs.getString("group_code"));
                    dto.setBatchName(rs.getString("group_name"));
                    if (dto.getBatchId() != null) {
                        dto.getBuildConfig().setBatchId(dto.getBatchId());
                        dto.getBuildConfig().setBatchName(dto.getBatchName());
                    }
                    String json = AESUtil.decrypt(rs.getString("job_json"));
                    Assert.notNull(json, "模板解密失败，请检查数据源加密密钥配置");
                    dto.setJobJson(TemplateJsonLayout.format(JsonDatasourceCredentials.document(json)));
                    dto.setFileName(fileName(dto.getBuildConfig(), json));
                    return dto;
                }, id, owner);
        Assert.isTrue(!rows.isEmpty(), "模板不存在或无权访问");
        return rows.get(0);
    }

    public String generate(DataXJsonBuildDto config) {
        return generate(config, null);
    }

    private String generate(DataXJsonBuildDto config, Map<Long, JobDatasource> sources) {
        validateConfig(config, sources);
        // The generator only resolves the configured runtime credentials; it never opens that connection.
        String json;
        if (sources == null) {
            json = generator.buildJobJson(config);
        } else {
            DataxJsonHelper helper = new DataxJsonHelper();
            helper.initReader(config, sources.get(config.getReaderDatasourceId()));
            helper.initWriter(config, sources.get(config.getWriterDatasourceId()));
            json = JSON.toJSONString(helper.buildJob());
        }
        JSONObject document = JSON.parseObject(json, com.alibaba.fastjson.parser.Feature.OrderedField);
        JSONArray content = document.getJSONObject("job").getJSONArray("content");
        for (int index = 0; index < content.size(); index++) {
            JSONObject parameter = content.getJSONObject(index).getJSONObject("reader").getJSONObject("parameter");
            JSONArray columns = parameter.getJSONArray("column");
            // A reader column is a SELECT expression; writer columns are INSERT targets and must stay bare.
            // Custom querySql already defines its own SELECT expressions and has no column array.
            if (columns != null) {
                for (int columnIndex = 0; columnIndex < columns.size(); columnIndex++) {
                    String column = columns.getString(columnIndex);
                    columns.set(columnIndex, column + " AS " + column);
                }
            }
        }
        return TemplateJsonLayout.format(document);
    }

    /** Each table pair is one JSON document and one queryable record; all records are committed together. */
    @Transactional
    public List<DataxConfigTemplateDto> generateBatch(DataxTemplateBatchDto batch, int owner) {
        Assert.notNull(batch, "请选择要生成的表");
        String batchName = batch.getName() == null ? "" : batch.getName().trim();
        Assert.isTrue(batchName.length() <= 100, "批次说明不能超过100字");
        Assert.isTrue(batch.getConfigurations() != null && !batch.getConfigurations().isEmpty()
                && batch.getConfigurations().size() <= 500, "每批请选择1至500组表");
        Map<Long, JobDatasource> sources = new HashMap<>();
        List<DataxConfigTemplateDto> documents = new ArrayList<>();
        for (int index = 0; index < batch.getConfigurations().size(); index++) {
            DataXJsonBuildDto spec = batch.getConfigurations().get(index);
            Assert.notNull(spec, "表配置不能为空");
            spec.setSequence(index + 1);
            DataxConfigTemplateDto dto = new DataxConfigTemplateDto();
            String json = generate(spec, sources);
            dto.setBuildConfig(spec);
            dto.setJobJson(json);
            documents.add(dto);
        }
        String batchId = createBatch(owner, batchName);
        for (DataxConfigTemplateDto dto : documents) {
            dto.setBatchId(batchId);
            dto.setBatchCode(batchId);
            dto.setBatchName(batchName);
            dto.getBuildConfig().setBatchId(batchId);
            dto.getBuildConfig().setBatchName(batchName);
            String title = batchId + "-" + dto.getBuildConfig().getReaderTables().get(0) + " → " + dto.getBuildConfig().getWriterTables().get(0);
            dto.setName(title.length() > 100 ? title.substring(0, 100) : title);
        }
        insertBatch(documents, owner);
        linkBatch(batchId, documents);
        return documents;
    }

    private String createBatch(int owner, String name) {
        String code = jdbc.execute((ConnectionCallback<String>) connection -> TemplateBatchCodes.next(connection, LocalDate.now(TemplateBatchCodes.ZONE)));
        jdbc.update("INSERT INTO job_json_batch (id,batch_code,owner_id,name) VALUES (?,?,?,?)", code, code, owner, name);
        return code;
    }

    private void linkBatch(String id, List<DataxConfigTemplateDto> documents) {
        String sql = "INSERT INTO job_json_batch_item (template_id,batch_id) VALUES " + String.join(",", Collections.nCopies(documents.size(), "(?,?)"));
        List<Object> args = new ArrayList<>();
        for (DataxConfigTemplateDto dto : documents) {
            args.add(dto.getId());
            args.add(id);
        }
        jdbc.update(sql, args.toArray());
    }

    private void insertBatch(List<DataxConfigTemplateDto> documents, int owner) {
        List<Object[]> rows = new ArrayList<>();
        for (DataxConfigTemplateDto dto : documents) {
            validateJson(dto.getJobJson());
            dto.setFileName(fileName(dto.getBuildConfig(), dto.getJobJson()));
            dto.getBuildConfig().setFileName(dto.getFileName());
            String encrypted = AESUtil.encrypt(dto.getJobJson());
            Assert.notNull(encrypted, "模板加密失败，请检查数据源加密密钥配置");
            rows.add(new Object[]{dto.getName(), dto.getDescription(), owner, dto.getBuildConfig().getReaderDatasourceId(),
                    dto.getBuildConfig().getWriterDatasourceId(), TemplateConfigJson.write(dto.getBuildConfig()), encrypted});
        }
        // Bound both row count and payload. Multi-row INSERT avoids one network round trip per document.
        for (int start = 0; start < rows.size(); ) {
            int end = start, bytes = 0;
            while (end < rows.size() && end - start < 100) {
                Object[] row = rows.get(end);
                int size = row[5].toString().getBytes(StandardCharsets.UTF_8).length + row[6].toString().length() + 1024;
                if (end > start && bytes + size > 1024 * 1024) break;
                bytes += size;
                end++;
            }
            final int first = start, last = end;
            String sql = "INSERT INTO job_json_template (name,description,owner_id,reader_datasource_id,writer_datasource_id,build_config,job_json) VALUES "
                    + String.join(",", Collections.nCopies(last - first, "(?,?,?,?,?,?,?)"));
            KeyHolder keys = new GeneratedKeyHolder();
            jdbc.update(connection -> {
                PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
                int parameter = 1;
                for (int index = first; index < last; index++) {
                    for (Object value : rows.get(index)) ps.setObject(parameter++, value);
                }
                return ps;
            }, keys);
            Assert.isTrue(keys.getKeyList().size() == last - first, "批量保存未返回完整记录ID，请重试");
            for (int index = first; index < last; index++) {
                Number id = (Number) keys.getKeyList().get(index - first).values().iterator().next();
                documents.get(index).setId(id.longValue());
                documents.get(index).setVersion(1);
            }
            start = end;
        }
    }

    public byte[] downloadBatch(List<Long> ids, int owner) throws IOException {
        Assert.isTrue(ids != null && !ids.isEmpty() && ids.size() <= 500, "请选择1至500份模板");
        // Resolve all documents before producing any archive; an unauthorized ID fails the entire request.
        List<DataxConfigTemplateDto> documents = new ArrayList<>();
        for (Long id : new LinkedHashSet<>(ids)) {
            Assert.notNull(id, "模板ID不能为空");
            documents.add(get(id, owner));
        }
        Set<String> names = new HashSet<>();
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        try (ZipOutputStream zip = new ZipOutputStream(bytes, StandardCharsets.UTF_8)) {
            for (DataxConfigTemplateDto dto : documents) {
                String name = dto.getFileName();
                if (!names.add(name.toLowerCase(Locale.ROOT))) {
                    name = name.substring(0, name.length() - 5) + "_record-" + dto.getId() + ".json";
                    names.add(name.toLowerCase(Locale.ROOT));
                }
                zip.putNextEntry(new ZipEntry(name));
                zip.write(dto.getJobJson().getBytes(StandardCharsets.UTF_8));
                zip.closeEntry();
            }
        }
        return bytes.toByteArray();
    }

    @Transactional
    public DataxConfigTemplateDto save(DataxConfigTemplateDto dto, int owner) {
        Assert.notNull(dto, "模板不能为空");
        Assert.hasText(dto.getName(), "请输入模板名称");
        Assert.isTrue(dto.getName().trim().length() <= 100, "模板名称不能超过100字");
        Assert.isTrue(dto.getDescription() == null || dto.getDescription().length() <= 1000, "备注不能超过1000字");
        validateConfig(dto.getBuildConfig());
        validateJson(dto.getJobJson());
        dto.setJobJson(TemplateJsonLayout.format(JsonDatasourceCredentials.document(dto.getJobJson())));
        dto.getBuildConfig().setFileName(fileName(dto.getBuildConfig(), dto.getJobJson()));
        // JSON contains connection credentials; use the same key as managed datasources.
        String encrypted = AESUtil.encrypt(dto.getJobJson());
        Assert.notNull(encrypted, "模板加密失败，请检查数据源加密密钥配置");
        if (dto.getId() == null) {
            String batch = createBatch(owner, dto.getName().trim());
            dto.setBatchId(batch);
            dto.setBatchCode(batch);
            dto.setBatchName(dto.getName().trim());
        } else {
            DataxConfigTemplateDto current = get(dto.getId(), owner);
            dto.setBatchId(current.getBatchId());
            dto.setBatchCode(current.getBatchCode());
            dto.setBatchName(current.getBatchName());
        }
        dto.getBuildConfig().setBatchId(dto.getBatchId());
        dto.getBuildConfig().setBatchName(dto.getBatchName());
        String spec = TemplateConfigJson.write(dto.getBuildConfig());
        if (dto.getId() == null) {
            KeyHolder key = new GeneratedKeyHolder();
            jdbc.update(connection -> {
                PreparedStatement ps = connection.prepareStatement("INSERT INTO job_json_template " +
                                "(name,description,owner_id,reader_datasource_id,writer_datasource_id,build_config,job_json) VALUES (?,?,?,?,?,?,?)",
                        Statement.RETURN_GENERATED_KEYS);
                ps.setString(1, dto.getName().trim());
                ps.setString(2, dto.getDescription());
                ps.setInt(3, owner);
                ps.setLong(4, dto.getBuildConfig().getReaderDatasourceId());
                ps.setLong(5, dto.getBuildConfig().getWriterDatasourceId());
                ps.setString(6, spec);
                ps.setString(7, encrypted);
                return ps;
            }, key);
            dto.setId(Objects.requireNonNull(key.getKey()).longValue());
            linkBatch(dto.getBatchId(), Collections.singletonList(dto));
        } else {
            Assert.notNull(dto.getVersion(), "缺少模板版本，请重新打开");
            int count = jdbc.update("UPDATE job_json_template SET name=?,description=?,reader_datasource_id=?," +
                            "writer_datasource_id=?,build_config=?,job_json=?,version=version+1,update_time=CURRENT_TIMESTAMP " +
                            "WHERE id=? AND owner_id=? AND version=?", dto.getName().trim(), dto.getDescription(),
                    dto.getBuildConfig().getReaderDatasourceId(), dto.getBuildConfig().getWriterDatasourceId(),
                    spec, encrypted, dto.getId(), owner, dto.getVersion());
            Assert.isTrue(count == 1, "模板已被修改、删除或无权访问，请重新打开");
        }
        return get(dto.getId(), owner);
    }

    @Transactional
    public void delete(long id, int owner) {
        Assert.isTrue(jdbc.update("DELETE FROM job_json_template WHERE id=? AND owner_id=?", id, owner) == 1,
                "模板不存在或无权访问");
        jdbc.update("DELETE FROM job_json_batch_item WHERE template_id=?", id);
    }

    private void validateConfig(DataXJsonBuildDto config) {
        validateConfig(config, null);
    }

    private void validateConfig(DataXJsonBuildDto config, Map<Long, JobDatasource> sources) {
        Assert.notNull(config, "请选择数据源和表字段");
        validateDatasource(config.getReaderDatasourceId(), sources);
        validateDatasource(config.getWriterDatasourceId(), sources);
        if (config.getReaderMetadataDatasourceId() != null)
            validateDatasource(config.getReaderMetadataDatasourceId(), sources);
        if (config.getWriterMetadataDatasourceId() != null)
            validateDatasource(config.getWriterMetadataDatasourceId(), sources);
        Assert.isTrue(!CollectionUtils.isEmpty(config.getReaderTables()) && !CollectionUtils.isEmpty(config.getWriterTables()), "请选择源表和目标表");
        Assert.isTrue(!CollectionUtils.isEmpty(config.getReaderColumns()) && !CollectionUtils.isEmpty(config.getWriterColumns()), "请选择两端字段");
        Assert.isTrue(config.getReaderTables().size() == 1 && config.getWriterTables().size() == 1, "每个配置模板请选择一张源表和一张目标表");
        config.getReaderTables().forEach(value -> Assert.hasText(value, "源表不能为空"));
        config.getWriterTables().forEach(value -> Assert.hasText(value, "目标表不能为空"));
        config.getReaderColumns().forEach(value -> Assert.hasText(value, "源字段不能为空"));
        config.getWriterColumns().forEach(value -> Assert.hasText(value, "目标字段不能为空"));
        Assert.isTrue(config.getReaderColumns().size() == config.getWriterColumns().size(), "源字段和目标字段数量必须一致，按顺序对应");
        if (config.getRdbmsReader() == null) config.setRdbmsReader(new RdbmsReaderDto());
        if (config.getRdbmsWriter() == null) config.setRdbmsWriter(new RdbmsWriterDto());
    }

    private void validateDatasource(Long id, Map<Long, JobDatasource> sources) {
        Assert.notNull(id, "请选择数据源");
        JobDatasource ds = sources == null ? datasources.getById(id) : sources.computeIfAbsent(id, key -> {
            JobDatasource stored = datasources.getById(key);
            return stored == null ? null : JsonDatasourceCredentials.snapshot(stored);
        });
        Assert.isTrue(ds != null && Integer.valueOf(1).equals(ds.getStatus()), "数据源不存在或未启用，请重新选择");
        Assert.isTrue(TYPES.contains(ds.getDatasource()), "配置模板目前支持 MySQL、Oracle、SQL Server、PostgreSQL、ClickHouse");
    }
}
