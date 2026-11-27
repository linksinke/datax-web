package com.wugui.datax.rpc.remoting.net.common;

import com.wugui.datax.rpc.remoting.invoker.XxlRpcInvokerFactory;
import com.wugui.datax.rpc.remoting.invoker.reference.XxlRpcReferenceBean;
import com.wugui.datax.rpc.remoting.net.params.BaseCallback;
import com.wugui.datax.rpc.remoting.net.params.XxlRpcRequest;
import com.wugui.datax.rpc.serialize.Serializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * @author xuxueli 2018-10-19
 */
public abstract class ConnectClient {
    protected static transient Logger logger = LoggerFactory.getLogger(ConnectClient.class);

    // 连接接口

    public abstract void init(String address, final Serializer serializer, final XxlRpcInvokerFactory xxlRpcInvokerFactory) throws Exception;

    public abstract void close();

    public abstract boolean isValidate();

    public abstract void send(XxlRpcRequest xxlRpcRequest) throws Exception;


    // 客户端连接池

    /**
     * 异步发送请求
     */
    public static void asyncSend(XxlRpcRequest xxlRpcRequest, String address,
                                 Class<? extends ConnectClient> connectClientImpl,
                                 final XxlRpcReferenceBean xxlRpcReferenceBean) throws Exception {

        // 按地址缓存连接客户端
        ConnectClient clientPool = ConnectClient.getPool(address, connectClientImpl, xxlRpcReferenceBean);

        try {
            // 发起远程调用
            clientPool.send(xxlRpcRequest);
        } catch (Exception e) {
            throw e;
        }

    }

    private static volatile ConcurrentMap<String, ConnectClient> connectClientMap;        // 静态容器中已登记停止回调
    private static volatile ConcurrentMap<String, Object> connectClientLockMap = new ConcurrentHashMap<>();

    private static ConnectClient getPool(String address, Class<? extends ConnectClient> connectClientImpl,
                                         final XxlRpcReferenceBean xxlRpcReferenceBean) throws Exception {

        // 初始化基础组件，避免重复启动
        if (connectClientMap == null) {
            synchronized (ConnectClient.class) {
                if (connectClientMap == null) {
                    // 初始化
                    connectClientMap = new ConcurrentHashMap<String, ConnectClient>();
                    // 停止回调线程
                    xxlRpcReferenceBean.getInvokerFactory().addStopCallBack(new BaseCallback() {
                        @Override
                        public void run() throws Exception {
                            if (connectClientMap.size() > 0) {
                                for (String key : connectClientMap.keySet()) {
                                    ConnectClient clientPool = connectClientMap.get(key);
                                    clientPool.close();
                                }
                                connectClientMap.clear();
                            }
                        }
                    });
                }
            }
        }

        // 获取有效客户端连接
        ConnectClient connectClient = connectClientMap.get(address);
        if (connectClient != null && connectClient.isValidate()) {
            return connectClient;
        }

        // 同步锁
        Object clientLock = connectClientLockMap.get(address);
        if (clientLock == null) {
            connectClientLockMap.putIfAbsent(address, new Object());
            clientLock = connectClientLockMap.get(address);
        }

        // 移除失效客户端并重新创建
        synchronized (clientLock) {

            // 加锁后再次检查有效客户端
            connectClient = connectClientMap.get(address);
            if (connectClient != null && connectClient.isValidate()) {
                return connectClient;
            }

            // 移除旧记录
            if (connectClient != null) {
                connectClient.close();
                connectClientMap.remove(address);
            }

            // 更新客户端连接池
            ConnectClient connectClient_new = connectClientImpl.newInstance();
            try {
                connectClient_new.init(address, xxlRpcReferenceBean.getSerializerInstance(), xxlRpcReferenceBean.getInvokerFactory());
                connectClientMap.put(address, connectClient_new);
            } catch (Exception e) {
                connectClient_new.close();
                throw e;
            }

            return connectClient_new;
        }

    }

}
