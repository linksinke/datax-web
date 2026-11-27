package com.wugui.datax.rpc.util.json;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author xuxueli 2018-11-30
 */
public class BasicJson {


    private static final BasicJsonReader basicJsonReader = new BasicJsonReader();
    private static final BasicJsonwriter basicJsonwriter = new BasicJsonwriter();


    /**
     * 将对象转换为 JSON
     *
     * @param object
     * @return
     */
    public static String toJson(Object object) {
        return basicJsonwriter.toJson(object);
    }

    /**
     * 将 JSON 解析为映射
     *
     * @param json
     * @return 解析后的基础对象、列表或映射
     */
    public static Map<String, Object> parseMap(String json) {
        return basicJsonReader.parseMap(json);
    }

    /**
     * 将 JSON 解析为列表
     *
     * @param json
     * @return
     */
    public static List<Object> parseList(String json) {
        return basicJsonReader.parseList(json);
    }


    public static void main(String[] args) {
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "success");
        result.put("arr", Arrays.asList("111", "222"));
        result.put("float", 1.11f);
        result.put("temp", null);

        String json = toJson(result);
        System.out.println(json);

        Map<String, Object> mapObj = parseMap(json);
        System.out.println(mapObj);

        List<Object> listInt = parseList("[111,222,33]");
        System.out.println(listInt);

    }



    /*// 将映射转换为业务对象
    private static <T> T parseBizObjectFromMapObject(final Map<String, Object> mapObject, Class<T> businessClass){
        // 解析对象类型，仅处理第一层属性
        try {
            Object newItem = businessClass.newInstance();
            Field[] fieldList = basicJsonwriter.getDeclaredFields(businessClass);
            for (Field field: fieldList) {

                // 校验字段值
                Object fieldValue = mapObject.get(field.getName());
                if (fieldValue == null) {
                    continue;
                }

                // 校验属性类型
                if (field.getType() != fieldValue.getClass()) {

                    if (fieldValue instanceof LinkedHashMap) {

                        // 映射值仅支持业务对象或映射类型
                        if (field.getType() != Map.class) {
                            fieldValue = parseBizObjectFromMapObject((LinkedHashMap)fieldValue, field.getType());
                        }
                    } else if (fieldValue instanceof ArrayList) {

                        // 列表值仅支持基础类型列表或业务对象列表
                        List<Object> fieldValueList = (ArrayList)fieldValue;
                        if (fieldValueList.size() > 0) {

                            Class list_field_RealType = (Class<?>)((ParameterizedType) field.getGenericType()).getActualTypeArguments()[0];
                            if (FieldReflectionUtil.validBaseType(list_field_RealType)) {
                                // List<Base
                                if (list_field_RealType != fieldValueList.get(0).getClass()) {

                                    List<Object> list_newItemList = new ArrayList<>();
                                    for (Object list_oldItem: fieldValueList) {

                                        Object list_newItem = FieldReflectionUtil.parseValue(list_field_RealType, String.valueOf(list_oldItem));
                                        list_newItemList.add(list_newItem);
                                    }

                                }
                            } else {
                                // List<Class>
                                fieldValue = parseBizObjectListFromMapList((ArrayList)fieldValue, list_field_RealType);
                            }
                        }

                    } else {

                        // 基础值按基础类型转换
                        fieldValue = FieldReflectionUtil.parseValue(field.getType(), String.valueOf(fieldValue) );
                    }
                }

                // 设置对象字段
                field.setAccessible(true);
                field.set(newItem, fieldValue);
            }

            return (T) newItem;
        } catch (Exception e) {
            throw new IllegalArgumentException("Cannot parse JSON", e);
        }
    }

    // 将映射列表转换为业务对象列表
    public static <T> List<T> parseBizObjectListFromMapList(List<Object> listObject, Class<T> businessClass) {
        // 参数校验
        if (listObject.size() == 0) {
            return new ArrayList<>();
        }
        if (listObject.get(0).getClass() != LinkedHashMap.class) {
            throw new IllegalArgumentException("Cannot parse JSON, custom class must match LinkedHashMap");
        }
        // 解析业务对象类型
        try {
            List<Object> newItemList = new ArrayList<>();
            for (Object oldItem: listObject) {

                Map<String, Object> oldItemMap = (Map<String, Object>) oldItem;
                Object newItem = parseBizObjectFromMapObject(oldItemMap, businessClass);

                newItemList.add(newItem);
            }
            return (List<T>) newItemList;

        } catch (Exception e) {
            throw new IllegalArgumentException("Cannot parse JSON", e);
        }
    }


    *//**
     * 将 JSON 解析为指定类型
     *
     * @param json
     * @param businessClass 业务对象类型；基础类型、列表或映射可传空
     * @param <T>
     * @return
     *//*
    public static <T> T parseObject(String json, Class<T> businessClass) {

        // 映射对象
        Map<String, Object> mapObject = basicJsonReader.parseMap(json);

        if (businessClass == null || mapObject.size()==0) {
            // 默认解析为映射类型
            return (T) mapObject;
        } else {
            // 解析业务对象类型
            return parseBizObjectFromMapObject(mapObject, businessClass);
        }
    }

    *//**
     * 将 JSON 解析为指定类型的列表
     *
     * @param json
     * @param businessClass 业务对象类型；基础类型、列表或映射可传空
     * @param <T>
     * @return
     *//*
    public static <T> List<T> parseList(String json, Class<T> businessClass) {

        // 列表对象
        List<Object> listObject = basicJsonReader.parseList(json);

        if (businessClass==null || listObject.size()==0) {
            // 默认解析为映射类型
            return (List<T>) listObject;
        } else {
            return parseBizObjectListFromMapList(listObject, businessClass);
        }

    }*/


}
