package com.wugui.datax.rpc.remoting.invoker.call;


/**
 * @author xuxueli 2018-10-23
 */
public abstract class XxlRpcInvokeCallback<T> {

    public abstract void onSuccess(T result);

    public abstract void onFailure(Throwable exception);


    // 线程级回调上下文

    private static ThreadLocal<XxlRpcInvokeCallback> threadInvokerFuture = new ThreadLocal<XxlRpcInvokeCallback>();

    /**
     * 获取调用回调
     *
     * @return
     */
    public static XxlRpcInvokeCallback getCallback() {
        XxlRpcInvokeCallback invokeCallback = threadInvokerFuture.get();
        threadInvokerFuture.remove();
        return invokeCallback;
    }

    /**
     * 设置异步调用结果
     *
     * @param invokeCallback
     */
    public static void setCallback(XxlRpcInvokeCallback invokeCallback) {
        threadInvokerFuture.set(invokeCallback);
    }

    /**
     * 清理异步调用结果
     */
    public static void removeCallback() {
        threadInvokerFuture.remove();
    }


}
