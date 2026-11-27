package com.wugui.datax.admin.service;

import com.baomidou.mybatisplus.extension.service.IService;

import com.wugui.datatx.core.biz.model.ReturnT;
import com.wugui.datax.admin.dto.DataXBatchJsonBuildDto;
import com.wugui.datax.admin.dto.TaskScheduleDto;
import com.wugui.datax.admin.entity.JobInfo;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * DataX Web 任务管理服务
 *
 * @author xuxueli 2016-5-28 15:30:33
 */
public interface JobService extends IService<JobInfo> {

    /**
     * 分页查询列表
     *
     * @param start
     * @param length
     * @param jobGroup
     * @param jobDesc
     * @param glueType
     * @param userId
     * @return
     */
    Map<String, Object> pageList(int start, int length, int jobGroup, int triggerStatus, String jobDesc, String glueType, int userId,Integer[] projectIds);

    List<JobInfo> list();

    /**
     * 新增任务
     *
     * @param jobInfo
     * @return
     */
    ReturnT<String> add(JobInfo jobInfo);

    /**
     * 更新任务
     *
     * @param jobInfo
     * @return
     */
    ReturnT<String> update(JobInfo jobInfo);

    /**
     * 删除任务
     * *
     *
     * @param id
     * @return
     */
    ReturnT<String> remove(int id);

    /**
     * 启动任务调度
     *
     * @param id
     * @return
     */
    ReturnT<String> start(int id);

    /**
     * 停止任务调度
     *
     * @param id
     * @return
     */
    ReturnT<String> stop(int id);

    /**
     * 运行概览统计
     *
     * @return
     */
    Map<String, Object> dashboardInfo();

    /**
     * 运行趋势统计
     *
     * @return
     */
    ReturnT<Map<String, Object>> chartInfo();

    /**
     * 批量新增任务
     * @param dto
     * @return
     */
    ReturnT<String> batchAdd(DataXBatchJsonBuildDto dto) throws IOException;
}
