package com.wugui.datax.executor.service.jobhandler;

import com.wugui.datatx.core.biz.model.HandleProcessCallbackParam;
import com.wugui.datatx.core.biz.model.ReturnT;
import com.wugui.datatx.core.biz.model.TriggerParam;
import com.wugui.datatx.core.handler.IJobHandler;
import com.wugui.datatx.core.handler.annotation.JobHandler;
import com.wugui.datatx.core.log.JobLogger;
import com.wugui.datatx.core.thread.ProcessCallbackThread;
import com.wugui.datatx.core.util.ProcessUtil;
import com.wugui.datax.executor.service.logparse.LogStatistics;
import com.wugui.datax.executor.util.SystemUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.FutureTask;

import static com.wugui.datax.executor.service.command.BuildCommand.buildDataXExecutorCmd;
import static com.wugui.datax.executor.service.jobhandler.DataXConstant.DEFAULT_JSON;
import static com.wugui.datax.executor.service.logparse.AnalysisStatistics.analysisStatisticsLog;

/**
 * DataX任务运行
 *
 * @author jingwk 2019-11-16
 */

@JobHandler(value = "executorJobHandler")
@Component
public class ExecutorJobHandler extends IJobHandler {

    @Value("${datax.executor.jsonpath}")
    private String jsonPath;

    @Value("${datax.pypath}")
    private String dataXPyPath;


    @Override
    public ReturnT<String> execute(TriggerParam trigger) {

        int exitValue = -1;
        Thread errThread = null;
        String tmpFilePath;
        LogStatistics logStatistics = null;
        // Do not launch DataX unless the job configuration was successfully written and closed.
        try {
            tmpFilePath = generateTemJsonFile(trigger.getJobJson(), SystemUtils.getDataXHomePath());
        } catch (IOException | InvalidPathException e) {
            JobLogger.log("JSON 临时文件写入失败：{}", e.getMessage());
            JobLogger.log(e);
            return new ReturnT<>(IJobHandler.FAIL.getCode(), "JSON 临时文件写入失败：" + e.getMessage());
        }

        try {
            String[] cmdarrayFinal = buildDataXExecutorCmd(trigger, tmpFilePath,dataXPyPath);
            final Process process = Runtime.getRuntime().exec(cmdarrayFinal);
            String prcsId = ProcessUtil.getProcessId(process);
            JobLogger.log("------------------DataX process id: " + prcsId);
            jobTmpFiles.put(prcsId, tmpFilePath);
            //update datax process id
            HandleProcessCallbackParam prcs = new HandleProcessCallbackParam(trigger.getLogId(), trigger.getLogDateTime(), prcsId);
            ProcessCallbackThread.pushCallBack(prcs);
            // log-thread
            Thread futureThread = null;
            FutureTask<LogStatistics> futureTask = new FutureTask<>(() -> analysisStatisticsLog(new BufferedInputStream(process.getInputStream())));
            futureThread = new Thread(futureTask);
            futureThread.start();

            errThread = new Thread(() -> {
                try {
                    analysisStatisticsLog(new BufferedInputStream(process.getErrorStream()));
                } catch (IOException e) {
                    JobLogger.log(e);
                }
            });

            logStatistics = futureTask.get();
            errThread.start();
            // process-wait
            exitValue = process.waitFor();      // exit code: 0=success, 1=error
            // log-thread join
            errThread.join();
        } catch (Exception e) {
            JobLogger.log(e);
        } finally {
            if (errThread != null && errThread.isAlive()) {
                errThread.interrupt();
            }
            //  删除临时文件
            try {
                Files.deleteIfExists(Paths.get(tmpFilePath));
            } catch (IOException e) {
                JobLogger.log("JSON 临时文件清理失败：{}", tmpFilePath);
                JobLogger.log(e);
            }
        }
        if (exitValue == 0) {
            return new ReturnT<>(200, logStatistics.toString());
        } else {
            return new ReturnT<>(IJobHandler.FAIL.getCode(), "command exit value(" + exitValue + ") is failed");
        }
    }



    String generateTemJsonFile(String jobJson, String dataXHomePath) throws IOException {
        if (StringUtils.isBlank(jobJson)) {
            throw new IOException("任务 JSON 不能为空");
        }
        Path directory;
        if (StringUtils.isNotBlank(dataXHomePath)) {
            directory = Paths.get(dataXHomePath, DEFAULT_JSON);
        } else {
            if (StringUtils.isBlank(jsonPath)) {
                throw new IOException("未配置 JSON 临时文件目录 datax.executor.jsonpath");
            }
            directory = Paths.get(jsonPath);
        }
        // Resolve once against the executor working directory for both mkdir and file writing.
        directory = directory.toAbsolutePath().normalize();
        Files.createDirectories(directory);
        Path temporaryFile = Files.createTempFile(directory, "jobTmp-", ".conf");
        try {
            Files.write(temporaryFile, jobJson.getBytes(StandardCharsets.UTF_8));
        } catch (IOException e) {
            try {
                Files.deleteIfExists(temporaryFile);
            } catch (IOException cleanupException) {
                e.addSuppressed(cleanupException);
            }
            throw e;
        }
        return temporaryFile.toString();
    }

}
