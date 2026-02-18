package com.shadcn.admin.backend.modules.system.menus.dto;

import java.util.List;

public record MenuDTO(
        String id,
        String parentId,
        String type,
        String name,
        String code,
        String path,
        String icon,
        Integer sort,
        String visible,
        String status,
        List<MenuDTO> children) {}
