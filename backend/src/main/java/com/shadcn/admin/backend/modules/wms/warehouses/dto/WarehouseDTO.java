package com.shadcn.admin.backend.modules.wms.warehouses.dto;

import java.time.LocalDateTime;

public record WarehouseDTO(
        String id, String name, String description, String status, LocalDateTime createdAt, LocalDateTime updatedAt) {}
