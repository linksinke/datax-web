package com.wugui.datax.admin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.wugui.datax.admin.entity.JobGroup;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 创建者：xuxueli，时间：16/9/30.
 */
@Mapper
public interface JobGroupMapper extends BaseMapper<JobGroup> {

    List<JobGroup> find(@Param("appName") String appName,
                        @Param("title") String title,
                        @Param("addressList") String addressList);

    List<JobGroup> findByAddressType(@Param("addressType") int addressType);

}
