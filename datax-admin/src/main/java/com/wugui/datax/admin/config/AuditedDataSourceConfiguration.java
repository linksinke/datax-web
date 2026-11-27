package com.wugui.datax.admin.config;

import com.wugui.datax.admin.core.util.OperationActor;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

/** 在每次借用管理库连接时设置审计账号，同时覆盖 MyBatis 和 JdbcTemplate 写入。 */
@Configuration
public class AuditedDataSourceConfiguration {
    @Bean
    @ConfigurationProperties("spring.datasource.hikari")
    public AuditedHikariDataSource dataSource(DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder().type(AuditedHikariDataSource.class).build();
    }

    public static class AuditedHikariDataSource extends HikariDataSource {
        @Override
        public Connection getConnection() throws SQLException {
            Connection connection = super.getConnection();
            try (PreparedStatement statement = connection.prepareStatement("SET @datax_actor = ?")) {
                statement.setString(1, OperationActor.current());
                statement.execute();
                return connection;
            } catch (SQLException failure) {
                connection.close();
                throw failure;
            }
        }
    }
}
