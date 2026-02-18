package com.shadcn.admin.backend.modules.system.menus.dto;

import jakarta.validation.constraints.NotBlank;

public class MenuUpsertRequest {
    private String parentId;
    @NotBlank
    private String type;
    @NotBlank
    private String name;
    @NotBlank
    private String code;
    private String path;
    private String icon;
    private Integer sort = 0;
    @NotBlank
    private String visible;
    @NotBlank
    private String status;

    public String getParentId() { return parentId; }
    public void setParentId(String parentId) { this.parentId = parentId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public Integer getSort() { return sort; }
    public void setSort(Integer sort) { this.sort = sort; }
    public String getVisible() { return visible; }
    public void setVisible(String visible) { this.visible = visible; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
