package com.shadcn.admin.backend.modules.system.roles.dto;

import java.util.List;

public record RoleDTO(String id, String code, String name, String status, String dataScope, List<String> menuIds) {}
