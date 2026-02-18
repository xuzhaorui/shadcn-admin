package com.shadcn.admin.backend.modules.system.roles.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class RoleUpsertRequest {
    @NotBlank
    private String code;
    @NotBlank
    private String name;
    @NotBlank
    private String status;
    @NotBlank
    private String dataScope;
    private List<String> menuIds;

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getDataScope() { return dataScope; }
    public void setDataScope(String dataScope) { this.dataScope = dataScope; }
    public List<String> getMenuIds() { return menuIds; }
    public void setMenuIds(List<String> menuIds) { this.menuIds = menuIds; }
}
