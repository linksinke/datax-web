package com.wugui.datax.admin.service;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.alibaba.fastjson.parser.Feature;
import com.alibaba.fastjson.serializer.SerializerFeature;

import java.util.Map;

/** Stable property order for generated templates, without changing values or array order. */
public final class TemplateJsonLayout {
    private TemplateJsonLayout() {
    }

    public static String format(String text) {
        return format(JSON.parseObject(text, Feature.OrderedField));
    }

    public static String format(JSONObject document) {
        JSONObject root = ordered(document, "job");
        JSONObject job = root.getJSONObject("job");
        if (job != null) {
            job = ordered(job, "content", "setting");
            root.put("job", job);
            JSONArray content = job.getJSONArray("content");
            if (content != null) {
                for (int i = 0; i < content.size(); i++) {
                    JSONObject item = ordered(content.getJSONObject(i), "reader", "writer");
                    content.set(i, item);
                    plugin(item, "reader");
                    plugin(item, "writer");
                }
            }
            JSONObject setting = job.getJSONObject("setting");
            if (setting != null) {
                setting = ordered(setting, "speed", "errorLimit");
                job.put("setting", setting);
                if (setting.getJSONObject("speed") != null) {
                    setting.put("speed", ordered(setting.getJSONObject("speed"), "channel", "byte"));
                }
                if (setting.getJSONObject("errorLimit") != null) {
                    setting.put("errorLimit", ordered(setting.getJSONObject("errorLimit"), "record", "percentage"));
                }
            }
        }
        return JSON.toJSONString(root, SerializerFeature.PrettyFormat, SerializerFeature.WriteMapNullValue);
    }

    private static void plugin(JSONObject item, String side) {
        JSONObject plugin = item.getJSONObject(side);
        if (plugin == null) return;
        plugin = ordered(plugin, "name", "parameter");
        item.put(side, plugin);
        JSONObject parameter = plugin.getJSONObject("parameter");
        if (parameter == null) return;
        parameter = "reader".equals(side)
                ? ordered(parameter, "username", "password", "column", "connection", "where")
                : ordered(parameter, "username", "password", "writeMode", "print", "encoding", "column",
                "session", "preSql", "postSql", "connection");
        plugin.put("parameter", parameter);
        JSONArray connections = parameter.getJSONArray("connection");
        if (connections != null) {
            for (int i = 0; i < connections.size(); i++) {
                connections.set(i, ordered(connections.getJSONObject(i), "jdbcUrl", "table", "querySql"));
            }
        }
    }

    private static JSONObject ordered(JSONObject source, String... names) {
        JSONObject result = new JSONObject(true);
        for (String name : names) {
            if (source.containsKey(name)) result.put(name, source.get(name));
        }
        // Preserve additional plugin settings in their original order instead of discarding them.
        for (Map.Entry<String, Object> entry : source.entrySet()) {
            if (!result.containsKey(entry.getKey())) result.put(entry.getKey(), entry.getValue());
        }
        return result;
    }
}
