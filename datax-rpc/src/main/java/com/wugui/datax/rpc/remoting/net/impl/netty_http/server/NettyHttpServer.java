package com.wugui.datax.rpc.remoting.net.impl.netty_http.server;

import com.wugui.datax.rpc.remoting.net.Server;
import com.wugui.datax.rpc.remoting.net.common.NettyConstant;
import com.wugui.datax.rpc.remoting.net.params.Beat;
import com.wugui.datax.rpc.remoting.provider.XxlRpcProviderFactory;
import com.wugui.datax.rpc.util.ThreadPoolUtil;
import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelInitializer;
import io.netty.channel.ChannelOption;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.SocketChannel;
import io.netty.channel.socket.nio.NioServerSocketChannel;
import io.netty.handler.codec.http.HttpObjectAggregator;
import io.netty.handler.codec.http.HttpServerCodec;
import io.netty.handler.timeout.IdleStateHandler;

import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/**
 * 基于 Netty 的 HTTP 通信
 *
 * @author xuxueli 2015-11-24 22:25:15
 */
public class NettyHttpServer extends Server {

    private Thread thread;

    @Override
    public void start(final XxlRpcProviderFactory xxlRpcProviderFactory) {

        thread = new Thread(() -> {
            // 整理调用参数
            final ThreadPoolExecutor serverHandlerPool = ThreadPoolUtil.makeServerThreadPool(
                    NettyHttpServer.class.getSimpleName(),
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
                            public void initChannel(SocketChannel channel) {
                                channel.pipeline()
                                        .addLast(new IdleStateHandler(0, 0, Beat.BEAT_INTERVAL * 3, TimeUnit.SECONDS))  // 连续三个心跳周期空闲时关闭连接
                                        .addLast(new HttpServerCodec())
                                        .addLast(new HttpObjectAggregator(NettyConstant.MAX_LENGTH))  // 聚合完整 HTTP 请求与响应
                                        .addLast(new NettyHttpServerHandler(xxlRpcProviderFactory, serverHandlerPool));
                            }
                        })
                        .childOption(ChannelOption.SO_KEEPALIVE, true);

                // 绑定监听端口
                ChannelFuture future = bootstrap.bind(xxlRpcProviderFactory.getPort()).sync();

                logger.info(">>>>>>>>>>> xxl-rpc remoting server start success, nettype = {}, port = {}", NettyHttpServer.class.getName(), xxlRpcProviderFactory.getPort());
                onStarted();

                // 等待服务停止
                future.channel().closeFuture().sync();

            } catch (InterruptedException e) {
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

        });
        thread.setDaemon(true);    // 守护线程随非守护线程结束而退出，不阻止虚拟机关闭
        thread.start();
    }

    @Override
    public void stop() {
        // 关闭服务线程
        if (thread != null && thread.isAlive()) {
            thread.interrupt();
        }

        // 服务停止回调
        onStopped();
        logger.info(">>>>>>>>>>> xxl-rpc remoting server destroy success.");
    }

}
