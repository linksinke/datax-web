package com.wugui.datax.admin.service;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.parser.ParserConfig;
import com.alibaba.fastjson.serializer.SerializeConfig;
import com.wugui.datax.admin.dto.DataXJsonBuildDto;

/** Reflective codecs for configuration DTOs whose accessors can change during an IDE hot reload. */
public final class TemplateConfigJson {
    private TemplateConfigJson() {
    }

    public static String write(DataXJsonBuildDto config) {
        return JSON.toJSONString(config, writerConfig());
    }

    public static DataXJsonBuildDto read(String text) {
        return JSON.parseObject(text, DataXJsonBuildDto.class, readerConfig());
    }

    // Use fresh, scoped caches: the global cache may already contain an incompatible ASM serializer.
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
