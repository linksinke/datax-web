package com.wugui.datax.rpc.remoting.invoker;

import com.wugui.datax.rpc.registry.ServiceRegistry;
import com.wugui.datax.rpc.registry.impl.LocalServiceRegistry;
import com.wugui.datax.rpc.remoting.net.params.BaseCallback;
import com.wugui.datax.rpc.remoting.net.params.XxlRpcFutureResponse;
import com.wugui.datax.rpc.remoting.net.params.XxlRpcResponse;
import com.wugui.datax.rpc.util.XxlRpcException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;

/**
 * RPC 调用方工厂，负责初始化注册服务
 *
 * @author xuxueli 2018-10-19
 */
public class XxlRpcInvokerFactory {
    private static Logger logger = LoggerFactory.getLogger(XxlRpcInvokerFactory.class);

    // 默认调用方实例

    private static volatile XxlRpcInvokerFactory instance = new XxlRpcInvokerFactory(LocalServiceRegistry.class, null);

    public static XxlRpcInvokerFactory getInstance() {
        return instance;
    }


    // 配置参数

    private Class<? extends ServiceRegistry> serviceRegistryClass;          // 按名称加载类
    private Map<String, String> serviceRegistryParam;


    public XxlRpcInvokerFactory() {
    }

    public XxlRpcInvokerFactory(Class<? extends ServiceRegistry> serviceRegistryClass, Map<String, String> serviceRegistryParam) {
        this.serviceRegistryClass = serviceRegistryClass;
        this.serviceRegistryParam = serviceRegistryParam;
    }


    // 启动与停止

    public void start() throws Exception {
        // 启动注册服务
        if (serviceRegistryClass != null) {
            serviceRegistry = serviceRegistryClass.newInstance();
            serviceRegistry.start(serviceRegistryParam);
        }
    }

    public void stop() throws Exception {
        // 停止注册服务
        if (serviceRegistry != null) {
            serviceRegistry.stop();
        }

        // 停止回调线程
        if (stopCallbackList.size() > 0) {
            for (BaseCallback callback : stopCallbackList) {
                try {
                    callback.run();
                } catch (Exception e) {
                    logger.error(e.getMessage(), e);
                }
            }
        }

        // 停止回调线程池
        stopCallbackThreadPool();
    }


    // 服务注册

    private ServiceRegistry serviceRegistry;

    public ServiceRegistry getServiceRegistry() {
        return serviceRegistry;
    }


    // 服务注册

    private List<BaseCallback> stopCallbackList = new ArrayList<BaseCallback>();

    public void addStopCallBack(BaseCallback callback) {
        stopCallbackList.add(callback);
    }


    // 异步响应容器

    // 异步响应管理

    private ConcurrentMap<String, XxlRpcFutureResponse> futureResponsePool = new ConcurrentHashMap<String, XxlRpcFutureResponse>();

    public void setInvokerFuture(String requestId, XxlRpcFutureResponse futureResponse) {
        futureResponsePool.put(requestId, futureResponse);
    }

    public void removeInvokerFuture(String requestId) {
        futureResponsePool.remove(requestId);
    }

    public void notifyInvokerFuture(String requestId, final XxlRpcResponse xxlRpcResponse) {

        // 获取配置
        final XxlRpcFutureResponse futureResponse = futureResponsePool.get(requestId);
        if (futureResponse == null) {
            return;
        }

        // 通知等待线程
        if (futureResponse.getInvokeCallback() != null) {

            // 回调调用方式
            try {
                executeResponseCallback(() -> {
                    if (xxlRpcResponse.getErrorMsg() != null) {
                        futureResponse.getInvokeCallback().onFailure(new XxlRpcException(xxlRpcResponse.getErrorMsg()));
                    } else {
                        futureResponse.getInvokeCallback().onSuccess(xxlRpcResponse.getResult());
                    }
                });
            } catch (Exception e) {
                logger.error(e.getMessage(), e);
            }
        } else {

            // 其他普通调用方式
            futureResponse.setResponse(xxlRpcResponse);
        }

        // 移除已完成请求
        futureResponsePool.remove(requestId);

    }


    // 响应回调线程池

    private ThreadPoolExecutor responseCallbackThreadPool = null;

    public void executeResponseCallback(Runnable runnable) {

        if (responseCallbackThreadPool == null) {
            synchronized (this) {
                if (responseCallbackThreadPool == null) {
                    responseCallbackThreadPool = new ThreadPoolExecutor(
                            10,
                            100,
                            60L,
                            TimeUnit.SECONDS,
                            new LinkedBlockingQueue<>(1000),
                            r -> new Thread(r, "xxl-rpc, XxlRpcInvokerFactory-responseCallbackThreadPool-" + r.hashCode()),
                            (r, executor) -> {
                                throw new XxlRpcException("xxl-rpc Invoke Callback Thread pool is EXHAUSTED!");
                            });        // 默认最大线程数300、最小线程数60
                }
            }
        }
        responseCallbackThreadPool.execute(runnable);
    }

    public void stopCallbackThreadPool() {
        if (responseCallbackThreadPool != null) {
            responseCallbackThreadPool.shutdown();
        }
    }

}
