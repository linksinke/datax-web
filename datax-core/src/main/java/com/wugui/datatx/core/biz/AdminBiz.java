package com.wugui.datatx.core.biz;

import com.wugui.datatx.core.biz.model.HandleCallbackParam;
import com.wugui.datatx.core.biz.model.HandleProcessCallbackParam;
import com.wugui.datatx.core.biz.model.RegistryParam;
import com.wugui.datatx.core.biz.model.ReturnT;

import java.util.List;

/**
 * @author xuxueli 2017-07-27 21:52:49
 */
public interface AdminBiz {


    // 回调接口

    /**
     * 回调处理
     *
     * @param callbackParamList
     * @return
     */
    ReturnT<String> callback(List<HandleCallbackParam> callbackParamList);

    /**
     * 进程结果回调
     *
     * @param processCallbackParamList
     * @return
     */
    ReturnT<String> processCallback(List<HandleProcessCallbackParam> processCallbackParamList);

    // 注册接口

    /**
     * 注册执行节点
     *
     * @param registryParam
     * @return
     */
    ReturnT<String> registry(RegistryParam registryParam);

    /**
     * 注销执行节点
     *
     * @param registryParam
     * @return
     */
    ReturnT<String> registryRemove(RegistryParam registryParam);

}
