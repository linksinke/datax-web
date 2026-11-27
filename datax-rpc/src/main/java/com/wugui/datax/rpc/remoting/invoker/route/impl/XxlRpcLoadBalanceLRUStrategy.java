package com.wugui.datax.rpc.remoting.invoker.route.impl;

import com.wugui.datax.rpc.remoting.invoker.route.XxlRpcLoadBalance;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * 最近最少使用策略
 *
 * @author xuxueli 2018-12-04
 */
public class XxlRpcLoadBalanceLRUStrategy extends XxlRpcLoadBalance {

    private ConcurrentMap<String, LinkedHashMap<String, String>> jobLRUMap = new ConcurrentHashMap<String, LinkedHashMap<String, String>>();
    private long CACHE_VALID_TIME = 0;

    public String doRoute(String serviceKey, TreeSet<String> addressSet) {

        // 清空缓存
        if (System.currentTimeMillis() > CACHE_VALID_TIME) {
            jobLRUMap.clear();
            CACHE_VALID_TIME = System.currentTimeMillis() + 1000*60*60*24;
        }

        // 初始化最近最少使用缓存
        LinkedHashMap<String, String> lruItem = jobLRUMap.get(serviceKey);
        if (lruItem == null) {
            /**
             * 使用有序映射维护访问顺序
             *      a、accessOrder：ture=访问顺序排序（get/put时排序）/ACCESS-LAST；false=插入顺序排期/FIFO；
             *      b、removeEldestEntry：新增元素时将会调用，返回true时会删除最老元素；可封装LinkedHashMap并重写该方法，比如定义最大容量，超出是返回true即可实现固定长度的LRU算法；
             */
            lruItem = new LinkedHashMap<String, String>(16, 0.75f, true){
                @Override
                protected boolean removeEldestEntry(Map.Entry<String, String> eldest) {
                    if(super.size() > 1000){
                        return true;
                    }else{
                        return false;
                    }
                }
            };
            jobLRUMap.putIfAbsent(serviceKey, lruItem);
        }

        // 写入新记录
        for (String address: addressSet) {
            if (!lruItem.containsKey(address)) {
                lruItem.put(address, address);
            }
        }
        // 移除旧记录
        List<String> delKeys = new ArrayList<>();
        for (String existKey: lruItem.keySet()) {
            if (!addressSet.contains(existKey)) {
                delKeys.add(existKey);
            }
        }
        if (delKeys.size() > 0) {
            for (String delKey: delKeys) {
                lruItem.remove(delKey);
            }
        }

        // 加载记录
        String eldestKey = lruItem.entrySet().iterator().next().getKey();
        String eldestValue = lruItem.get(eldestKey);
        return eldestValue;
    }

    @Override
    public String route(String serviceKey, TreeSet<String> addressSet) {
        String finalAddress = doRoute(serviceKey, addressSet);
        return finalAddress;
    }

}
