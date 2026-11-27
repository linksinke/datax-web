package com.wugui.datax.rpc.remoting.invoker.route.impl;

import com.wugui.datax.rpc.remoting.invoker.route.XxlRpcLoadBalance;

import java.util.Random;
import java.util.TreeSet;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * 轮询选择
 *
 * @author xuxueli 2018-12-04
 */
public class XxlRpcLoadBalanceRoundStrategy extends XxlRpcLoadBalance {

    private ConcurrentMap<String, Integer> routeCountEachJob = new ConcurrentHashMap<String, Integer>();
    private long CACHE_VALID_TIME = 0;
    private int count(String serviceKey) {
        // 清空缓存
        if (System.currentTimeMillis() > CACHE_VALID_TIME) {
            routeCountEachJob.clear();
            CACHE_VALID_TIME = System.currentTimeMillis() + 24*60*60*1000;
        }

        // 递增轮询计数
        Integer count = routeCountEachJob.get(serviceKey);
        count = (count==null || count>1000000)?(new Random().nextInt(100)):++count;  // 初始化时主动Random一次，缓解首次压力
        routeCountEachJob.put(serviceKey, count);
        return count;
    }

    @Override
    public String route(String serviceKey, TreeSet<String> addressSet) {
        // 候选地址数组
        String[] addressArr = addressSet.toArray(new String[addressSet.size()]);

        // 轮询选择
        String finalAddress = addressArr[count(serviceKey)%addressArr.length];
        return finalAddress;
    }

}
