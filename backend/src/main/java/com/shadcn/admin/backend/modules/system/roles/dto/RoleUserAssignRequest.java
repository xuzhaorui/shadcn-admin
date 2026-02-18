package com.shadcn.admin.backend.modules.system.roles.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class RoleUserAssignRequest {
    @NotEmpty
    private List<String> userIds;

    public List<String> getUserIds() { return userIds; }
    public void setUserIds(List<String> userIds) { this.userIds = userIds; }
}
