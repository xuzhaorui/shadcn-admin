package com.shadcn.admin.backend.modules.monitor.online.dto;

import java.time.LocalDateTime;

public record OnlineUserDTO(
        String id,
        String username,
        String deptName,
        String ip,
        String location,
        String browser,
        String os,
        LocalDateTime loginTime) {}
