package com.wugui.datax.rpc.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.net.ServerSocket;

/**
 * 网络工具
 *
 * @author xuxueli 2017-11-29 17:00:25
 */
public class NetUtil {
    private static Logger logger = LoggerFactory.getLogger(NetUtil.class);

    /**
     * 查找可用端口
     *
     * @param defaultPort
     * @return
     */
    public static int findAvailablePort(int defaultPort) {
        int portTmp = defaultPort;
        while (portTmp < 65535) {
            if (!isPortUsed(portTmp)) {
                return portTmp;
            } else {
                portTmp++;
            }
        }
        portTmp = defaultPort--;
        while (portTmp > 0) {
            if (!isPortUsed(portTmp)) {
                return portTmp;
            } else {
                portTmp--;
            }
        }
        throw new XxlRpcException("no available port.");
    }

    /**
     * 检查端口是否已占用
     *
     * @param port
     * @return
     */
    public static boolean isPortUsed(int port) {
        boolean used;
        ServerSocket serverSocket = null;
        try {
            serverSocket = new ServerSocket(port);
            used = false;
        } catch (IOException e) {
            logger.info(">>>>>>>>>>> xxl-rpc, port[{}] is in use.", port);
            used = true;
        } finally {
            if (serverSocket != null) {
                try {
                    serverSocket.close();
                } catch (IOException e) {
                    logger.info("");
                }
            }
        }
        return used;
    }

}
