package com.wugui.datax.rpc.remoting.invoker.call;

import com.wugui.datax.rpc.remoting.net.params.XxlRpcFutureResponse;
import com.wugui.datax.rpc.remoting.net.params.XxlRpcResponse;
import com.wugui.datax.rpc.util.XxlRpcException;

import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * @author xuxueli 2018-10-22 18:31:42
 */
public class XxlRpcInvokeFuture implements Future {


    private XxlRpcFutureResponse futureResponse;

    public XxlRpcInvokeFuture(XxlRpcFutureResponse futureResponse) {
        this.futureResponse = futureResponse;
    }

    public void stop() {
        // 移除异步调用上下文
        futureResponse.removeInvokerFuture();
    }


    @Override
    public boolean cancel(boolean mayInterruptIfRunning) {
        return futureResponse.cancel(mayInterruptIfRunning);
    }

    @Override
    public boolean isCancelled() {
        return futureResponse.isCancelled();
    }

    @Override
    public boolean isDone() {
        return futureResponse.isDone();
    }

    @Override
    public Object get() throws ExecutionException, InterruptedException {
        try {
            return get(-1, TimeUnit.MILLISECONDS);
        } catch (TimeoutException e) {
            throw new XxlRpcException(e);
        }
    }

    @Override
    public Object get(long timeout, TimeUnit unit) throws InterruptedException, ExecutionException, TimeoutException {
        try {
            // 等待异步调用结果
            XxlRpcResponse xxlRpcResponse = futureResponse.get(timeout, unit);
            if (xxlRpcResponse.getErrorMsg() != null) {
                throw new XxlRpcException(xxlRpcResponse.getErrorMsg());
            }
            return xxlRpcResponse.getResult();
        } finally {
            stop();
        }
    }


    // 线程级异步调用上下文

    private static ThreadLocal<XxlRpcInvokeFuture> threadInvokerFuture = new ThreadLocal<XxlRpcInvokeFuture>();

    /**
     * 获取异步调用结果
     *
     * @param type
     * @param <T>
     * @return
     */
    public static <T> Future<T> getFuture(Class<T> type) {
        Future<T> future = (Future<T>) threadInvokerFuture.get();
        threadInvokerFuture.remove();
        return future;
    }

    /**
     * 设置异步调用结果
     *
     * @param future
     */
    public static void setFuture(XxlRpcInvokeFuture future) {
        threadInvokerFuture.set(future);
    }

    /**
     * 清理异步调用结果
     */
    public static void removeFuture() {
        threadInvokerFuture.remove();
    }

}

