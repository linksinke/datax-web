package com.wugui.datax.admin.core.util;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * 本地缓存工具
 *
 * @author xuxueli 2018-01-22 21:37:34
 */
public class LocalCacheUtil {

    private static ConcurrentMap<String, LocalCacheData> cacheRepository = new ConcurrentHashMap<String, LocalCacheData>();   // 类型建议用抽象父类，兼容性更好；
    private static class LocalCacheData{
        private String key;
        private Object val;
        private long timeoutTime;

        public LocalCacheData() {
        }

        public LocalCacheData(String key, Object val, long timeoutTime) {
            this.key = key;
            this.val = val;
            this.timeoutTime = timeoutTime;
        }

        public String getKey() {
            return key;
        }

        public void setKey(String key) {
            this.key = key;
        }

        public Object getVal() {
            return val;
        }

        public void setVal(Object val) {
            this.val = val;
        }

        public long getTimeoutTime() {
            return timeoutTime;
        }

        public void setTimeoutTime(long timeoutTime) {
            this.timeoutTime = timeoutTime;
        }
    }


    /**
     * 写入缓存
     *
     * @param key
     * @param val
     * @param cacheTime
     * @return
     */
    public static boolean set(String key, Object val, long cacheTime){

        // 写入新缓存前清理过期项，避免缓存持续增长
        cleanTimeoutCache();

        // 写入新的缓存项
        if (key==null || key.trim().length()==0) {
            return false;
        }
        if (val == null) {
            remove(key);
        }
        if (cacheTime <= 0) {
            remove(key);
        }
        long timeoutTime = System.currentTimeMillis() + cacheTime;
        LocalCacheData localCacheData = new LocalCacheData(key, val, timeoutTime);
        cacheRepository.put(localCacheData.getKey(), localCacheData);
        return true;
    }

    /**
     * 移除缓存项
     *
     * @param key
     * @return
     */
    public static boolean remove(String key){
        if (key==null || key.trim().length()==0) {
            return false;
        }
        cacheRepository.remove(key);
        return true;
    }

    /**
     * 获取缓存项
     *
     * @param key
     * @return
     */
    public static Object get(String key){
        if (key==null || key.trim().length()==0) {
            return null;
        }
        LocalCacheData localCacheData = cacheRepository.get(key);
        if (localCacheData!=null && System.currentTimeMillis()<localCacheData.getTimeoutTime()) {
            return localCacheData.getVal();
        } else {
            remove(key);
            return null;
        }
    }

    /**
     * 清理过期缓存
     *
     * @return
     */
    public static boolean cleanTimeoutCache(){
        if (!cacheRepository.keySet().isEmpty()) {
            for (String key: cacheRepository.keySet()) {
                LocalCacheData localCacheData = cacheRepository.get(key);
                if (localCacheData!=null && System.currentTimeMillis()>=localCacheData.getTimeoutTime()) {
                    cacheRepository.remove(key);
                }
            }
        }
        return true;
    }

}
