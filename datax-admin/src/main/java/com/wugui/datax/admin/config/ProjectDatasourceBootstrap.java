package com.wugui.datax.admin.config;

import com.wugui.datax.admin.entity.JobDatasource;
import com.wugui.datax.admin.util.AESUtil;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.DependsOn;
import org.springframework.stereotype.Component;
import org.springframework.util.Assert;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.util.ArrayList;
import java.util.List;

/** 导入可选业务连接，并将管理库登记到数据源管理页面。 */
@Component
@DependsOn("jobAdminConfig")
public class ProjectDatasourceBootstrap implements ApplicationRunner {

    private final DataSource dataSource;
    private final DataSourceProperties database;
    private final DatabaseBootstrapProperties properties;

    public ProjectDatasourceBootstrap(DataSource dataSource, DataSourceProperties database,
                                      DatabaseBootstrapProperties properties) {
        this.dataSource = dataSource;
        this.database = database;
        this.properties = properties;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (!properties.isEnabled()) {
            return;
        }
        List<JobDatasource> connections = new ArrayList<>(properties.getDatasources());
        if (properties.isRegisterProjectDatasource()) {
            JobDatasource project = new JobDatasource();
            project.setDatasourceName("项目管理库");
            project.setDatasource("mysql");
            project.setDatasourceGroup("系统");
            project.setJdbcUrl(database.determineUrl());
            project.setJdbcUsername(database.determineUsername());
            project.setJdbcPassword(database.determinePassword());
            project.setJdbcDriverClass(database.determineDriverClassName());
            connections.add(project);
        }
        try (Connection connection = dataSource.getConnection()) {
            ProjectDatabaseInitializer.acquireLock(connection);
            try {
                for (JobDatasource source : connections) {
                    insertIfAbsent(connection, source);
                }
            } finally {
                ProjectDatabaseInitializer.releaseLock(connection);
            }
        }
    }

    private void insertIfAbsent(Connection connection, JobDatasource source) throws Exception {
        Assert.hasText(source.getDatasourceName(), "Bootstrap datasource name must not be empty");
        Assert.hasText(source.getDatasource(), "Bootstrap datasource type must not be empty");
        Assert.hasText(source.getJdbcUrl(), "Bootstrap datasource JDBC URL must not be empty");
        String sql = "INSERT INTO job_jdbc_datasource "
                + "(datasource_name, datasource, datasource_group, jdbc_url, jdbc_username, "
                + "jdbc_password, jdbc_driver_class, database_name, status, create_by, create_date) "
                + "SELECT ?, ?, ?, ?, ?, ?, ?, ?, 1, 'bootstrap', NOW() "
                + "WHERE NOT EXISTS (SELECT 1 FROM job_jdbc_datasource WHERE datasource_name = ?)";
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, source.getDatasourceName());
            statement.setString(2, source.getDatasource());
            statement.setString(3, source.getDatasourceGroup() == null ? "Default" : source.getDatasourceGroup());
            statement.setString(4, source.getJdbcUrl());
            statement.setString(5, encrypt(source.getJdbcUsername()));
            statement.setString(6, encrypt(source.getJdbcPassword()));
            statement.setString(7, source.getJdbcDriverClass());
            statement.setString(8, source.getDatabaseName());
            statement.setString(9, source.getDatasourceName());
            statement.executeUpdate();
        }
    }

    private String encrypt(String value) {
        if (value == null || value.isEmpty()) {
            return null;
        }
        String encrypted = AESUtil.encrypt(value);
        Assert.state(encrypted != null, "Could not encrypt bootstrap datasource credentials");
        return encrypted;
    }

}
