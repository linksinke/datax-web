package com.wugui.datax.admin.service;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.parser.ParserConfig;
import com.alibaba.fastjson.serializer.SerializeConfig;
import com.wugui.datax.admin.dto.DataXJsonBuildDto;

/** 通过反射读写配置对象，兼容 IDE 热加载后访问方法变化。 */
public final class TemplateConfigJson {
    private TemplateConfigJson() {
    }

    public static String write(DataXJsonBuildDto config) {
        return JSON.toJSONString(config, writerConfig());
    }

    public static DataXJsonBuildDto read(String text) {
        return JSON.parseObject(text, DataXJsonBuildDto.class, readerConfig());
    }

    // 使用局部新缓存，避免复用热加载前不兼容的 ASM 序列化器。
    static SerializeConfig writerConfig() {
        SerializeConfig config = new SerializeConfig();
        config.setAsmEnable(false);
        return config;
    }

    static ParserConfig readerConfig() {
        ParserConfig config = new ParserConfig();
        config.setAsmEnable(false);
        return config;
    }
}
