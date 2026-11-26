package com.wugui.datax.admin.config;

import com.wugui.datax.admin.entity.JobDatasource;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/** Startup defaults; existing datasource records are never overwritten. */
@Data
@Component
@ConfigurationProperties(prefix = "datax.bootstrap")
public class DatabaseBootstrapProperties {
    private boolean enabled = true;
    private boolean registerProjectDatasource = true;
    private List<JobDatasource> datasources = new ArrayList<>();
}
