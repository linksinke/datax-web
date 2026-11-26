package com.wugui.datax.admin.dto;

import lombok.Data;

/**
 * A configuration document, deliberately independent of scheduler jobs.
 */
@Data
public class DataxConfigTemplateDto {

    /** 配置模板ID */
    private Long id;
    /** 配置模板名称 */
    private String name;
    /** 配置模板描述 */
    private String description;
    /** 配置模板版本 */
    private Integer version;
    /** 配置模板内容 */
    private DataXJsonBuildDto buildConfig;
    /** 配置模板JSON */
    private String jobJson;
    /** 配置模板文件名 */
    private String fileName;
    /** 批量任务ID */
    private String batchId;
    /** 批量任务代码 */
    private String batchCode;
    /** 批量任务名称 */
    private String batchName;

}
