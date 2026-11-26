package com.wugui.datax.admin.dto;

import lombok.Data;

/** Connection summary only; project APIs must never return database credentials. */
@Data
public class ProjectDatasourceDto {
    private Integer projectId;
    private Long id;
    private String datasourceName;
    private String datasource;
    private String datasourceGroup;
    private Integer status;
}
