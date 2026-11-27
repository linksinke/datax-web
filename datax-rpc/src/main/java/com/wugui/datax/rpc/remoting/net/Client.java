package com.wugui.datax.rpc.remoting.net;

import com.wugui.datax.rpc.remoting.invoker.reference.XxlRpcReferenceBean;
import com.wugui.datax.rpc.remoting.net.params.XxlRpcRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * RPC 客户端接口
 * @author xuxueli 2015-11-24 22:18:10
 */
public abstract class Client {
	protected static final Logger logger = LoggerFactory.getLogger(Client.class);


	// 初始化

	protected volatile XxlRpcReferenceBean xxlRpcReferenceBean;

	public void init(XxlRpcReferenceBean xxlRpcReferenceBean) {
		this.xxlRpcReferenceBean = xxlRpcReferenceBean;
	}


    // 发送请求

	/**
	 * 异步发送请求，并关联请求编号与等待结果
	 *
	 * @param address
	 * @param xxlRpcRequest
	 * @return
	 * @throws Exception
	 */
	public abstract void asyncSend(String address, XxlRpcRequest xxlRpcRequest) throws Exception;

}
