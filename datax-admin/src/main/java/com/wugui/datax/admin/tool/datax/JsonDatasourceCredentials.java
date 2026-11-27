package com.wugui.datax.admin.tool.datax;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.alibaba.fastjson.parser.Feature;
import com.wugui.datax.admin.entity.JobDatasource;
import com.wugui.datax.admin.util.AESUtil;
import org.springframework.beans.BeanUtils;
import org.springframework.util.Assert;

/** 运行 JSON 使用明文凭据快照，管理库中的数据源对象继续保留密文。 */
public final class JsonDatasourceCredentials {
    private JsonDatasourceCredentials() { }

    public static JobDatasource snapshot(JobDatasource source) {
        Assert.notNull(source, "数据源不存在");
        JobDatasource result = new JobDatasource();
        BeanUtils.copyProperties(source, result);
        result.setJdbcUsername(AESUtil.plaintextForExport(source.getJdbcUsername()));
        result.setJdbcPassword(AESUtil.plaintextForExport(source.getJdbcPassword()));
        return result;
    }

    /** 兼容旧版记录中的凭据格式，无需重新配置表映射。 */
    public static JSONObject document(String json) {
        JSONObject document = JSON.parseObject(json, Feature.OrderedField);
        JSONObject job = document.getJSONObject("job");
        JSONArray content = job == null ? null : job.getJSONArray("content");
        if (content != null) {
            for (int i = 0; i < content.size(); i++) {
                JSONObject item = content.getJSONObject(i);
                for (String side : new String[] {"reader", "writer"}) {
                    JSONObject plugin = item.getJSONObject(side);
                    JSONObject parameter = plugin == null ? null : plugin.getJSONObject("parameter");
                    if (parameter == null) continue;
                    for (String field : new String[] {"username", "password", "userName", "userPassword"}) {
                        if (parameter.get(field) instanceof String) parameter.put(field, AESUtil.plaintextForExport(parameter.getString(field)));
                    }
                }
            }
        }
        return document;
    }
}
