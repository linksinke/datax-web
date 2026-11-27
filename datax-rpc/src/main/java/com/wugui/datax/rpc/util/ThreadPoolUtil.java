package com.wugui.datax.rpc.util;

import java.util.concurrent.*;

/**
 * @author xuxueli 2019-02-18
 */
public class ThreadPoolUtil {

    /**
     * 创建服务端工作线程池
     *
     * @param serverType
     * @return
     */
    public static ThreadPoolExecutor makeServerThreadPool(final String serverType, int corePoolSize, int maxPoolSize) {
        ThreadPoolExecutor serverHandlerPool = new ThreadPoolExecutor(
                corePoolSize,
                maxPoolSize,
                60L,
                TimeUnit.SECONDS,
                new LinkedBlockingQueue<>(1000),
                r -> new Thread(r, "xxl-rpc, " + serverType + "-serverHandlerPool-" + r.hashCode()),
                (r, executor) -> {
                    throw new XxlRpcException("xxl-rpc " + serverType + " Thread pool is EXHAUSTED!");
                });        // 默认最大线程数300、最小线程数60

        return serverHandlerPool;
    }

}
