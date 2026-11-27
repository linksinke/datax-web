package com.wugui.datax.admin.service.workbench;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.wugui.datax.admin.core.util.SelectSqlPolicy;
import com.wugui.datax.admin.dto.DataXJsonBuildDto;
import com.wugui.datax.admin.dto.ProjectRecipeDto;
import com.wugui.datax.admin.entity.JobDatasource;
import com.wugui.datax.admin.entity.JobProject;
import com.wugui.datax.admin.service.JobDatasourceService;
import com.wugui.datax.admin.service.JobProjectService;
import com.wugui.datax.admin.service.TemplateConfigJson;
import com.wugui.datax.admin.util.AESUtil;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.Assert;

import java.sql.*;
import java.util.*;

/** 项目方案持久化及模拟库查询结构读取，不连接实际运行数据源。 */
@Service
public class ProjectRecipeService {
    private final JdbcTemplate jdbc;
    private final JobProjectService projects;
    private final JobDatasourceService datasources;

    public ProjectRecipeService(JdbcTemplate jdbc, JobProjectService projects, JobDatasourceService datasources) {
        this.jdbc = jdbc;
        this.projects = projects;
        this.datasources = datasources;
    }

    public Map<String, Object> list(Integer projectId, String keyword, int current, int size) {
        List<Object> args = new ArrayList<>();
        String where = " FROM job_project_recipe r JOIN job_project p ON p.id=r.project_id AND p.flag=1 WHERE 1=1";
        if (projectId != null) {
            requireProject(projectId);
            where += " AND r.project_id=?";
            args.add(projectId);
        }
        if (keyword != null && !keyword.trim().isEmpty()) {
            where += " AND (r.name LIKE ? OR p.name LIKE ?)";
            String term = "%" + keyword.trim().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
            args.add(term);
            args.add(term);
        }
        Map<String, Object> page = new LinkedHashMap<>();
        page.put("total", jdbc.queryForObject("SELECT COUNT(*)" + where, Long.class, args.toArray()));
        args.add(Math.max(1, Math.min(100, size)));
        args.add((Math.max(1, current) - 1) * Math.max(1, Math.min(100, size)));
        page.put("records", jdbc.queryForList("SELECT r.id,r.project_id AS projectId,p.name AS projectName,r.name,r.description,r.mode,r.version,"
                + "r.created_by AS createdBy,r.updated_by AS updatedBy,DATE_FORMAT(r.updated_at,'%Y-%m-%d %H:%i:%s') AS updatedAt"
                + where + " ORDER BY r.updated_at DESC,r.id DESC LIMIT ? OFFSET ?", args.toArray()));
        return page;
    }

    public ProjectRecipeDto get(long id) {
        List<ProjectRecipeDto> rows = jdbc.query("SELECT * FROM job_project_recipe WHERE id=?", (rs, index) -> {
            ProjectRecipeDto dto = new ProjectRecipeDto();
            dto.setId(rs.getLong("id"));
            dto.setProjectId(rs.getInt("project_id"));
            dto.setName(rs.getString("name"));
            dto.setDescription(rs.getString("description"));
            dto.setMode(rs.getString("mode"));
            dto.setVersion(rs.getInt("version"));
            dto.setConfiguration(JSON.parseObject(AESUtil.decrypt(rs.getString("configuration"))));
            return dto;
        }, id);
        Assert.isTrue(!rows.isEmpty(), "配置方案不存在或已删除");
        requireProject(rows.get(0).getProjectId());
        return rows.get(0);
    }

