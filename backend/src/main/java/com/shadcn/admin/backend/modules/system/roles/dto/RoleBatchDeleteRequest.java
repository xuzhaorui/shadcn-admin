package com.shadcn.admin.backend.modules.system.roles.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class RoleBatchDeleteRequest {
    @NotEmpty
    private List<String> ids;

    public List<String> getIds() {
        return ids;
    }

    public void setIds(List<String> ids) {
        this.ids = ids;
    }
}
