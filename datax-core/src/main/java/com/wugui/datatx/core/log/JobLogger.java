package com.wugui.datatx.core.log;

import com.wugui.datatx.core.util.DateUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.helpers.FormattingTuple;
import org.slf4j.helpers.MessageFormatter;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Date;

/**
 * 创建者：xuxueli，时间：17/4/28.
 */
public class JobLogger {
    private static Logger logger = LoggerFactory.getLogger("datax-web logger");



    /**
     * 追加日志
     *
     * @param call
     * @param appendLog
     */
    private static void logDetail(StackTraceElement call, String appendLog) {

        // "yyyy-MM-dd HH:mm:ss [fileName.MethodName-LineNumber] log";
        StringBuffer buffer = new StringBuffer();
        buffer.append(DateUtil.formatDateTime(new Date())).append(" ")
                .append("[" + call.getFileName().replace("java", "") + call.getMethodName())
                .append("-" + call.getLineNumber() + "]").append(" ")
                .append(appendLog != null ? appendLog : "");
        String formatAppendLog = buffer.toString();

        String logFileName = JobFileAppender.contextHolder.get();
        if (logFileName != null && logFileName.trim().length() > 0) {
            JobFileAppender.appendLog(logFileName, formatAppendLog);
        } else {
            logger.info(">>> {}", formatAppendLog);
        }
    }

    /**
     * 按占位符格式追加日志
     *
     * @param appendLogPattern 日志格式，例如 aaa {} bbb {} ccc
     * @param appendLogArguments 填充到占位符的参数，例如 111、true
     */
    public static void log(String appendLogPattern, Object... appendLogArguments) {

        FormattingTuple ft = MessageFormatter.arrayFormat(appendLogPattern, appendLogArguments);
        String appendLog = ft.getMessage();

        /*appendLog = appendLogPattern;
        if (appendLogArguments!=null && appendLogArguments.length>0) {
            appendLog = MessageFormat.format(appendLogPattern, appendLogArguments);
        }*/

        StackTraceElement callInfo = new Throwable().getStackTrace()[1];
        logDetail(callInfo, appendLog);
    }

    /**
     * 追加异常堆栈
     *
     * @param e
     */
    public static void log(Throwable e) {

        StringWriter stringWriter = new StringWriter();
        e.printStackTrace(new PrintWriter(stringWriter));
        String appendLog = stringWriter.toString();

        StackTraceElement callInfo = new Throwable().getStackTrace()[1];
        logDetail(callInfo, appendLog);
    }

}
