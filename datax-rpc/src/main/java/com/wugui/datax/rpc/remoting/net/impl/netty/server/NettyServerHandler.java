package com.wugui.datax.rpc.remoting.net.impl.netty.server;

import com.wugui.datax.rpc.remoting.net.params.Beat;
import com.wugui.datax.rpc.remoting.net.params.XxlRpcRequest;
import com.wugui.datax.rpc.remoting.net.params.XxlRpcResponse;
import com.wugui.datax.rpc.remoting.provider.XxlRpcProviderFactory;
import com.wugui.datax.rpc.util.ThrowableUtil;
import io.netty.channel.ChannelHandlerContext;
import io.netty.channel.SimpleChannelInboundHandler;
import io.netty.handler.timeout.IdleStateEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.ThreadPoolExecutor;


/**
 * Netty 服务端请求处理器
 *
 * @author xuxueli 2015-10-29 20:07:37
 */
public class NettyServerHandler extends SimpleChannelInboundHandler<XxlRpcRequest> {
    private static final Logger logger = LoggerFactory.getLogger(NettyServerHandler.class);

    private XxlRpcProviderFactory xxlRpcProviderFactory;
    private ThreadPoolExecutor serverHandlerPool;

    public NettyServerHandler(final XxlRpcProviderFactory xxlRpcProviderFactory, final ThreadPoolExecutor serverHandlerPool) {
        this.xxlRpcProviderFactory = xxlRpcProviderFactory;
        this.serverHandlerPool = serverHandlerPool;
    }


    @Override
    public void channelRead0(final ChannelHandlerContext ctx, final XxlRpcRequest xxlRpcRequest) throws Exception {

        // 过滤心跳消息
        if (Beat.BEAT_ID.equalsIgnoreCase(xxlRpcRequest.getRequestId())){
            logger.debug(">>>>>>>>>>> xxl-rpc provider netty server read beat-ping.");
            return;
        }

        // 发起远程调用
        try {
            serverHandlerPool.execute(new Runnable() {
                @Override
                public void run() {
                    // 调用服务并返回响应
                    XxlRpcResponse xxlRpcResponse = xxlRpcProviderFactory.invokeService(xxlRpcRequest);

                    ctx.writeAndFlush(xxlRpcResponse);
                }
            });
        } catch (Exception e) {
            // 捕获并处理异常
            XxlRpcResponse xxlRpcResponse = new XxlRpcResponse();
            xxlRpcResponse.setRequestId(xxlRpcRequest.getRequestId());
            xxlRpcResponse.setErrorMsg(ThrowableUtil.toString(e));

            ctx.writeAndFlush(xxlRpcResponse);
        }

    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
    	logger.error(">>>>>>>>>>> xxl-rpc provider netty server caught exception", cause);
        ctx.close();
    }

    @Override
    public void userEventTriggered(ChannelHandlerContext ctx, Object evt) throws Exception {
        if (evt instanceof IdleStateEvent){
            ctx.channel().close();      // 连续三个心跳周期空闲时关闭连接
            logger.debug(">>>>>>>>>>> xxl-rpc provider netty server close an idle channel.");
        } else {
            super.userEventTriggered(ctx, evt);
        }
    }

}
