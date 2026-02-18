package com.shadcn.admin.backend.modules.system.departments.dto;

import java.util.List;

public record DepartmentDTO(
        String id,
        String parentId,
        String name,
        String code,
        Integer sort,
        String status,
        List<DepartmentDTO> children) {}
