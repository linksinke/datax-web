package com.wugui.datax.rpc.remoting.provider;

import com.wugui.datax.rpc.registry.ServiceRegistry;
import com.wugui.datax.rpc.remoting.net.Server;
import com.wugui.datax.rpc.remoting.net.impl.netty.server.NettyServer;
import com.wugui.datax.rpc.remoting.net.params.BaseCallback;
import com.wugui.datax.rpc.remoting.net.params.XxlRpcRequest;
import com.wugui.datax.rpc.remoting.net.params.XxlRpcResponse;
import com.wugui.datax.rpc.serialize.Serializer;
import com.wugui.datax.rpc.serialize.impl.HessianSerializer;
import com.wugui.datax.rpc.util.IpUtil;
import com.wugui.datax.rpc.util.NetUtil;
import com.wugui.datax.rpc.util.ThrowableUtil;
import com.wugui.datax.rpc.util.XxlRpcException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;

/**
 * 服务提供方工厂
 *
 * @author xuxueli 2015-10-31 22:54:27
 */
public class XxlRpcProviderFactory {
	private static final Logger logger = LoggerFactory.getLogger(XxlRpcProviderFactory.class);

	// 配置参数

	private Class<? extends Server> server = NettyServer.class;
	private Class<? extends Serializer> serializer = HessianSerializer.class;

	private int corePoolSize = 60;
	private int maxPoolSize = 300;

	private String ip = null;					// 服务注册配置
	private int port = 7080;					// 默认监听端口
	private String accessToken = null;

	private Class<? extends ServiceRegistry> serviceRegistry = null;
	private Map<String, String> serviceRegistryParam = null;

