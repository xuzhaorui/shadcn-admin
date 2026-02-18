package com.shadcn.admin.backend.modules.system.users.dto;

import java.util.List;

public record UserDTO(
        String id,
        String username,
        String realName,
        String email,
        String phone,
        String departmentId,
        List<String> roleIds,
        String status) {}
