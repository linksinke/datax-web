package com.wugui.datax.admin.service.impl;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.wugui.datax.admin.entity.JobProject;
import com.wugui.datax.admin.entity.JobDatasource;
import com.wugui.datax.admin.entity.JobProjectDatasource;
import com.wugui.datax.admin.dto.ProjectDatasourceDto;
import com.wugui.datax.admin.mapper.JobProjectMapper;
import com.wugui.datax.admin.mapper.JobProjectDatasourceMapper;
import com.wugui.datax.admin.mapper.JobDatasourceMapper;
import com.wugui.datax.admin.service.JobProjectService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import javax.annotation.Resource;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 项目业务实现
 * @author jingwk
 * @since 2019-05-30
 * @version v2.1.2
 */
@Service("jobProjectService")
public class JobProjectServiceImpl extends ServiceImpl<JobProjectMapper, JobProject> implements JobProjectService {
    @Resource
    private JobProjectDatasourceMapper projectDatasourceMapper;
    @Resource
    private JobDatasourceMapper datasourceMapper;

    @Override
    public IPage<JobProject> getProjectListPaging(Integer pageSize, Integer pageNo, String searchName) {
        if (pageSize == null || pageSize < 1 || pageNo == null || pageNo < 1) {
            throw new IllegalArgumentException("分页参数无效");
        }
        Page<JobProject> page = new Page<>(pageNo, pageSize);
        IPage<JobProject> result = baseMapper.getProjectListPaging(page, searchName);
        attachBindings(result.getRecords());
        return result;
    }

    @Override
    public List<JobProject> listProjects() {
        List<JobProject> projects = list(Wrappers.<JobProject>lambdaQuery().eq(JobProject::getFlag, true)
                .orderByDesc(JobProject::getCreateTime));
        attachBindings(projects);
        return projects;
    }

    @Override
    public JobProject getProject(int id) {
        JobProject project = requireProject(id, false);
        attachBindings(Collections.singletonList(project));
        return project;
    }

    @Override
    public List<ProjectDatasourceDto> getProjectDatasources(int id) {
        requireProject(id, false);
        return projectDatasourceMapper.selectProjectDatasources(Collections.singletonList(id));
    }

    @Override
    @Transactional
    public boolean saveProject(JobProject input, int userId, boolean administrator) {
        if (input == null || input.getName() == null || input.getName().trim().isEmpty() || input.getName().trim().length() > 100) {
            throw new IllegalArgumentException("项目名称不能为空，且不能超过100个字符");
        }
        if (input.getDescription() != null && input.getDescription().length() > 200) {
            throw new IllegalArgumentException("项目描述不能超过200个字符");
        }
        JobProject project;
        if (input.getId() == 0) {
            project = new JobProject();
            project.setUserId(userId); project.setFlag(true); project.setCreateTime(new Date());
        } else {
            project = requireProject(input.getId(), true);
            checkManage(project, userId, administrator);
        }
        project.setName(input.getName().trim()); project.setDescription(input.getDescription() == null ? "" : input.getDescription());
        project.setUpdateTime(new Date());
        boolean saved = input.getId() == 0 ? save(project) : updateById(project);
        if (!saved) throw new IllegalStateException("项目保存失败，请刷新后重试");
        if (input.getDatasourceIds() != null) replaceBindings(project.getId(), input.getDatasourceIds());
        input.setId(project.getId());
        return true;
    }

    @Override
    @Transactional
    public boolean bindDatasources(int projectId, List<Long> ids, int userId, boolean administrator) {
        JobProject project = requireProject(projectId, true);
        checkManage(project, userId, administrator);
        if (ids == null) throw new IllegalArgumentException("请提供数据源列表，空列表表示解除全部绑定");
        replaceBindings(projectId, ids);
        return true;
    }

    @Override
    @Transactional
    public boolean removeProjects(List<Long> ids, int userId, boolean administrator) {
        if (ids == null || ids.isEmpty()) throw new IllegalArgumentException("请选择项目");
        List<Integer> projectIds = ids.stream().map(id -> {
            if (id == null || id <= 0 || id > Integer.MAX_VALUE) throw new IllegalArgumentException("项目ID无效");
            return id.intValue();
        }).distinct().sorted().collect(Collectors.toList());
        for (Integer id : projectIds) checkManage(requireProject(id, true), userId, administrator);
        projectDatasourceMapper.delete(Wrappers.<JobProjectDatasource>lambdaQuery().in(JobProjectDatasource::getProjectId, projectIds));
        return removeByIds(projectIds);
    }

    private JobProject requireProject(int id, boolean lock) {
        JobProject project = lock ? baseMapper.selectOne(Wrappers.<JobProject>lambdaQuery().eq(JobProject::getId, id).last("FOR UPDATE")) : getById(id);
        if (project == null || !Boolean.TRUE.equals(project.getFlag())) throw new IllegalArgumentException("项目不存在或已删除");
        return project;
    }

    private void checkManage(JobProject project, int userId, boolean administrator) {
        if (!administrator && project.getUserId() != userId) throw new IllegalArgumentException("只有项目所属用户或管理员可以修改该项目");
    }

    private void replaceBindings(int projectId, List<Long> requested) {
        Set<Long> ids = new LinkedHashSet<>(requested);
        if (ids.stream().anyMatch(id -> id == null || id <= 0)) throw new IllegalArgumentException("数据源ID无效");
        Set<Long> existing = projectDatasourceMapper.selectList(Wrappers.<JobProjectDatasource>lambdaQuery()
                .eq(JobProjectDatasource::getProjectId, projectId)).stream().map(JobProjectDatasource::getDatasourceId).collect(Collectors.toSet());
        if (!ids.isEmpty()) {
            Set<Long> active = datasourceMapper.selectBatchIds(ids).stream().filter(source -> Integer.valueOf(1).equals(source.getStatus()))
                    .map(JobDatasource::getId).collect(Collectors.toSet());
            if (ids.stream().anyMatch(id -> !active.contains(id) && !existing.contains(id))) {
                throw new IllegalArgumentException("包含不存在、已删除或已禁用的数据源，请刷新数据源列表");
            }
        }
        projectDatasourceMapper.delete(Wrappers.<JobProjectDatasource>lambdaQuery().eq(JobProjectDatasource::getProjectId, projectId));
        for (Long id : ids) {
            JobProjectDatasource binding = new JobProjectDatasource(); binding.setProjectId(projectId); binding.setDatasourceId(id);
            projectDatasourceMapper.insert(binding);
        }
    }

    private void attachBindings(List<JobProject> projects) {
        if (projects.isEmpty()) return;
        Map<Integer, List<ProjectDatasourceDto>> grouped = projectDatasourceMapper.selectProjectDatasources(
                projects.stream().map(JobProject::getId).collect(Collectors.toList())).stream()
                .collect(Collectors.groupingBy(ProjectDatasourceDto::getProjectId));
        for (JobProject project : projects) {
            List<ProjectDatasourceDto> sources = grouped.getOrDefault(project.getId(), Collections.emptyList());
            project.setDatasources(sources);
            project.setDatasourceIds(sources.stream().map(ProjectDatasourceDto::getId).collect(Collectors.toList()));
        }
    }
}
