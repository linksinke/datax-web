package com.wugui.datax.admin.service;

import com.baomidou.mybatisplus.extension.service.IService;

import com.wugui.datatx.core.biz.model.ReturnT;
import com.wugui.datax.admin.entity.JobTemplate;

import java.util.Map;

/**
 * DataX Web 任务管理服务
 *
 * @author xuxueli 2016-5-28 15:30:33
 */
public interface JobTemplateService extends IService<JobTemplate> {

    /**
     * 分页查询列表
     *
     * @param start
     * @param length
     * @param jobGroup
     * @param jobDesc
     * @param executorHandler
     * @param userId
     * @return
     */
    Map<String, Object> pageList(int start, int length, int jobGroup, String jobDesc, String executorHandler, int userId, Integer[] projectIds);

    /**
     * 新增任务
     *
     * @param jobTemplate
     * @return
     */
    ReturnT<String> add(JobTemplate jobTemplate);

    /**
     * 更新任务
     *
     * @param jobTemplate
     * @return
     */
    ReturnT<String> update(JobTemplate jobTemplate);

    /**
     * 删除任务
     * 	 *
     * @param id
     * @return
     */
    ReturnT<String> remove(int id);

}
