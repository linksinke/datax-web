package com.wugui.datax.rpc.remoting.net.impl.netty.server;

import com.wugui.datax.rpc.remoting.net.impl.netty.codec.NettyDecoder;
import com.wugui.datax.rpc.remoting.net.impl.netty.codec.NettyEncoder;
import com.wugui.datax.rpc.remoting.net.params.Beat;
import com.wugui.datax.rpc.remoting.net.params.XxlRpcRequest;
import com.wugui.datax.rpc.remoting.net.params.XxlRpcResponse;
import com.wugui.datax.rpc.remoting.provider.XxlRpcProviderFactory;
import com.wugui.datax.rpc.util.ThreadPoolUtil;
import com.wugui.datax.rpc.remoting.net.Server;
import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelOption;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.timeout.IdleStateHandler;

import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/**
 * Netty RPC 服务端
 *
 * @author xuxueli 2015-10-29 18:17:14
 */
public class NettyServer extends Server {

    private Thread thread;

    @Override
    public void start(final XxlRpcProviderFactory xxlRpcProviderFactory) throws Exception {

        thread = new Thread(new Runnable() {
            @Override
            public void run() {

                // 整理调用参数
                final ThreadPoolExecutor serverHandlerPool = ThreadPoolUtil.makeServerThreadPool(
                        NettyServer.class.getSimpleName(),
                        xxlRpcProviderFactory.getCorePoolSize(),
                        xxlRpcProviderFactory.getMaxPoolSize());
                EventLoopGroup bossGroup = new NioEventLoopGroup();
                EventLoopGroup workerGroup = new NioEventLoopGroup();

                try {
                    // 启动服务端
                    ServerBootstrap bootstrap = new ServerBootstrap();
                    bootstrap.group(bossGroup, workerGroup)
                            .channel(NioServerSocketChannel.class)
                            .childHandler(new ChannelInitializer<SocketChannel>() {
                                @Override
                                public void initChannel(SocketChannel channel) throws Exception {
                                    channel.pipeline()
                                            .addLast(new IdleStateHandler(0,0, Beat.BEAT_INTERVAL*3, TimeUnit.SECONDS))     // 连续三个心跳周期空闲时关闭连接
                                            .addLast(new NettyDecoder(XxlRpcRequest.class, xxlRpcProviderFactory.getSerializerInstance()))
                                            .addLast(new NettyEncoder(XxlRpcResponse.class, xxlRpcProviderFactory.getSerializerInstance()))
                                            .addLast(new NettyServerHandler(xxlRpcProviderFactory, serverHandlerPool));
                                }
                            })
                            .childOption(ChannelOption.TCP_NODELAY, true)
                            .childOption(ChannelOption.SO_KEEPALIVE, true);

                    // 绑定监听端口
                    ChannelFuture future = bootstrap.bind(xxlRpcProviderFactory.getPort()).sync();

                    logger.info(">>>>>>>>>>> xxl-rpc remoting server start success, nettype = {}, port = {}", NettyServer.class.getName(), xxlRpcProviderFactory.getPort());
                    onStarted();

                    // 等待服务停止
                    future.channel().closeFuture().sync();

                } catch (Exception e) {
                    if (e instanceof InterruptedException) {
                        logger.info(">>>>>>>>>>> xxl-rpc remoting server stop.");
                    } else {
                        logger.error(">>>>>>>>>>> xxl-rpc remoting server error.", e);
                    }
                } finally {

                    // 停止运行
                    try {
                        serverHandlerPool.shutdown();    // 立即关闭线程池
                    } catch (Exception e) {
                        logger.error(e.getMessage(), e);
                    }
                    try {
                        workerGroup.shutdownGracefully();
                        bossGroup.shutdownGracefully();
                    } catch (Exception e) {
                        logger.error(e.getMessage(), e);
                    }

                }
            }
        });
        thread.setDaemon(true);
        thread.start();

    }

    @Override
    public void stop() throws Exception {

        // 关闭服务线程
        if (thread != null && thread.isAlive()) {
            thread.interrupt();
        }

        // 服务停止回调
        onStopped();
        logger.info(">>>>>>>>>>> xxl-rpc remoting server destroy success.");
    }

}
