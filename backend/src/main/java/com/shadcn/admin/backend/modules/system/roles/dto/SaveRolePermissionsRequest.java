package com.shadcn.admin.backend.modules.system.roles.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class SaveRolePermissionsRequest {
    @NotEmpty
    private List<String> menuIds;

    public List<String> getMenuIds() { return menuIds; }
    public void setMenuIds(List<String> menuIds) { this.menuIds = menuIds; }
}
