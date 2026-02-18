package com.shadcn.admin.backend.modules.system.dictionaries.dto;

import jakarta.validation.constraints.NotBlank;

public class DictItemUpsertRequest {
    @NotBlank
    private String typeId;
    @NotBlank
    private String label;
    @NotBlank
    private String value;
    private Integer sort = 0;
    @NotBlank
    private String status;

    public String getTypeId() { return typeId; }
    public void setTypeId(String typeId) { this.typeId = typeId; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
    public Integer getSort() { return sort; }
    public void setSort(Integer sort) { this.sort = sort; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
