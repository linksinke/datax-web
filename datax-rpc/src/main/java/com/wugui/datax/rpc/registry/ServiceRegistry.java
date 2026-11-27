package com.wugui.datax.rpc.registry;


import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

/**
 * 服务注册接口
 *
 *  /xxl-rpc/dev/
 *              - key01(service01)
 *                  - value01 (ip:port01)
 *                  - value02 (ip:port02)
 *
 * @author xuxueli 2018-10-17
 */
public abstract class ServiceRegistry {

    /**
     * 启动
     */
    public abstract void start(Map<String, String> param);

    /**
     * 启动
     */
    public abstract void stop();


    /**
     * 批量注册服务
     *
     * @param keys 服务唯一键集合
     * @param value 服务地址，格式为主机与端口
     * @return
     */
    public abstract boolean registry(Set<String> keys, String value);


    /**
     * 批量注销服务
     *
     * @param keys
     * @param value
     * @return
     */
    public abstract boolean remove(Set<String> keys, String value);

    /**
     * 批量发现服务
     *
     * @param keys
     * @return
     */
    public abstract Map<String, TreeSet<String>> discovery(Set<String> keys);

    /**
     * 发现单个服务
     *
     * @param key 服务唯一键
     * @return 服务地址，格式为主机与端口
     */
    public abstract TreeSet<String> discovery(String key);

}
