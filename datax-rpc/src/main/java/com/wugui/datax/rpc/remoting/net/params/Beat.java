package com.wugui.datax.rpc.remoting.net.params;

/**
 * 连接保活心跳
 *
 * @author xuxueli 2019-09-27
 */
public final class Beat {

    public static final int BEAT_INTERVAL = 30;
    public static final String BEAT_ID = "BEAT_PING_PONG";

    public static XxlRpcRequest BEAT_PING;

    static {
        BEAT_PING = new XxlRpcRequest(){};
        BEAT_PING.setRequestId(BEAT_ID);
    }

}
