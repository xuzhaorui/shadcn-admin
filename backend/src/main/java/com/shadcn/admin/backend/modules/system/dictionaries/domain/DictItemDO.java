package com.shadcn.admin.backend.modules.system.dictionaries.domain;

public class DictItemDO {
    private String id;
    private String typeId;
    private String label;
    private String value;
    private Integer sort;
    private String status;
    private Long version;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
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
    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
}
