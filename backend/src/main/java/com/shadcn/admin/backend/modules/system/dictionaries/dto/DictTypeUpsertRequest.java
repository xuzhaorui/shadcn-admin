package com.shadcn.admin.backend.modules.system.dictionaries.dto;

import jakarta.validation.constraints.NotBlank;

public class DictTypeUpsertRequest {
    @NotBlank
    private String code;
    @NotBlank
    private String name;
    @NotBlank
    private String status;

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
