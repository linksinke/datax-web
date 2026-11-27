package com.wugui.datatx.core.executor;

import com.wugui.datatx.core.biz.AdminBiz;
import com.wugui.datatx.core.biz.ExecutorBiz;
import com.wugui.datatx.core.biz.client.AdminBizClient;
import com.wugui.datatx.core.biz.impl.ExecutorBizImpl;
import com.wugui.datatx.core.handler.IJobHandler;
import com.wugui.datatx.core.log.JobFileAppender;
import com.wugui.datatx.core.thread.*;
import com.wugui.datax.rpc.registry.ServiceRegistry;
import com.wugui.datax.rpc.remoting.net.impl.netty_http.server.NettyHttpServer;
import com.wugui.datax.rpc.remoting.provider.XxlRpcProviderFactory;
import com.wugui.datax.rpc.serialize.Serializer;
import com.wugui.datax.rpc.serialize.impl.HessianSerializer;
import com.wugui.datax.rpc.util.IpUtil;
import com.wugui.datax.rpc.util.NetUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * 创建者：xuxueli，时间：2016/3/2 21:14.
 */
public class JobExecutor {
    private static final Logger logger = LoggerFactory.getLogger(JobExecutor.class);

    // 执行器参数
    private String adminAddresses;
    private String appName;
    private String ip;
    private int port;
    private String accessToken;
    private String logPath;
    private int logRetentionDays;

    public void setAdminAddresses(String adminAddresses) {
        this.adminAddresses = adminAddresses;
    }

    public void setAppName(String appName) {
        this.appName = appName;
    }

    public void setIp(String ip) {
        this.ip = ip;
    }

