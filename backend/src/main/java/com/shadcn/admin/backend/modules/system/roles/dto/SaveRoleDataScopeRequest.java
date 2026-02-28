package com.shadcn.admin.backend.modules.system.roles.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class SaveRoleDataScopeRequest {
    @NotBlank
    private String dataScope;
    @JsonAlias({"customDeptIds"})
    private List<String> deptIds;

    public String getDataScope() { return dataScope; }
    public void setDataScope(String dataScope) { this.dataScope = dataScope; }
    public List<String> getDeptIds() { return deptIds; }
    public void setDeptIds(List<String> deptIds) { this.deptIds = deptIds; }
}
