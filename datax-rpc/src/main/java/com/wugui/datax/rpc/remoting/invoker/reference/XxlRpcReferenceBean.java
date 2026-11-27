package com.wugui.datax.rpc.remoting.invoker.reference;

import com.wugui.datax.rpc.remoting.invoker.XxlRpcInvokerFactory;
import com.wugui.datax.rpc.remoting.invoker.call.CallType;
import com.wugui.datax.rpc.remoting.invoker.call.XxlRpcInvokeCallback;
import com.wugui.datax.rpc.remoting.invoker.call.XxlRpcInvokeFuture;
import com.wugui.datax.rpc.remoting.invoker.generic.XxlRpcGenericService;
import com.wugui.datax.rpc.remoting.invoker.route.LoadBalance;
import com.wugui.datax.rpc.remoting.net.Client;
import com.wugui.datax.rpc.remoting.net.impl.netty.client.NettyClient;
import com.wugui.datax.rpc.remoting.net.params.XxlRpcFutureResponse;
import com.wugui.datax.rpc.remoting.net.params.XxlRpcRequest;
import com.wugui.datax.rpc.remoting.net.params.XxlRpcResponse;
import com.wugui.datax.rpc.remoting.provider.XxlRpcProviderFactory;
import com.wugui.datax.rpc.serialize.Serializer;
import com.wugui.datax.rpc.serialize.impl.HessianSerializer;
import com.wugui.datax.rpc.util.ClassUtil;
import com.wugui.datax.rpc.util.XxlRpcException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.util.TreeSet;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * 通过编程接口创建的 RPC 服务引用
 *
 * @author xuxueli 2015-10-29 20:18:32
 */
public class XxlRpcReferenceBean {
    private static final Logger logger = LoggerFactory.getLogger(XxlRpcReferenceBean.class);
    // 避免在高频调用路径中执行额外的日志构建


    // 配置参数

    private Class<? extends Client> client = NettyClient.class;
    private Class<? extends Serializer> serializer = HessianSerializer.class;
    private CallType callType = CallType.SYNC;
    private LoadBalance loadBalance = LoadBalance.ROUND;

    private Class<?> iface = null;
    private String version = null;

    private long timeout = 10000;

    private String address = null;
    private String accessToken = null;

    private XxlRpcInvokeCallback invokeCallback = null;

    private XxlRpcInvokerFactory invokerFactory = null;


    // 设置配置
    public void setClient(Class<? extends Client> client) {
        this.client = client;
    }

    public void setSerializer(Class<? extends Serializer> serializer) {
        this.serializer = serializer;
    }

    public void setCallType(CallType callType) {
        this.callType = callType;
    }

    public void setLoadBalance(LoadBalance loadBalance) {
        this.loadBalance = loadBalance;
    }

