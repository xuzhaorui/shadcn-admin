package com.shadcn.admin.backend.modules.system.departments.dto;

import jakarta.validation.constraints.NotBlank;

public class DepartmentUpsertRequest {
    private String parentId;
    @NotBlank
    private String name;
    @NotBlank
    private String code;
    private Integer sort = 0;
    @NotBlank
    private String status;

    public String getParentId() { return parentId; }
    public void setParentId(String parentId) { this.parentId = parentId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public Integer getSort() { return sort; }
    public void setSort(Integer sort) { this.sort = sort; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
