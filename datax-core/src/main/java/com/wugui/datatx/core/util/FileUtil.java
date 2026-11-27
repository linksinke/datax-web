package com.wugui.datatx.core.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;

/**
 * 文件操作工具
 *
 * @author xuxueli 2017-12-29 17:56:48
 */
public class FileUtil {
    private static Logger logger = LoggerFactory.getLogger(FileUtil.class);


    /**
     * 递归删除目录或文件
     *
     * @param root
     * @return
     */
    public static boolean deleteRecursively(File root) {
        if (root != null && root.exists()) {
            if (root.isDirectory()) {
                File[] children = root.listFiles();
                if (children != null) {
                    for (File child : children) {
                        deleteRecursively(child);
                    }
                }
            }
            return root.delete();
        }
        return false;
    }


    public static void deleteFile(String fileName) {
        // 文件操作
        File file = new File(fileName);
        if (file.exists()) {
            file.delete();
        }
    }


    public static void writeFileContent(File file, byte[] data) {

        // 文件操作
        if (!file.exists()) {
            file.getParentFile().mkdirs();
        }

        // 追加文件内容
        FileOutputStream fos = null;
        try {
            fos = new FileOutputStream(file);
            fos.write(data);
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

    public static byte[] readFileContent(File file) {
        Long filelength = file.length();
        byte[] filecontent = new byte[filelength.intValue()];

        FileInputStream in = null;
        try {
            in = new FileInputStream(file);
            in.read(filecontent);
            in.close();
        } catch (Exception e) {
            logger.error(e.getMessage(), e);
        } finally {
            if (in != null) {
                try {
                    in.close();
                } catch (IOException e) {
                    logger.error(e.getMessage(), e);
                }
            }
        }
        return filecontent;
    }


    /*public static void appendFileLine(String fileName, String content) {

        // 文件操作
        File file = new File(fileName);
        if (!file.exists()) {
            try {
                file.createNewFile();
            } catch (IOException e) {
                logger.error(e.getMessage(), e);
                return;
            }
        }

        // 文件内容
        if (content == null) {
            content = "";
        }
        content += "\r\n";

        // 追加文件内容
        FileOutputStream fos = null;
        try {
            fos = new FileOutputStream(file, true);
            fos.write(content.getBytes("utf-8"));
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

    public static List<String> loadFileLines(String fileName){

        List<String> result = new ArrayList<>();

        // 校验日志文件
        File file = new File(fileName);
        if (!file.exists()) {
            return result;
        }

        // 读取文件
        StringBuffer logContentBuffer = new StringBuffer();
        int toLineNum = 0;
        LineNumberReader reader = null;
        try {
            //reader = new LineNumberReader(new FileReader(logFile));
            reader = new LineNumberReader(new InputStreamReader(new FileInputStream(file), "utf-8"));
            String line = null;
            while ((line = reader.readLine())!=null) {
                if (line!=null && line.trim().length()>0) {
                    result.add(line);
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

        return result;
    }*/

}
