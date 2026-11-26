package com.wugui.datax.admin.dto;

import lombok.Data;
import java.util.List;

@Data
public class MetadataColumnsBatchDto {
    private Long datasourceId;
    private List<String> tables;
}
