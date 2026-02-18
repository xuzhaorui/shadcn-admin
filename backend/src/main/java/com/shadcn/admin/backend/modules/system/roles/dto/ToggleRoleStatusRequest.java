package com.shadcn.admin.backend.modules.system.roles.dto;

import jakarta.validation.constraints.NotBlank;

public class ToggleRoleStatusRequest {
    @NotBlank
    private String status;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
