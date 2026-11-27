package com.wugui.datatx.core.log;

import com.wugui.datatx.core.biz.model.LogResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.text.SimpleDateFormat;
import java.util.Date;

/**
 * 按执行实例分别保存触发日志
 * @author xuxueli 2016-3-12 19:25:12
 */
public class JobFileAppender {
	private static Logger logger = LoggerFactory.getLogger(JobFileAppender.class);
	
	// 任务日志上下文支持处理器创建的子线程
	//public static ThreadLocal<String> contextHolder = new ThreadLocal<String>();
	public static final InheritableThreadLocal<String> contextHolder = new InheritableThreadLocal<>();


	/**
	 * 日志根目录
	 *
	 * 目录结构示例：
	 * 	---/
	 * 	---/gluesource/
	 * 	---/gluesource/10_1514171108000.js
	 * 	---/gluesource/10_1514171108000.js
	 * 	---/2017-12-25/
	 * 	---/2017-12-25/639.log
	 * 	---/2017-12-25/821.log
	 *
	 */
	private static String logBasePath = "/data/applogs/executor/jobhandler";
	private static String glueSrcPath = logBasePath.concat("/gluesource");
	public static void initLogPath(String logPath){
		// 初始化
		if (logPath!=null && logPath.trim().length()>0) {
			logBasePath = logPath;
		}
		// 创建日志根目录
		File logPathDir = new File(logBasePath);
		if (!logPathDir.exists()) {
			logPathDir.mkdirs();
		}
		logBasePath = logPathDir.getPath();

		// 创建脚本目录
		File glueBaseDir = new File(logPathDir, "gluesource");
		if (!glueBaseDir.exists()) {
			glueBaseDir.mkdirs();
		}
		glueSrcPath = glueBaseDir.getPath();
	}
	public static String getLogPath() {
		return logBasePath;
	}
	public static String getGlueSrcPath() {
		return glueSrcPath;
	}

	/**
	 * 日志文件路径示例：logPath/yyyy-MM-dd/9999.log
	 *
	 * @param triggerDate
	 * @param logId
	 * @return
	 */
	public static String makeLogFileName(Date triggerDate, long logId) {

		// filePath/yyyy-MM-dd
		SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");	// 使用局部日期格式化器避免并发访问问题
		File logFilePath = new File(getLogPath(), sdf.format(triggerDate));
		if (!logFilePath.exists()) {
			logFilePath.mkdir();
		}

		// filePath/yyyy-MM-dd/9999.log
		String logFileName = logFilePath.getPath()
				.concat(File.separator)
				.concat(String.valueOf(logId))
				.concat(".log");
		return logFileName;
	}

	/**
	 * 追加日志
	 *
	 * @param logFileName
	 * @param appendLog
	 */
	public static void appendLog(String logFileName, String appendLog) {

		// 日志文件
		if (logFileName==null || logFileName.trim().length()==0) {
			return;
		}
		File logFile = new File(logFileName);

		if (!logFile.exists()) {
			try {
				logFile.createNewFile();
			} catch (IOException e) {
				logger.error(e.getMessage(), e);
				return;
			}
		}

		// 执行日志
		if (appendLog == null) {
			appendLog = "";
		}
		appendLog += "\r\n";
		
		// 追加文件内容
		FileOutputStream fos = null;
		try {
			fos = new FileOutputStream(logFile, true);
			fos.write(appendLog.getBytes("utf-8"));
			fos.flush();
		} catch (Exception e) {
			logger.error(e.getMessage(), e);
		} finally {
			if (fos != null) {
				try {
					fos.close();
				} catch (IOException e) {
					logger.error(e.getMessage(), e);
				}
			}
		}
		
	}

	/**
	 * 支持分段读取日志文件
	 *
	 * @param logFileName
	 * @return 日志内容
	 */
	public static LogResult readLog(String logFileName, int fromLineNum){

		// 校验日志文件
		if (logFileName==null || logFileName.trim().length()==0) {
            return new LogResult(fromLineNum, 0, "readLog fail, logFile not found", true);
		}
		File logFile = new File(logFileName);

		if (!logFile.exists()) {
            return new LogResult(fromLineNum, 0, "readLog fail, logFile not exists", true);
		}

		// 读取文件
		StringBuffer logContentBuffer = new StringBuffer();
		int toLineNum = 0;
		LineNumberReader reader = null;
		try {
			//reader = new LineNumberReader(new FileReader(logFile));
			reader = new LineNumberReader(new InputStreamReader(new FileInputStream(logFile), "utf-8"));
			String line;

			while ((line = reader.readLine())!=null) {
				toLineNum = reader.getLineNumber();		// 读取区间为闭区间，行号从1开始
				if (toLineNum >= fromLineNum) {
					logContentBuffer.append(line).append("\n");
				}
			}
		} catch (IOException e) {
			logger.error(e.getMessage(), e);
		} finally {
			if (reader != null) {
				try {
					reader.close();
				} catch (IOException e) {
					logger.error(e.getMessage(), e);
				}
			}
		}

		// 返回结果
		LogResult logResult = new LogResult(fromLineNum, toLineNum, logContentBuffer.toString(), false);
		return logResult;

		/*
        // 返回实际跳过的字符数量
        reader.skip(Long.MAX_VALUE);
        int maxLineNum = reader.getLineNumber();
        maxLineNum++;	// 最大行号
        */
	}

	/**
	 * 读取日志内容
	 * @param logFile
	 * @return 指定行的日志内容
	 */
	public static String readLines(File logFile){
		BufferedReader reader = null;
		try {
			reader = new BufferedReader(new InputStreamReader(new FileInputStream(logFile), "utf-8"));
			if (reader != null) {
				StringBuilder sb = new StringBuilder();
				String line = null;
				while ((line = reader.readLine()) != null) {
					sb.append(line).append("\n");
				}
				return sb.toString();
			}
		} catch (IOException e) {
			logger.error(e.getMessage(), e);
		} finally {
			if (reader != null) {
				try {
					reader.close();
				} catch (IOException e) {
					logger.error(e.getMessage(), e);
				}
			}
		}
		return null;
	}

}
