package com.wugui.datax.admin.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.wugui.datax.admin.entity.JobProject;
import com.wugui.datax.admin.dto.ProjectDatasourceDto;
import java.util.List;

/**
 * 任务所属项目
 *
 * @author jingwk
 * @version v2.1.2
 * @since 2020-05-24
 */
public interface JobProjectService extends IService<JobProject> {

    /**
     * 项目分页列表
     * @param pageSize
     * @param pageNo
     * @param searchName
     * @return
     */
    IPage<JobProject> getProjectListPaging(Integer pageSize, Integer pageNo, String searchName);

    List<JobProject> listProjects();
    JobProject getProject(int id);
    List<ProjectDatasourceDto> getProjectDatasources(int id);
    boolean saveProject(JobProject project, int userId, boolean administrator);
    boolean bindDatasources(int projectId, List<Long> datasourceIds, int userId, boolean administrator);
    boolean removeProjects(List<Long> ids, int userId, boolean administrator);

}