    public void setIface(Class<?> iface) {
        this.iface = iface;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public void setTimeout(long timeout) {
        this.timeout = timeout;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public void setInvokeCallback(XxlRpcInvokeCallback invokeCallback) {
        this.invokeCallback = invokeCallback;
    }

    public void setInvokerFactory(XxlRpcInvokerFactory invokerFactory) {
        this.invokerFactory = invokerFactory;
    }


    // 获取配置
    public Serializer getSerializerInstance() {
        return serializerInstance;
    }

    public long getTimeout() {
        return timeout;
    }

    public XxlRpcInvokerFactory getInvokerFactory() {
        return invokerFactory;
    }

    public Class<?> getIface() {
        return iface;
    }


    // 客户端初始化

    private Client clientInstance = null;
    private Serializer serializerInstance = null;

    public XxlRpcReferenceBean initClient() throws Exception {

        // 参数校验
        if (this.client == null) {
            throw new XxlRpcException("xxl-rpc reference client missing.");
        }
        if (this.serializer == null) {
            throw new XxlRpcException("xxl-rpc reference serializer missing.");
        }
        if (this.callType == null) {
            throw new XxlRpcException("xxl-rpc reference callType missing.");
        }
        if (this.loadBalance == null) {
            throw new XxlRpcException("xxl-rpc reference loadBalance missing.");
        }
        if (this.iface == null) {
            throw new XxlRpcException("xxl-rpc reference iface missing.");
        }
        if (this.timeout < 0) {
            this.timeout = 0;
        }
        if (this.invokerFactory == null) {
            this.invokerFactory = XxlRpcInvokerFactory.getInstance();
        }

        // 初始化序列化器实例
        this.serializerInstance = serializer.newInstance();

        // 初始化客户端
        clientInstance = client.newInstance();
        clientInstance.init(this);

        return this;
    }


    // 辅助方法

    public Object getObject() throws Exception {

        // 初始化客户端
        initClient();

        // 创建动态代理
        return Proxy.newProxyInstance(Thread.currentThread()
                        .getContextClassLoader(), new Class[]{iface},
                (proxy, method, args) -> {

                    // 方法调用参数
                    String className = method.getDeclaringClass().getName();    // iface.getName()
                    String varsion_ = version;
                    String methodName = method.getName();
                    Class<?>[] parameterTypes = method.getParameterTypes();
                    Object[] parameters = args;

                    // 识别泛化调用
                    if (className.equals(XxlRpcGenericService.class.getName()) && methodName.equals("invoke")) {

                        Class<?>[] paramTypes = null;
                        if (args[3] != null) {
                            String[] paramTypes_str = (String[]) args[3];
                            if (paramTypes_str.length > 0) {
                                paramTypes = new Class[paramTypes_str.length];
                                for (int i = 0; i < paramTypes_str.length; i++) {
                                    paramTypes[i] = ClassUtil.resolveClass(paramTypes_str[i]);
                                }
                            }
                        }

                        className = (String) args[0];
                        varsion_ = (String) args[1];
                        methodName = (String) args[2];
                        parameterTypes = paramTypes;
                        parameters = (Object[]) args[4];
                    }

                    // 过滤 Object.toString 等本地对象方法
                    if (className.equals(Object.class.getName())) {
                        logger.info(">>>>>>>>>>> xxl-rpc proxy class-method not support [{}#{}]", className, methodName);
                        throw new XxlRpcException("xxl-rpc proxy class-method not support");
                    }

                    // 服务地址
                    String finalAddress = address;
                    if (finalAddress == null || finalAddress.trim().length() == 0) {
                        if (invokerFactory != null && invokerFactory.getServiceRegistry() != null) {
                            // 发现服务地址
                            String serviceKey = XxlRpcProviderFactory.makeServiceKey(className, varsion_);
                            TreeSet<String> addressSet = invokerFactory.getServiceRegistry().discovery(serviceKey);
                            // 选择负载均衡策略
                            if (addressSet == null || addressSet.size() == 0) {
                                // 跳过无需处理的调用
                            } else if (addressSet.size() == 1) {
                                finalAddress = addressSet.first();
                            } else {
                                finalAddress = loadBalance.xxlRpcInvokerRouter.route(serviceKey, addressSet);
                            }

                        }
                    }
                    if (finalAddress == null || finalAddress.trim().length() == 0) {
                        throw new XxlRpcException("xxl-rpc reference bean[" + className + "] address empty");
                    }

                    // 请求对象
                    XxlRpcRequest xxlRpcRequest = new XxlRpcRequest();
                    xxlRpcRequest.setRequestId(UUID.randomUUID().toString());
                    xxlRpcRequest.setCreateMillisTime(System.currentTimeMillis());
                    xxlRpcRequest.setAccessToken(accessToken);
                    xxlRpcRequest.setClassName(className);
                    xxlRpcRequest.setMethodName(methodName);
                    xxlRpcRequest.setParameterTypes(parameterTypes);
                    xxlRpcRequest.setParameters(parameters);
                    xxlRpcRequest.setVersion(version);

                    // 发送请求
                    if (CallType.SYNC == callType) {
                        // 登记异步响应
                        XxlRpcFutureResponse futureResponse = new XxlRpcFutureResponse(invokerFactory, xxlRpcRequest, null);
                        try {
                            // 发起远程调用
                            clientInstance.asyncSend(finalAddress, xxlRpcRequest);

                            // 等待异步调用结果
                            XxlRpcResponse xxlRpcResponse = futureResponse.get(timeout, TimeUnit.MILLISECONDS);
                            if (xxlRpcResponse.getErrorMsg() != null) {
                                throw new XxlRpcException(xxlRpcResponse.getErrorMsg());
                            }
                            return xxlRpcResponse.getResult();
                        } catch (Exception e) {
                            logger.info(">>>>>>>>>>> xxl-rpc, invoke error, address:{}, XxlRpcRequest{}", finalAddress, xxlRpcRequest);

                            throw (e instanceof XxlRpcException) ? e : new XxlRpcException(e);
                        } finally {
                            // 移除异步响应
                            futureResponse.removeInvokerFuture();
                        }
                    } else if (CallType.FUTURE == callType) {
                        // 登记异步响应
                        XxlRpcFutureResponse futureResponse = new XxlRpcFutureResponse(invokerFactory, xxlRpcRequest, null);
                        try {
                            // 登记异步调用上下文
                            XxlRpcInvokeFuture invokeFuture = new XxlRpcInvokeFuture(futureResponse);
                            XxlRpcInvokeFuture.setFuture(invokeFuture);

// 发起远程调用
                            clientInstance.asyncSend(finalAddress, xxlRpcRequest);

                            return null;
                        } catch (Exception e) {
                            logger.info(">>>>>>>>>>> xxl-rpc, invoke error, address:{}, XxlRpcRequest{}", finalAddress, xxlRpcRequest);

                            // 移除异步响应
                            futureResponse.removeInvokerFuture();

                            throw (e instanceof XxlRpcException) ? e : new XxlRpcException(e);
                        }

                    } else if (CallType.CALLBACK == callType) {

                        // 获取调用回调
                        XxlRpcInvokeCallback finalInvokeCallback = invokeCallback;
                        XxlRpcInvokeCallback threadInvokeCallback = XxlRpcInvokeCallback.getCallback();
                        if (threadInvokeCallback != null) {
                            finalInvokeCallback = threadInvokeCallback;
                        }
                        if (finalInvokeCallback == null) {
                            throw new XxlRpcException("xxl-rpc XxlRpcInvokeCallback（CallType=" + CallType.CALLBACK.name() + "） cannot be null.");
                        }

                        // 登记异步响应
                        XxlRpcFutureResponse futureResponse = new XxlRpcFutureResponse(invokerFactory, xxlRpcRequest, finalInvokeCallback);
                        try {
                            clientInstance.asyncSend(finalAddress, xxlRpcRequest);
                        } catch (Exception e) {
                            logger.info(">>>>>>>>>>> xxl-rpc, invoke error, address:{}, XxlRpcRequest{}", finalAddress, xxlRpcRequest);

                            // 移除异步响应
                            futureResponse.removeInvokerFuture();

                            throw (e instanceof XxlRpcException) ? e : new XxlRpcException(e);
                        }

                        return null;
                    } else if (CallType.ONEWAY == callType) {
                        clientInstance.asyncSend(finalAddress, xxlRpcRequest);
                        return null;
                    } else {
                        throw new XxlRpcException("xxl-rpc callType[" + callType + "] invalid");
                    }

                });
    }

}
