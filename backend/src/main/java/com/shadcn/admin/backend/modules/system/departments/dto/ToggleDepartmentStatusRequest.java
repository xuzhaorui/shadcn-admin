package com.shadcn.admin.backend.modules.system.departments.dto;

import jakarta.validation.constraints.NotBlank;

public class ToggleDepartmentStatusRequest {
    @NotBlank
    private String status;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
