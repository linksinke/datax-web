package com.wugui.datax.admin.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.api.R;
import com.wugui.datax.admin.entity.JobProject;
import com.wugui.datax.admin.dto.ProjectDatasourceDto;
import com.wugui.datax.admin.dto.ProjectDatasourceBindingDto;
import com.wugui.datax.admin.util.JwtTokenUtils;
import com.wugui.datax.admin.service.JobProjectService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.List;

/**
 * project manage controller
 *
 * @author jingwk 2020-05-24 16:13:16
 */
@RestController
@RequestMapping("/api/jobProject")
@Api(tags = "项目管理模块")
public class JobProjectController extends BaseController {

    @Autowired
    private JobProjectService jobProjectService;


    /**
     * 分页查询所有数据
     *
     * @return 所有数据
     */
    @GetMapping
    @ApiOperation("分页查询所有数据")
    public R<IPage<JobProject>> selectAll(@RequestParam(value = "searchVal", required = false) String searchVal,
                                          @RequestParam("pageSize") Integer pageSize,
                                          @RequestParam("pageNo") Integer pageNo) {

        return success(jobProjectService.getProjectListPaging(pageSize, pageNo, searchVal));
    }

    /**
     * Get all project
     *
     * @return
     */
    @ApiOperation("获取所有数据")
    @GetMapping("/list")
    public R<List<JobProject>> selectList() {
        return success(jobProjectService.listProjects());
    }

    /**
     * 通过主键查询单条数据
     *
     * @param id 主键
     * @return 单条数据
     */
    @ApiOperation("通过主键查询单条数据")
    @GetMapping("{id}")
    public R<JobProject> selectOne(@PathVariable int id) {
        return success(this.jobProjectService.getProject(id));
    }

    /**
     * 新增数据
     *
     * @param entity 实体对象
     * @return 新增结果
     */
    @ApiOperation("新增数据")
    @PostMapping
    public R<Boolean> insert(HttpServletRequest request, @RequestBody JobProject entity) {
        entity.setId(0);
        return success(this.jobProjectService.saveProject(entity, getCurrentUserId(request), isAdministrator(request)));
    }


    /**
     * 修改数据
     *
     * @param entity 实体对象
     * @return 修改结果
     */
    @PutMapping
    @ApiOperation("修改数据")
    public R<Boolean> update(@RequestBody JobProject entity, HttpServletRequest request) {
        if (entity.getId() <= 0) throw new IllegalArgumentException("项目ID无效");
        return success(this.jobProjectService.saveProject(entity, getCurrentUserId(request), isAdministrator(request)));
    }

    /**
     * 删除数据
     *
     * @param idList 主键结合
     * @return 删除结果
     */
    @DeleteMapping
    @ApiOperation("删除数据")
    public R<Boolean> delete(@RequestParam("idList") List<Long> idList, HttpServletRequest request) {
        return success(this.jobProjectService.removeProjects(idList, getCurrentUserId(request), isAdministrator(request)));
    }

    @GetMapping("/{id}/datasources")
    @ApiOperation("查询项目绑定的数据源")
    public R<List<ProjectDatasourceDto>> datasources(@PathVariable int id) {
        return success(jobProjectService.getProjectDatasources(id));
    }

    @PutMapping("/{id}/datasources")
    @ApiOperation("保存项目绑定的数据源")
    public R<Boolean> bind(@PathVariable int id, @RequestBody ProjectDatasourceBindingDto binding, HttpServletRequest request) {
        return success(jobProjectService.bindDatasources(id, binding.getDatasourceIds(), getCurrentUserId(request), isAdministrator(request)));
    }

    private boolean isAdministrator(HttpServletRequest request) {
        String role = JwtTokenUtils.getUserRole(request.getHeader(JwtTokenUtils.TOKEN_HEADER).replace(JwtTokenUtils.TOKEN_PREFIX, ""));
        return role != null && Arrays.asList(role.split(",")).contains("ROLE_ADMIN");
    }
}
