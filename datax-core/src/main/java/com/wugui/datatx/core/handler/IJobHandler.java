package com.wugui.datatx.core.handler;

import com.wugui.datatx.core.biz.model.ReturnT;
import com.wugui.datatx.core.biz.model.TriggerParam;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * 任务处理器
 *
 * @author xuxueli 2015-12-19 19:06:38
 */
public abstract class IJobHandler {


	/** 执行成功 */
	public static final ReturnT<String> SUCCESS = new ReturnT<>(200, null);
	/** 执行失败 */
	public static final ReturnT<String> FAIL = new ReturnT<>(500, null);
	/** 执行超时 */
	public static final ReturnT<String> FAIL_TIMEOUT = new ReturnT<>(502, null);

	public static final ConcurrentMap<String, String> jobTmpFiles = new ConcurrentHashMap<>();
	/**
	 * 执行器收到调度请求时调用任务处理器
	 *
	 * @param tgParam
	 * @return
	 * @throws Exception
	 */
	public abstract ReturnT<String> execute(TriggerParam tgParam) throws Exception;

	/**
	 * 任务线程初始化时调用处理器初始化方法
	 */
	public void init() {
		// 预留扩展处理
	}


	/**
	 * 任务线程销毁时释放处理器资源
	 */
	public void destroy() {
		// 预留扩展处理
	}


}