    @Transactional
    public ProjectRecipeDto save(ProjectRecipeDto dto, int owner, boolean administrator) {
        Assert.notNull(dto, "请填写配置方案");
        JobProject project = requireProject(dto.getProjectId());
        Assert.isTrue(administrator || project.getUserId() == owner, "只有项目创建人或管理员可以维护配置方案");
        Assert.hasText(dto.getName(), "请输入方案名称");
        Assert.isTrue(dto.getName().trim().length() <= 100, "方案名称不能超过100字");
        Assert.isTrue(dto.getDescription() == null || dto.getDescription().length() <= 1000, "方案说明不能超过1000字");
        String mode = dto.getMode() == null ? "MAPPING" : dto.getMode();
        Assert.isTrue(Arrays.asList("MAPPING", "QUERY").contains(mode), "请选择字段映射或查询SQL模式");
        Assert.notNull(dto.getConfiguration(), "请先配置源库、目标库和表配对");
        JSONArray specs = dto.getConfiguration().getJSONArray("configurations");
        Assert.isTrue(specs != null && !specs.isEmpty() && specs.size() <= 500, "请保存1至500组表配置");
        JSONArray normalizedSpecs = new JSONArray();
        DataXJsonBuildDto first = null;
        for (int i = 0; i < specs.size(); i++) {
            DataXJsonBuildDto spec = TemplateConfigJson.read(specs.getJSONObject(i).toJSONString());
            Assert.isTrue(spec.getReaderTables() != null && spec.getReaderTables().size() == 1
                    && spec.getWriterTables() != null && spec.getWriterTables().size() == 1, "每组方案需选择一张源表和一张目标表");
            Assert.isTrue(spec.getReaderColumns() != null && !spec.getReaderColumns().isEmpty()
                    && spec.getWriterColumns() != null && spec.getReaderColumns().size() == spec.getWriterColumns().size(), "两侧字段不能为空且数量须一致");
            if (first != null) {
                Assert.isTrue(Objects.equals(first.getReaderDatasourceId(), spec.getReaderDatasourceId())
                        && Objects.equals(first.getWriterDatasourceId(), spec.getWriterDatasourceId())
                        && Objects.equals(first.getReaderMetadataDatasourceId(), spec.getReaderMetadataDatasourceId())
                        && Objects.equals(first.getWriterMetadataDatasourceId(), spec.getWriterMetadataDatasourceId()), "同一方案请使用一致的读写连接和模拟结构库，不同连接请分别保存方案");
            }
            if (first == null) {
                first = spec;
            }
            requireBound(project.getId(), spec.getReaderDatasourceId());
            requireBound(project.getId(), spec.getWriterDatasourceId());
            if ("QUERY".equals(mode)) {
                Assert.notNull(spec.getRdbmsReader(), "请填写读取SQL");
                SelectSqlPolicy.expand(spec.getRdbmsReader().getQuerySql(), "metadata_table", "mysql");
            }
            spec.setProjectId(project.getId());
            normalizedSpecs.add(JSON.parseObject(TemplateConfigJson.write(spec)));
        }
        dto.getConfiguration().put("configurations", normalizedSpecs);
        String json = dto.getConfiguration().toJSONString();
        Assert.isTrue(json.length() <= 8 * 1024 * 1024, "配置方案过大，请拆分保存");
        String encrypted = AESUtil.encrypt(json);
        Assert.notNull(encrypted, "方案加密失败，请检查管理库密钥");
        if (dto.getId() == null) {
            GeneratedKeyHolder key = new GeneratedKeyHolder();
            jdbc.update(connection -> {
                PreparedStatement statement = connection.prepareStatement("INSERT INTO job_project_recipe "
                        + "(project_id,owner_id,name,description,mode,configuration) VALUES (?,?,?,?,?,?)", Statement.RETURN_GENERATED_KEYS);
                statement.setInt(1, project.getId());
                statement.setInt(2, owner);
                statement.setString(3, dto.getName().trim());
                statement.setString(4, dto.getDescription() == null ? "" : dto.getDescription());
                statement.setString(5, mode);
                statement.setString(6, encrypted);
                return statement;
            }, key);
            dto.setId(Objects.requireNonNull(key.getKey()).longValue());
        } else {
            ProjectRecipeDto current = get(dto.getId());
            Assert.isTrue(current.getProjectId().equals(dto.getProjectId()), "配置方案不能移动到其他项目");
            Assert.notNull(dto.getVersion(), "缺少版本号，请重新打开配置方案");
            Assert.isTrue(jdbc.update("UPDATE job_project_recipe SET name=?,description=?,mode=?,configuration=?,version=version+1 "
                            + "WHERE id=? AND project_id=? AND version=?", dto.getName().trim(), dto.getDescription() == null ? "" : dto.getDescription(),
                    mode, encrypted, dto.getId(), project.getId(), dto.getVersion()) == 1, "方案已被修改，请刷新后重试");
        }
        return get(dto.getId());
    }

    @Transactional
    public void delete(long id, int owner, boolean administrator) {
        ProjectRecipeDto dto = get(id);
        Assert.isTrue(administrator || requireProject(dto.getProjectId()).getUserId() == owner, "只有项目创建人或管理员可以删除配置方案");
        Assert.isTrue(jdbc.update("DELETE FROM job_project_recipe WHERE id=?", id) == 1, "方案已删除，请刷新");
    }

    public List<String> queryColumns(int projectId, long metadataDatasourceId, String table, String sql) throws SQLException {
        requireProject(projectId);
        JobDatasource source = datasources.getById(metadataDatasourceId);
        Assert.isTrue(source != null && Integer.valueOf(1).equals(source.getStatus()), "模拟数据源不存在或已停用");
        String query = SelectSqlPolicy.expand(sql, table, source.getDatasource());
        // 使用独立的只读连接，避免复用缓存连接时相互干扰；派生表强制零行，不读取业务记录。
        Properties properties = new Properties();
        String username = AESUtil.decrypt(source.getJdbcUsername()), password = AESUtil.decrypt(source.getJdbcPassword());
        if (username != null) {
            properties.setProperty("user", username);
        }
        if (password != null) {
            properties.setProperty("password", password);
        }
        properties.setProperty("connectTimeout", "10000");
        properties.setProperty("socketTimeout", "15000");
        try (Connection connection = DriverManager.getConnection(source.getJdbcUrl(), properties)) {
            connection.setReadOnly(true);
            try (PreparedStatement statement = connection.prepareStatement("SELECT * FROM (" + query + ") datax_metadata WHERE 1=0")) {
                statement.setQueryTimeout(10);
                try (ResultSet result = statement.executeQuery()) {
                    ResultSetMetaData metadata = result.getMetaData();
                    List<String> names = new ArrayList<>();
                    for (int column = 1; column <= metadata.getColumnCount(); column++) {
                        names.add(metadata.getColumnLabel(column));
                    }
                    Assert.isTrue(new HashSet<>(names).size() == names.size(), "查询存在同名输出列，请使用AS设置不同别名");
                    return names;
                }
            }
        }
    }

    private JobProject requireProject(Integer id) {
        Assert.notNull(id, "请选择项目");
        JobProject project = projects.getById(id);
        Assert.isTrue(project != null && Boolean.TRUE.equals(project.getFlag()), "项目不存在或已停用");
        return project;
    }

    private void requireBound(int projectId, Long id) {
        Assert.notNull(id, "请选择实际源库和目标库");
        Assert.isTrue(jdbc.queryForObject("SELECT COUNT(*) FROM job_project_datasource WHERE project_id=? AND datasource_id=?", Integer.class, projectId, id) == 1,
                "实际数据源未绑定到当前项目，请先在项目管理中绑定");
    }
}
