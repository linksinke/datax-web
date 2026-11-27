package com.wugui.datatx.core.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * 日期处理工具
 *
 * @author xuxueli 2018-08-19 01:24:11
 */
public class DateUtil {

    // 日期格式化与解析
    private static Logger logger = LoggerFactory.getLogger(DateUtil.class);

    private static final String DATE_FORMAT = "yyyy-MM-dd";
    private static final String DATETIME_FORMAT = "yyyy-MM-dd HH:mm:ss";

    private static final ThreadLocal<Map<String, DateFormat>> dateFormatThreadLocal = new ThreadLocal<Map<String, DateFormat>>();
    private static DateFormat getDateFormat(String pattern) {
        if (pattern==null || pattern.trim().length()==0) {
            throw new IllegalArgumentException("pattern cannot be empty.");
        }

        Map<String, DateFormat> dateFormatMap = dateFormatThreadLocal.get();
        if(dateFormatMap!=null && dateFormatMap.containsKey(pattern)){
            return dateFormatMap.get(pattern);
        }

        synchronized (dateFormatThreadLocal) {
            if (dateFormatMap == null) {
                dateFormatMap = new HashMap<>();
            }
            dateFormatMap.put(pattern, new SimpleDateFormat(pattern));
            dateFormatThreadLocal.set(dateFormatMap);
        }

        return dateFormatMap.get(pattern);
    }

    /**
     * 格式化日期，例如 yyyy-MM-dd
     *
     * @param date
     * @return
     * @throws ParseException
     */
    public static String formatDate(Date date) {
        return format(date, DATE_FORMAT);
    }

    /**
     * 格式化日期时间，例如 yyyy-MM-dd HH:mm:ss
     *
     * @param date
     * @return
     * @throws ParseException
     */
    public static String formatDateTime(Date date) {
        return format(date, DATETIME_FORMAT);
    }

    /**
     * 格式化日期
     *
     * @param date
     * @param patten
     * @return
     * @throws ParseException
     */
    public static String format(Date date, String patten) {
        return getDateFormat(patten).format(date);
    }

    /**
     * 解析日期时间字符串
     *
     * @param dateString
     * @return
     * @throws ParseException
     */
    public static Date parseDate(String dateString){
        return parse(dateString, DATE_FORMAT);
    }

    /**
     * 解析日期时间，例如 yyyy-MM-dd HH:mm:ss
     *
     * @param dateString
     * @return
     * @throws ParseException
     */
    public static Date parseDateTime(String dateString) {
        return parse(dateString, DATETIME_FORMAT);
    }

    /**
     * 解析日期
     *
     * @param dateString
     * @param pattern
     * @return
     * @throws ParseException
     */
    public static Date parse(String dateString, String pattern) {
        try {
            Date date = getDateFormat(pattern).parse(dateString);
            return date;
        } catch (Exception e) {
            logger.warn("parse date error, dateString = {}, pattern={}; errorMsg = {}", dateString, pattern, e.getMessage());
            return null;
        }
    }


    // 日期偏移计算

    public static Date addYears(final Date date, final int amount) {
        return add(date, Calendar.YEAR, amount);
    }

    public static Date addMonths(final Date date, final int amount) {
        return add(date, Calendar.MONTH, amount);
    }

    public static Date addDays(final Date date, final int amount) {
        return add(date, Calendar.DAY_OF_MONTH, amount);
    }

    private static Date add(final Date date, final int calendarField, final int amount) {
        if (date == null) {
            return null;
        }
        final Calendar c = Calendar.getInstance();
        c.setTime(date);
        c.add(calendarField, amount);
        return c.getTime();
    }

}