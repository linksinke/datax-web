package com.wugui.datax.admin.dto;

import lombok.Data;

/** 仅返回连接摘要，项目接口不得返回数据库凭据。 */
@Data
public class ProjectDatasourceDto {
    private Integer projectId;
    private Long id;
    private String datasourceName;
    private String datasource;
    private String datasourceGroup;
    private Integer status;
}
