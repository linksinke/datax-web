package com.wugui.datax.rpc.remoting.net.params;

import com.wugui.datax.rpc.remoting.invoker.XxlRpcInvokerFactory;
import com.wugui.datax.rpc.remoting.invoker.call.XxlRpcInvokeCallback;
import com.wugui.datax.rpc.util.XxlRpcException;

import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * 异步回调结果
 *
 * @author xuxueli 2015-11-5 14:26:37
 */
public class XxlRpcFutureResponse implements Future<XxlRpcResponse> {

    private XxlRpcInvokerFactory invokerFactory;

    // 网络传输数据
    private XxlRpcRequest request;
    private XxlRpcResponse response;

    // 异步结果同步锁
    private boolean done = false;
    private Object lock = new Object();

    // 可选的完成回调
    private XxlRpcInvokeCallback invokeCallback;


    public XxlRpcFutureResponse(final XxlRpcInvokerFactory invokerFactory, XxlRpcRequest request, XxlRpcInvokeCallback invokeCallback) {
        this.invokerFactory = invokerFactory;
        this.request = request;
        this.invokeCallback = invokeCallback;

        // 关联异步调用上下文
        setInvokerFuture();
    }


    // 响应容器

    public void setInvokerFuture() {
        this.invokerFactory.setInvokerFuture(request.getRequestId(), this);
    }

    public void removeInvokerFuture() {
        this.invokerFactory.removeInvokerFuture(request.getRequestId());
    }


    // 结果读取

    public XxlRpcRequest getRequest() {
        return request;
    }

    public XxlRpcInvokeCallback getInvokeCallback() {
        return invokeCallback;
    }


    // 调用完成回调

    public void setResponse(XxlRpcResponse response) {
        this.response = response;
        synchronized (lock) {
            done = true;
            lock.notifyAll();
        }
    }


    // 调用方等待

    @Override
    public boolean cancel(boolean mayInterruptIfRunning) {
        // 待完善
        return false;
    }

    @Override
    public boolean isCancelled() {
        // 待完善
        return false;
    }

    @Override
    public boolean isDone() {
        return done;
    }

    @Override
    public XxlRpcResponse get() throws InterruptedException {
        try {
            return get(-1, TimeUnit.MILLISECONDS);
        } catch (TimeoutException e) {
            throw new XxlRpcException(e);
        }
    }

    @Override
    public XxlRpcResponse get(long timeout, TimeUnit unit) throws InterruptedException, TimeoutException {
        if (!done) {
            synchronized (lock) {
                try {
                    if (timeout < 0) {
                        lock.wait();
                    } else {
                        long timeoutMillis = (TimeUnit.MILLISECONDS == unit) ? timeout : TimeUnit.MILLISECONDS.convert(timeout, unit);
                        lock.wait(timeoutMillis);
                    }
                } catch (InterruptedException e) {
                    throw e;
                }
            }
        }

        if (!done) {
            throw new XxlRpcException("xxl-rpc, request timeout at:" + System.currentTimeMillis() + ", request:" + request.toString());
        }
        return response;
    }


}