	// 设置配置
	public void setServer(Class<? extends Server> server) {
		this.server = server;
	}
	public void setSerializer(Class<? extends Serializer> serializer) {
		this.serializer = serializer;
	}
	public void setCorePoolSize(int corePoolSize) {
		this.corePoolSize = corePoolSize;
	}
	public void setMaxPoolSize(int maxPoolSize) {
		this.maxPoolSize = maxPoolSize;
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

	public void setServiceRegistry(Class<? extends ServiceRegistry> serviceRegistry) {
		this.serviceRegistry = serviceRegistry;
	}

	public void setServiceRegistryParam(Map<String, String> serviceRegistryParam) {
		this.serviceRegistryParam = serviceRegistryParam;
	}

	// 获取配置
	public Serializer getSerializerInstance() {
		return serializerInstance;
	}
	public int getPort() {
		return port;
	}
	public int getCorePoolSize() {
		return corePoolSize;
	}
	public int getMaxPoolSize() {
		return maxPoolSize;
	}

	// 启动与停止

	private Server serverInstance;
	private Serializer serializerInstance;
	private ServiceRegistry serviceRegistryInstance;
	private String serviceAddress;

	public void start() throws Exception {

		// 参数校验
		if (this.server == null) {
			throw new XxlRpcException("xxl-rpc provider server missing.");
		}
		if (this.serializer==null) {
			throw new XxlRpcException("xxl-rpc provider serializer missing.");
		}
		if (!(this.corePoolSize>0 && this.maxPoolSize>0 && this.maxPoolSize>=this.corePoolSize)) {
			this.corePoolSize = 60;
			this.maxPoolSize = 300;
		}
		if (this.ip == null) {
			this.ip = IpUtil.getIp();
		}
		if (this.port <= 0) {
			this.port = 7080;
		}
		if (NetUtil.isPortUsed(this.port)) {
			throw new XxlRpcException("xxl-rpc provider port["+ this.port +"] is used.");
		}

		// 初始化序列化器实例
		this.serializerInstance = serializer.newInstance();

		// 启动服务端
		serviceAddress = IpUtil.getIpPort(this.ip, port);
		serverInstance = server.newInstance();
		serverInstance.setStartedCallback(new BaseCallback() {		// 服务注册组件已启动
			@Override
			public void run() throws Exception {
				// 启动注册服务
				if (serviceRegistry != null) {
					serviceRegistryInstance = serviceRegistry.newInstance();
					serviceRegistryInstance.start(serviceRegistryParam);
					if (serviceData.size() > 0) {
						serviceRegistryInstance.registry(serviceData.keySet(), serviceAddress);
					}
				}
			}
		});
		serverInstance.setStopedCallback(new BaseCallback() {		// 服务注册组件已停止
			@Override
			public void run() {
				// 停止注册服务
				if (serviceRegistryInstance != null) {
					if (serviceData.size() > 0) {
						serviceRegistryInstance.remove(serviceData.keySet(), serviceAddress);
					}
					serviceRegistryInstance.stop();
					serviceRegistryInstance = null;
				}
			}
		});
		serverInstance.start(this);
	}

	public void  stop() throws Exception {
		// 停止服务端
		serverInstance.stop();
	}


	// 服务端调用

	/**
	 * 初始化本地 RPC 服务映射
	 */
	private Map<String, Object> serviceData = new HashMap<String, Object>();
	public Map<String, Object> getServiceData() {
		return serviceData;
	}

	/**
	 * 生成服务唯一键
	 *
	 * @param iface
	 * @param version
	 * @return
	 */
	public static String makeServiceKey(String iface, String version){
		String serviceKey = iface;
		if (version!=null && version.trim().length()>0) {
			serviceKey += "#".concat(version);
		}
		return serviceKey;
	}

	/**
	 * 注册服务实现
	 *
	 * @param iface
	 * @param version
	 * @param serviceBean
	 */
	public void addService(String iface, String version, Object serviceBean){
		String serviceKey = makeServiceKey(iface, version);
		serviceData.put(serviceKey, serviceBean);

		logger.info(">>>>>>>>>>> xxl-rpc, provider factory add service success. serviceKey = {}, serviceBean = {}", serviceKey, serviceBean.getClass());
	}

	/**
	 * 调用服务实现
	 *
	 * @param xxlRpcRequest
	 * @return
	 */
	public XxlRpcResponse invokeService(XxlRpcRequest xxlRpcRequest) {

		//  创建调用响应
		XxlRpcResponse xxlRpcResponse = new XxlRpcResponse();
		xxlRpcResponse.setRequestId(xxlRpcRequest.getRequestId());

		// 匹配服务实现对象
		String serviceKey = makeServiceKey(xxlRpcRequest.getClassName(), xxlRpcRequest.getVersion());
		Object serviceBean = serviceData.get(serviceKey);

		// 参数校验
		if (serviceBean == null) {
			xxlRpcResponse.setErrorMsg("The serviceKey["+ serviceKey +"] not found.");
			return xxlRpcResponse;
		}

		if (System.currentTimeMillis() - xxlRpcRequest.getCreateMillisTime() > 3*60*1000) {
			xxlRpcResponse.setErrorMsg("The timestamp difference between admin and executor exceeds the limit.");
			return xxlRpcResponse;
		}
		if (accessToken!=null && accessToken.trim().length()>0 && !accessToken.trim().equals(xxlRpcRequest.getAccessToken())) {
			xxlRpcResponse.setErrorMsg("The access token[" + xxlRpcRequest.getAccessToken() + "] is wrong.");
			return xxlRpcResponse;
		}

		try {
			// 执行调用
			Class<?> serviceClass = serviceBean.getClass();
			String methodName = xxlRpcRequest.getMethodName();
			Class<?>[] parameterTypes = xxlRpcRequest.getParameterTypes();
			Object[] parameters = xxlRpcRequest.getParameters();

            Method method = serviceClass.getMethod(methodName, parameterTypes);
            method.setAccessible(true);
			Object result = method.invoke(serviceBean, parameters);

			/*FastClass serviceFastClass = FastClass.create(serviceClass);
			FastMethod serviceFastMethod = serviceFastClass.getMethod(methodName, parameterTypes);
			Object result = serviceFastMethod.invoke(serviceBean, parameters);*/

			xxlRpcResponse.setResult(result);
		} catch (Throwable t) {
			// 捕获并处理异常
			logger.error("xxl-rpc provider invokeService error.", t);
			xxlRpcResponse.setErrorMsg(ThrowableUtil.toString(t));
		}

		return xxlRpcResponse;
	}

}
