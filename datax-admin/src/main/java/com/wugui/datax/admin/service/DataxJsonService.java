package com.wugui.datax.admin.service;

import com.wugui.datax.admin.dto.DataXJsonBuildDto;

/**
 * com.wugui.datax json构建服务层接口
 *
 * @author zhouhongfa@gz-yibo.com
 * @version 1.0
 * @since 2019/8/1
 */
public interface DataxJsonService {

    /**
     * 构建数据同步任务的 datax json配置文件
     *
     * @param dto 数据同步任务的构建参数
     * @return datax json配置文件
     */
    String buildJobJson(DataXJsonBuildDto dto);

}