    public void setPort(int port) {
        this.port = port;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public void setLogPath(String logPath) {
        this.logPath = logPath;
    }

    public void setLogRetentionDays(int logRetentionDays) {
        this.logRetentionDays = logRetentionDays;
    }


    // 执行器启动与停止
    public void start() throws Exception {

        // 初始化日志目录
        JobFileAppender.initLogPath(logPath);

        // 初始化远程调用与管理端客户端
        initAdminBizList(adminAddresses, accessToken);


        // 初始化日志文件清理线程
        JobLogFileCleanThread.getInstance().start(logRetentionDays);

        // 初始化触发结果回调线程
        TriggerCallbackThread.getInstance().start();

        // 初始化进程结果回调线程
        ProcessCallbackThread.getInstance().start();

        // 初始化执行器服务端
        port = port > 0 ? port : NetUtil.findAvailablePort(9999);
        ip = (ip != null && ip.trim().length() > 0) ? ip : IpUtil.getIp();
        initRpcProvider(ip, port, appName, accessToken);
    }

    public void destroy() {

        // 关闭执行器服务端
        stopRpcProvider();

        // 清理任务线程容器
        if (jobThreadRepository.size() > 0) {
            for (Map.Entry<Integer, JobThread> item : jobThreadRepository.entrySet()) {
                removeJobThread(item.getKey(), "web container destroy and kill the job.");
                JobThread oldJobThread = removeJobThread(item.getKey(), "web container destroy and kill the job.");
                // 等待任务线程将结果放入回调队列
                if (oldJobThread != null) {
                    try {
                        oldJobThread.join();
                    } catch (InterruptedException e) {
                        logger.error(">>>>>>>>>>> datax-web, JobThread destroy(join) error, jobId:{}", item.getKey(), e);
                    }
                }
            }
            jobThreadRepository.clear();
        }
        jobHandlerRepository.clear();

        // 停止日志清理线程
        JobLogFileCleanThread.getInstance().toStop();

        // 停止触发回调线程
        TriggerCallbackThread.getInstance().toStop();

        // 停止进程回调线程
        ProcessCallbackThread.getInstance().toStop();

    }


    // 管理端 RPC 调用方
    private static List<AdminBiz> adminBizList;
    private static Serializer serializer = new HessianSerializer();

    private void initAdminBizList(String adminAddresses, String accessToken) throws Exception {
        if (adminAddresses != null && adminAddresses.trim().length() > 0) {
            for (String address : adminAddresses.trim().split(",")) {
                if (address != null && address.trim().length() > 0) {
                    //实例化AdminBizClient
                    AdminBiz adminBiz = new AdminBizClient(address.trim(), accessToken);

                    if (adminBizList == null) {
                        adminBizList = new ArrayList<>();
                    }
                    adminBizList.add(adminBiz);
                }
            }
        }
    }

    public static List<AdminBiz> getAdminBizList() {
        return adminBizList;
    }

    public static Serializer getSerializer() {
        return serializer;
    }


    // 执行器 RPC 服务端
    private XxlRpcProviderFactory xxlRpcProviderFactory = null;

    private void initRpcProvider(String ip, int port, String appName, String accessToken) throws Exception {

        // 初始化服务提供方工厂
        String address = IpUtil.getIpPort(ip, port);
        Map<String, String> serviceRegistryParam = new HashMap<>();
        serviceRegistryParam.put("appName", appName);
        serviceRegistryParam.put("address", address);

        xxlRpcProviderFactory = new XxlRpcProviderFactory();

        xxlRpcProviderFactory.setServer(NettyHttpServer.class);
        xxlRpcProviderFactory.setSerializer(HessianSerializer.class);
        xxlRpcProviderFactory.setCorePoolSize(20);
        xxlRpcProviderFactory.setMaxPoolSize(200);
        xxlRpcProviderFactory.setIp(ip);
        xxlRpcProviderFactory.setPort(port);
        xxlRpcProviderFactory.setAccessToken(accessToken);
        xxlRpcProviderFactory.setServiceRegistry(ExecutorServiceRegistry.class);
        xxlRpcProviderFactory.setServiceRegistryParam(serviceRegistryParam);

        // 注册服务实现
        xxlRpcProviderFactory.addService(ExecutorBiz.class.getName(), null, new ExecutorBizImpl());

        // 启动
        xxlRpcProviderFactory.start();

    }

    public static class ExecutorServiceRegistry extends ServiceRegistry {

        @Override
        public void start(Map<String, String> param) {
            // 启动注册服务
            ExecutorRegistryThread.getInstance().start(param.get("appName"), param.get("address"));
        }

        @Override
        public void stop() {
            // 停止注册服务
            ExecutorRegistryThread.getInstance().toStop();
        }

        @Override
        public boolean registry(Set<String> keys, String value) {
            return false;
        }

        @Override
        public boolean remove(Set<String> keys, String value) {
            return false;
        }

        @Override
        public Map<String, TreeSet<String>> discovery(Set<String> keys) {
            return null;
        }

        @Override
        public TreeSet<String> discovery(String key) {
            return null;
        }

    }

    private void stopRpcProvider() {
        // 停止服务提供方工厂
        try {
            xxlRpcProviderFactory.stop();
        } catch (Exception e) {
            logger.error(e.getMessage(), e);
        }
    }


    // 任务处理器容器
    private static ConcurrentMap<String, IJobHandler> jobHandlerRepository = new ConcurrentHashMap<String, IJobHandler>();

    public static IJobHandler registJobHandler(String name, IJobHandler jobHandler) {
        logger.info(">>>>>>>>>>> datax-web register jobhandler success, name:{}, jobHandler:{}", name, jobHandler);
        return jobHandlerRepository.put(name, jobHandler);
    }

    public static IJobHandler loadJobHandler(String name) {
        return jobHandlerRepository.get(name);
    }


    // 任务线程容器
    private static ConcurrentMap<Integer, JobThread> jobThreadRepository = new ConcurrentHashMap<Integer, JobThread>();

    public static JobThread registJobThread(int jobId, IJobHandler handler, String removeOldReason) {
        JobThread newJobThread = new JobThread(jobId, handler);
        newJobThread.start();
        logger.info(">>>>>>>>>>> datax-web regist JobThread success, jobId:{}, handler:{}", new Object[]{jobId, handler});

        JobThread oldJobThread = jobThreadRepository.put(jobId, newJobThread);    // 写入新线程并取得旧线程，以便停止被替换的实例
        if (oldJobThread != null) {
            oldJobThread.toStop(removeOldReason);
            oldJobThread.interrupt();
        }

        return newJobThread;
    }

    public static JobThread removeJobThread(int jobId, String removeOldReason) {
        JobThread oldJobThread = jobThreadRepository.remove(jobId);
        if (oldJobThread != null) {
            oldJobThread.toStop(removeOldReason);
            oldJobThread.interrupt();
            return oldJobThread;
        }
        return null;
    }

    public static JobThread loadJobThread(int jobId) {
        JobThread jobThread = jobThreadRepository.get(jobId);
        return jobThread;
    }

}
