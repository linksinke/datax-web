package com.wugui.datax.admin.core.scheduler;

import com.wugui.datatx.core.biz.ExecutorBiz;
import com.wugui.datatx.core.enums.ExecutorBlockStrategyEnum;
import com.wugui.datax.admin.core.conf.JobAdminConfig;
import com.wugui.datax.admin.core.thread.*;
import com.wugui.datax.admin.core.util.I18nUtil;
import com.wugui.datax.rpc.remoting.invoker.call.CallType;
import com.wugui.datax.rpc.remoting.invoker.reference.XxlRpcReferenceBean;
import com.wugui.datax.rpc.remoting.invoker.route.LoadBalance;
import com.wugui.datax.rpc.remoting.net.impl.netty_http.client.NettyHttpClient;
import com.wugui.datax.rpc.serialize.impl.HessianSerializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * @author xuxueli 2018-10-28 00:18:17
 */

public class JobScheduler {
    private static final Logger logger = LoggerFactory.getLogger(JobScheduler.class);


    public void init() throws Exception {
        // 初始化国际化资源
        initI18n();

        // 启动执行器注册监控
        JobRegistryMonitorHelper.getInstance().start();

        // 启动任务失败监控
        JobFailMonitorHelper.getInstance().start();

        // 启动调度触发线程池
        JobTriggerPoolHelper.toStart();

        // 启动日志报表线程
        JobLogReportHelper.getInstance().start();

        // 启动任务调度
        JobScheduleHelper.getInstance().start();

        logger.info(">>>>>>>>> init datax-web admin success.");
    }


    public void destroy() throws Exception {

        // 停止任务调度
        JobScheduleHelper.getInstance().toStop();

        // 停止日志报表线程
        JobLogReportHelper.getInstance().toStop();

        // 停止调度触发线程池
        JobTriggerPoolHelper.toStop();

        // 停止失败监控
        JobFailMonitorHelper.getInstance().toStop();

        // 停止注册监控
        JobRegistryMonitorHelper.getInstance().toStop();

    }

    // ---------------------- I18n ----------------------

    private void initI18n() {
        for (ExecutorBlockStrategyEnum item : ExecutorBlockStrategyEnum.values()) {
            item.setTitle(I18nUtil.getString("jobconf_block_".concat(item.name())));
        }
    }

    // 执行器客户端
    private static ConcurrentMap<String, ExecutorBiz> executorBizRepository = new ConcurrentHashMap<>();

    public static ExecutorBiz getExecutorBiz(String address) throws Exception {
        // 参数校验
        if (address == null || address.trim().length() == 0) {
            return null;
        }

        // 读取客户端缓存
        address = address.trim();
        ExecutorBiz executorBiz = executorBizRepository.get(address);
        if (executorBiz != null) {
            return executorBiz;
        }

        // 更新客户端缓存
        XxlRpcReferenceBean referenceBean = new XxlRpcReferenceBean();
        referenceBean.setClient(NettyHttpClient.class);
        referenceBean.setSerializer(HessianSerializer.class);
        referenceBean.setCallType(CallType.SYNC);
        referenceBean.setLoadBalance(LoadBalance.ROUND);
        referenceBean.setIface(ExecutorBiz.class);
        referenceBean.setVersion(null);
        referenceBean.setTimeout(3000);
        referenceBean.setAddress(address);
        referenceBean.setAccessToken(JobAdminConfig.getAdminConfig().getAccessToken());
        referenceBean.setInvokeCallback(null);
        referenceBean.setInvokerFactory(null);

        executorBiz = (ExecutorBiz) referenceBean.getObject();

        executorBizRepository.put(address, executorBiz);
        return executorBiz;
    }

}
