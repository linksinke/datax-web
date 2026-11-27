package com.wugui.datax.rpc.remoting.invoker.impl;

import com.wugui.datax.rpc.registry.ServiceRegistry;
import com.wugui.datax.rpc.remoting.invoker.XxlRpcInvokerFactory;
import com.wugui.datax.rpc.remoting.invoker.annotation.XxlRpcReference;
import com.wugui.datax.rpc.remoting.invoker.reference.XxlRpcReferenceBean;
import com.wugui.datax.rpc.remoting.provider.XxlRpcProviderFactory;
import com.wugui.datax.rpc.util.XxlRpcException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanFactory;
import org.springframework.beans.factory.BeanFactoryAware;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.config.InstantiationAwareBeanPostProcessorAdapter;
import org.springframework.util.ReflectionUtils;

import java.lang.reflect.Field;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * Spring 环境中的 RPC 调用方工厂，按注解初始化注册服务和服务引用
 *
 * @author xuxueli 2018-10-19
 */
public class XxlRpcSpringInvokerFactory extends InstantiationAwareBeanPostProcessorAdapter implements InitializingBean, DisposableBean, BeanFactoryAware {
    private Logger logger = LoggerFactory.getLogger(XxlRpcSpringInvokerFactory.class);

    // 配置参数

    private Class<? extends ServiceRegistry> serviceRegistryClass;          // 按名称加载类
    private Map<String, String> serviceRegistryParam;


    public void setServiceRegistryClass(Class<? extends ServiceRegistry> serviceRegistryClass) {
        this.serviceRegistryClass = serviceRegistryClass;
    }

    public void setServiceRegistryParam(Map<String, String> serviceRegistryParam) {
        this.serviceRegistryParam = serviceRegistryParam;
    }


    // 辅助方法

    private XxlRpcInvokerFactory xxlRpcInvokerFactory;

    @Override
    public void afterPropertiesSet() throws Exception {
        // 启动调用方工厂
        xxlRpcInvokerFactory = new XxlRpcInvokerFactory(serviceRegistryClass, serviceRegistryParam);
        xxlRpcInvokerFactory.start();
    }

    @Override
    public boolean postProcessAfterInstantiation(final Object bean, final String beanName) throws BeansException {

        // 收集服务引用
        final Set<String> serviceKeyList = new HashSet<>();

        // 解析 RPC 服务引用配置
        ReflectionUtils.doWithFields(bean.getClass(), field -> {
            if (field.isAnnotationPresent(XxlRpcReference.class)) {
                // 参数校验
                Class iface = field.getType();
                if (!iface.isInterface()) {
                    throw new XxlRpcException("xxl-rpc, reference(XxlRpcReference) must be interface.");
                }

                XxlRpcReference rpcReference = field.getAnnotation(XxlRpcReference.class);

                // 初始化服务引用对象
                XxlRpcReferenceBean referenceBean = new XxlRpcReferenceBean();
                referenceBean.setClient(rpcReference.client());
                referenceBean.setSerializer(rpcReference.serializer());
                referenceBean.setCallType(rpcReference.callType());
                referenceBean.setLoadBalance(rpcReference.loadBalance());
                referenceBean.setIface(iface);
                referenceBean.setVersion(rpcReference.version());
                referenceBean.setTimeout(rpcReference.timeout());
                referenceBean.setAddress(rpcReference.address());
                referenceBean.setAccessToken(rpcReference.accessToken());
                referenceBean.setInvokeCallback(null);
                referenceBean.setInvokerFactory(xxlRpcInvokerFactory);


                // 获取服务代理对象
                Object serviceProxy;
                try {
                    serviceProxy = referenceBean.getObject();
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }

                // 设置服务引用字段
                field.setAccessible(true);
                field.set(bean, serviceProxy);

                logger.info(">>>>>>>>>>> xxl-rpc, invoker factory init reference bean success. serviceKey = {}, bean.field = {}.{}",
                        XxlRpcProviderFactory.makeServiceKey(iface.getName(), rpcReference.version()), beanName, field.getName());

                // 收集服务引用
                String serviceKey = XxlRpcProviderFactory.makeServiceKey(iface.getName(), rpcReference.version());
                serviceKeyList.add(serviceKey);

            }
        });

        // 批量发现服务
        if (xxlRpcInvokerFactory.getServiceRegistry() != null) {
            try {
                xxlRpcInvokerFactory.getServiceRegistry().discovery(serviceKeyList);
            } catch (Exception e) {
                logger.error(e.getMessage(), e);
            }
        }

        return super.postProcessAfterInstantiation(bean, beanName);
    }


    @Override
    public void destroy() throws Exception {

        // 停止调用方工厂
        xxlRpcInvokerFactory.stop();
    }

    private BeanFactory beanFactory;

    @Override
    public void setBeanFactory(BeanFactory beanFactory) throws BeansException {
        this.beanFactory = beanFactory;
    }
}
