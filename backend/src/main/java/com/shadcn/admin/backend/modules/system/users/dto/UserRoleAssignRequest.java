package com.shadcn.admin.backend.modules.system.users.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class UserRoleAssignRequest {
    @NotEmpty
    private List<String> roleIds;

    public List<String> getRoleIds() {
        return roleIds;
    }

    public void setRoleIds(List<String> roleIds) {
        this.roleIds = roleIds;
    }
}

