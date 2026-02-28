package com.shadcn.admin.backend.modules.monitor.jobs.dto;

import java.time.LocalDateTime;

public record JobDTO(
        String id,
        String name,
        String group,
        String invokeTarget,
        String cronExpression,
        String misfirePolicy,
        boolean concurrent,
        String status,
        String remark,
        LocalDateTime createdAt,
        LocalDateTime nextExecuteTime) {}
