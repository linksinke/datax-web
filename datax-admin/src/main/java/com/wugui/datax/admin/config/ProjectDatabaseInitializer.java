package com.wugui.datax.admin.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.support.EncodedResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

/** 在调度器访问管理库之前完成初始化。 */
@Component("projectDatabaseInitializer")
public class ProjectDatabaseInitializer implements InitializingBean {
    private static final Logger LOGGER = LoggerFactory.getLogger(ProjectDatabaseInitializer.class);
    private final DataSource dataSource;
    private final DatabaseBootstrapProperties properties;

    public ProjectDatabaseInitializer(DataSource dataSource, DatabaseBootstrapProperties properties) {
        this.dataSource = dataSource;
        this.properties = properties;
    }

    // MySQL DDL 会自动提交，使用连接级锁串行执行多个管理端的启动升级。
    static void acquireLock(Connection connection) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("SELECT GET_LOCK(?, 30)")) {
            statement.setString(1, lockName(connection));
            try (ResultSet result = statement.executeQuery()) {
                if (!result.next() || result.getInt(1) != 1) {
                    throw new SQLException("Timed out waiting for the project database initialization lock");
                }
            }
        }
    }

    static void releaseLock(Connection connection) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("SELECT RELEASE_LOCK(?)")) {
            statement.setString(1, lockName(connection));
            statement.execute();
        }
    }

    private static String lockName(Connection connection) throws SQLException {
        return "datax-web-bootstrap:" + Integer.toHexString(connection.getCatalog().hashCode());
    }

    @Override
    public void afterPropertiesSet() throws Exception {
        if (!properties.isEnabled()) {
            return;
        }
        try (Connection connection = dataSource.getConnection()) {
            acquireLock(connection);
            try {
                ScriptUtils.executeSqlScript(connection, new EncodedResource(
                        new ClassPathResource("db/bootstrap/schema.sql"), "UTF-8"));
                TemplateBatchMigration.migrate(connection);
                DatabaseAuditMigration.migrate(connection);
                LOGGER.info("Project database schema ready: {}", connection.getCatalog());
            } finally {
                releaseLock(connection);
            }
        }
    }
}
