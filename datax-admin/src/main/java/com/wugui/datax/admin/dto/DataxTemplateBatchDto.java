package com.wugui.datax.admin.dto;

import lombok.Data;

import java.util.List;

@Data
public class DataxTemplateBatchDto {

    /** 批量任务名称 */
    private String name;
    /** 批量任务配置 */
    private List<DataXJsonBuildDto> configurations;

}
