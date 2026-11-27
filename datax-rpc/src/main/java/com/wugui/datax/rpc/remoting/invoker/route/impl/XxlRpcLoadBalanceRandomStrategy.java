package com.wugui.datax.rpc.remoting.invoker.route.impl;

import com.wugui.datax.rpc.remoting.invoker.route.XxlRpcLoadBalance;

import java.util.Random;
import java.util.TreeSet;

/**
 * 随机选择
 *
 * @author xuxueli 2018-12-04
 */
public class XxlRpcLoadBalanceRandomStrategy extends XxlRpcLoadBalance {

    private Random random = new Random();

    @Override
    public String route(String serviceKey, TreeSet<String> addressSet) {
        // 候选地址数组
        String[] addressArr = addressSet.toArray(new String[addressSet.size()]);

        // 随机选择
        String finalAddress = addressArr[random.nextInt(addressSet.size())];
        return finalAddress;
    }

}
