package com.shadcn.admin.backend.modules.system.roles.domain;

public class RoleDO {
    private String id;
    private String code;
    private String name;
    private String status;
    private String dataScope;
    private Long version;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getDataScope() { return dataScope; }
    public void setDataScope(String dataScope) { this.dataScope = dataScope; }
    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
}
