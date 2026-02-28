package com.shadcn.admin.backend.modules.monitor.server.dto;

import java.time.LocalDateTime;

public record ServerMetricsDTO(
        CpuMetrics cpu,
        MemoryMetrics memory,
        DiskMetrics disk,
        SystemMetrics system,
        JvmMetrics jvm,
        LocalDateTime sampledAt) {

    public record CpuMetrics(double usage, int cores, String model, double speedGhz) {}

    public record MemoryMetrics(double totalGb, double usedGb, double freeGb, double usage) {}

    public record DiskMetrics(double totalGb, double usedGb, double freeGb, double usage, String path) {}

    public record SystemMetrics(String os, String hostname, String arch, String uptime) {}

    public record JvmMetrics(String version, String vendor, double heapUsedMb, double heapMaxMb, double heapUsage) {}
}
