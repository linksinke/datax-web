package com.wugui.datatx.core.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import oshi.SystemInfo;
import oshi.hardware.CentralProcessor;
import oshi.hardware.GlobalMemory;
import oshi.hardware.HardwareAbstractionLayer;

import java.math.RoundingMode;
import java.text.DecimalFormat;


/**
 * 操作系统资源工具
 */
public class OSUtils {

    private static final Logger logger = LoggerFactory.getLogger(OSUtils.class);

    private static final SystemInfo SI = new SystemInfo();
    public static final String TWO_DECIMAL = "0.00";

    private static HardwareAbstractionLayer hal = SI.getHardware();

    private OSUtils() {
    }


    /**
     * 获取内存使用率
     * 保留两位小数
     *
     * @return percent %
     */
    public static double memoryUsage() {
        GlobalMemory memory = hal.getMemory();
        double memoryUsage = (memory.getTotal() - memory.getAvailable()) * 1.0 / memory.getTotal();
        DecimalFormat df = new DecimalFormat(TWO_DECIMAL);
        df.setRoundingMode(RoundingMode.HALF_UP);
        return Double.parseDouble(df.format(memoryUsage * 100));
    }


    /**
     * 获取可用物理内存大小
     * <p>
     * 保留两位小数
     *
     * @return 可用物理内存，单位GB
     */
    public static double availablePhysicalMemorySize() {
        GlobalMemory memory = hal.getMemory();
        double availablePhysicalMemorySize = (memory.getAvailable() + memory.getSwapUsed()) / 1024.0 / 1024 / 1024;

        DecimalFormat df = new DecimalFormat(TWO_DECIMAL);
        df.setRoundingMode(RoundingMode.HALF_UP);
        return Double.parseDouble(df.format(availablePhysicalMemorySize));

    }

    /**
     * 获取物理内存总量
     * <p>
     * 保留两位小数
     *
     * @return 可用物理内存，单位GB
     */
    public static double totalMemorySize() {
        GlobalMemory memory = hal.getMemory();
        double availablePhysicalMemorySize = memory.getTotal() / 1024.0 / 1024 / 1024;

        DecimalFormat df = new DecimalFormat(TWO_DECIMAL);
        df.setRoundingMode(RoundingMode.HALF_UP);
        return Double.parseDouble(df.format(availablePhysicalMemorySize));
    }


    /**
     * 获取系统平均负载
     *
     * @return 系统平均负载
     */
    public static double loadAverage() {
        double loadAverage = hal.getProcessor().getSystemLoadAverage();

        DecimalFormat df = new DecimalFormat(TWO_DECIMAL);

        df.setRoundingMode(RoundingMode.HALF_UP);
        return Double.parseDouble(df.format(loadAverage));
    }

    /**
     * 获取处理器使用率
     *
     * @return 处理器使用率
     */
    public static double cpuUsage() {
        CentralProcessor processor = hal.getProcessor();
        double cpuUsage = processor.getSystemCpuLoad();

        DecimalFormat df = new DecimalFormat(TWO_DECIMAL);
        df.setRoundingMode(RoundingMode.HALF_UP);

        return Double.parseDouble(df.format(cpuUsage*100));
    }


    /**
     * 检查内存与处理器使用情况
     *
     * @return 内存与处理器是否超出使用阈值
     */
    public static Boolean checkResource(double systemCpuLoad, double systemReservedMemory) {
        // 判断资源使用率是否超限
        double loadAverage = OSUtils.loadAverage();
        //
        double availablePhysicalMemorySize = OSUtils.availablePhysicalMemorySize();

        if (loadAverage > systemCpuLoad || availablePhysicalMemorySize < systemReservedMemory) {
            logger.warn("load or availablePhysicalMemorySize(G) is too high, it's availablePhysicalMemorySize(G):{},loadAvg:{}", availablePhysicalMemorySize, loadAverage);
            return false;
        } else {
            return true;
        }
    }

}
