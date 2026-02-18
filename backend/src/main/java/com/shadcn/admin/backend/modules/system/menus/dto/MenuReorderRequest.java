package com.shadcn.admin.backend.modules.system.menus.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class MenuReorderRequest {
    @NotBlank
    private String parentId;
    @NotEmpty
    private List<String> orderedIds;

    public String getParentId() { return parentId; }
    public void setParentId(String parentId) { this.parentId = parentId; }
    public List<String> getOrderedIds() { return orderedIds; }
    public void setOrderedIds(List<String> orderedIds) { this.orderedIds = orderedIds; }
}
