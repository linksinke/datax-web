package com.wugui.datax.admin.controller;

import com.wugui.datatx.core.biz.model.ReturnT;
import com.wugui.datax.admin.core.util.I18nUtil;
import com.wugui.datax.admin.entity.JobInfo;
import com.wugui.datax.admin.entity.JobLogGlue;
import com.wugui.datax.admin.mapper.JobInfoMapper;
import com.wugui.datax.admin.mapper.JobLogGlueMapper;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.util.Date;

import static com.wugui.datatx.core.biz.model.ReturnT.FAIL_CODE;

/**
 * 创建者：jingwk，时间：2019/11/17
 */
@RestController
@RequestMapping("/jobcode")
@Api(tags = "任务状态接口")
public class JobCodeController {

    @Resource
    private JobInfoMapper jobInfoMapper;
    @Resource
    private JobLogGlueMapper jobLogGlueMapper;


    @RequestMapping(value = "/save", method = RequestMethod.POST)
    @ApiOperation("保存任务状态")
    public ReturnT<String> save(Model model, int id, String glueSource, String glueRemark) {
        // 参数校验
        if (glueRemark == null) {
            return new ReturnT<>(FAIL_CODE, (I18nUtil.getString("system_please_input") + I18nUtil.getString("jobinfo_glue_remark")));
        }
        if (glueRemark.length() < 4 || glueRemark.length() > 100) {
            return new ReturnT<>(FAIL_CODE, I18nUtil.getString("jobinfo_glue_remark_limit"));
        }
        JobInfo existsJobInfo = jobInfoMapper.selectById(id);
        if (existsJobInfo == null) {
            return new ReturnT<>(FAIL_CODE, I18nUtil.getString("jobinfo_glue_jobid_invalid"));
        }

        // 更新脚本代码
        existsJobInfo.setGlueSource(glueSource);
        existsJobInfo.setGlueRemark(glueRemark);
        existsJobInfo.setGlueUpdatetime(new Date());

        existsJobInfo.setUpdateTime(new Date());
        jobInfoMapper.updateById(existsJobInfo);

        // 保存旧脚本版本
        JobLogGlue jobLogGlue = new JobLogGlue();
        jobLogGlue.setJobId(existsJobInfo.getId());
        jobLogGlue.setGlueType(existsJobInfo.getGlueType());
        jobLogGlue.setGlueSource(glueSource);
        jobLogGlue.setGlueRemark(glueRemark);

        jobLogGlue.setAddTime(new Date());
        jobLogGlue.setUpdateTime(new Date());
        jobLogGlueMapper.insert(jobLogGlue);

        // 最多保留30个脚本备份
        jobLogGlueMapper.removeOld(existsJobInfo.getId(), 30);

        return ReturnT.SUCCESS;
    }

}
