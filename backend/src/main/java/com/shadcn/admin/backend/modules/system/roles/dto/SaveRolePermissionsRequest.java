package com.shadcn.admin.backend.modules.system.roles.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class SaveRolePermissionsRequest {
    @JsonAlias({"permissionNodeIds"})
    @NotEmpty
    private List<String> menuIds;

    public List<String> getMenuIds() { return menuIds; }
    public void setMenuIds(List<String> menuIds) { this.menuIds = menuIds; }
}
