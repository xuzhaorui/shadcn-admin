package com.shadcn.admin.backend.modules.monitor.server.service;

import com.shadcn.admin.backend.common.cache.CacheNames;
import com.shadcn.admin.backend.common.cache.LocalCacheManager;
import com.shadcn.admin.backend.modules.monitor.server.dto.ServerMetricsDTO;
import com.sun.management.OperatingSystemMXBean;
import java.io.File;
import java.io.IOException;
import java.lang.management.ManagementFactory;
import java.lang.management.RuntimeMXBean;
import java.nio.file.Files;
import java.nio.file.Path;
import java.net.InetAddress;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class ServerMonitorService {
    private final LocalCacheManager localCacheManager;

    public ServerMonitorService(LocalCacheManager localCacheManager) {
        this.localCacheManager = localCacheManager;
    }

    public ServerMetricsDTO getMetrics() {
        return localCacheManager.getOrLoad(CacheNames.MONITOR_SERVER_METRICS, "latest", this::sampleMetrics);
    }

    private ServerMetricsDTO sampleMetrics() {
        Runtime runtime = Runtime.getRuntime();
        RuntimeMXBean runtimeMxBean = ManagementFactory.getRuntimeMXBean();
        java.lang.management.OperatingSystemMXBean osMxBean = ManagementFactory.getOperatingSystemMXBean();
        OperatingSystemMXBean extendedOsMxBean =
                osMxBean instanceof OperatingSystemMXBean bean ? bean : null;

        double cpuUsage = 0D;
        if (extendedOsMxBean != null) {
            double load = extendedOsMxBean.getSystemCpuLoad();
            cpuUsage = load >= 0 ? toPercentage(load) : 0D;
        }

        long totalMemoryBytes = extendedOsMxBean != null ? extendedOsMxBean.getTotalMemorySize() : 0L;
        long freeMemoryBytes = extendedOsMxBean != null ? extendedOsMxBean.getFreeMemorySize() : 0L;
        long usedMemoryBytes = Math.max(totalMemoryBytes - freeMemoryBytes, 0L);
        double memoryUsage = totalMemoryBytes > 0 ? toPercentage((double) usedMemoryBytes / totalMemoryBytes) : 0D;

        File storage = new File(System.getProperty("user.dir"));
        long totalDiskBytes = storage.getTotalSpace();
        long freeDiskBytes = storage.getUsableSpace();
        long usedDiskBytes = Math.max(totalDiskBytes - freeDiskBytes, 0L);
        double diskUsage = totalDiskBytes > 0 ? toPercentage((double) usedDiskBytes / totalDiskBytes) : 0D;

        long heapUsedBytes = runtime.totalMemory() - runtime.freeMemory();
        long heapMaxBytes = runtime.maxMemory();
        double heapUsage = heapMaxBytes > 0 ? toPercentage((double) heapUsedBytes / heapMaxBytes) : 0D;
        String cpuModel = resolveCpuModel(osMxBean);

        return new ServerMetricsDTO(
                new ServerMetricsDTO.CpuMetrics(
                        cpuUsage,
                        runtime.availableProcessors(),
                        cpuModel,
                        resolveCpuSpeedGhz(cpuModel)),
                new ServerMetricsDTO.MemoryMetrics(
                        bytesToGb(totalMemoryBytes),
                        bytesToGb(usedMemoryBytes),
                        bytesToGb(freeMemoryBytes),
                        memoryUsage),
                new ServerMetricsDTO.DiskMetrics(
                        bytesToGb(totalDiskBytes), bytesToGb(usedDiskBytes), bytesToGb(freeDiskBytes), diskUsage, storage.getAbsolutePath()),
                new ServerMetricsDTO.SystemMetrics(
                        osMxBean.getName() + " " + osMxBean.getVersion(), resolveHostName(), osMxBean.getArch(), formatUptime(runtimeMxBean.getUptime())),
                new ServerMetricsDTO.JvmMetrics(
                        System.getProperty("java.version"),
                        System.getProperty("java.vendor"),
                        bytesToMb(heapUsedBytes),
                        bytesToMb(heapMaxBytes),
                        heapUsage),
                LocalDateTime.now());
    }

    private String resolveHostName() {
        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (Exception ignored) {
            return "unknown";
        }
    }

    private String formatUptime(long uptimeMs) {
        long seconds = Math.max(uptimeMs / 1000, 0);
        long days = seconds / 86400;
        long hours = (seconds % 86400) / 3600;
        long minutes = (seconds % 3600) / 60;
        return String.format(Locale.ROOT, "%d天 %d小时 %d分钟", days, hours, minutes);
    }

    private String resolveCpuModel(java.lang.management.OperatingSystemMXBean osMxBean) {
        String fromEnv = System.getenv("PROCESSOR_IDENTIFIER");
        if (fromEnv != null && !fromEnv.isBlank()) {
            return fromEnv;
        }
        try {
            Optional<String> model;
            try (var lines = Files.lines(Path.of("/proc/cpuinfo"))) {
                model = lines.filter(line -> line.toLowerCase(Locale.ROOT).startsWith("model name"))
                        .findFirst()
                        .map(line -> {
                            int idx = line.indexOf(':');
                            return idx >= 0 ? line.substring(idx + 1).trim() : line.trim();
                        });
            }
            if (model.isPresent() && !model.get().isBlank()) {
                return model.get();
            }
        } catch (IOException ignored) {
            // /proc/cpuinfo is unavailable on non-Linux environments.
        }
        return osMxBean.getArch();
    }

    private double resolveCpuSpeedGhz(String cpuModel) {
        if (cpuModel == null || cpuModel.isBlank()) {
            return 0D;
        }
        String lower = cpuModel.toLowerCase(Locale.ROOT);
        int ghz = lower.indexOf("ghz");
        if (ghz <= 0) {
            return 0D;
        }
        int start = ghz - 1;
        while (start >= 0) {
            char c = lower.charAt(start);
            if (!Character.isDigit(c) && c != '.') {
                break;
            }
            start--;
        }
        String candidate = lower.substring(start + 1, ghz).trim();
        try {
            return round(Double.parseDouble(candidate));
        } catch (NumberFormatException ignored) {
            return 0D;
        }
    }

    private double bytesToGb(long bytes) {
        return round((double) bytes / (1024 * 1024 * 1024));
    }

    private double bytesToMb(long bytes) {
        return round((double) bytes / (1024 * 1024));
    }

    private double toPercentage(double ratio) {
        return round(ratio * 100);
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
