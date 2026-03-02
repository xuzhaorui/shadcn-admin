package com.shadcn.admin.backend.modules.wms.warehouses.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class WarehouseUpsertRequest {
    @NotBlank
    @Size(max = 64)
    private String name;

    @Size(max = 255)
    private String description;

    @NotBlank
    @Size(max = 16)
    private String status;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
