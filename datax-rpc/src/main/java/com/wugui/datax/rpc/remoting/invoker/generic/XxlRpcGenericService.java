package com.wugui.datax.rpc.remoting.invoker.generic;

/**
 * @author xuxueli 2018-12-04
 */
public interface XxlRpcGenericService {

    /**
     * 泛化调用接口
     *
     * @param iface 服务接口全名
     * @param version 服务接口版本
     * @param method 服务方法名称
     * @param parameterTypes 参数类型名称，使用基础类型或完整类名
     * @param args
     * @return
     */
    Object invoke(String iface, String version, String method, String[] parameterTypes, Object[] args);

}