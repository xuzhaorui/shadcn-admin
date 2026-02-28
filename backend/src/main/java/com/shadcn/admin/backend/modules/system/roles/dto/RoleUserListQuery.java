package com.shadcn.admin.backend.modules.system.roles.dto;

import java.util.List;

public class RoleUserListQuery {
    private int page = 1;
    private int pageSize = 20;
    private String keyword;
    private Boolean dataScopeRestricted = false;
    private Boolean dataScopeAllowSelf = false;
    private String dataScopeUserId;
    private List<String> dataScopeDeptIds;

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getPageSize() {
        return pageSize;
    }

    public void setPageSize(int pageSize) {
        this.pageSize = pageSize;
    }

    public String getKeyword() {
        return keyword;
    }

    public void setKeyword(String keyword) {
        this.keyword = keyword;
    }

    public Boolean getDataScopeRestricted() {
        return dataScopeRestricted;
    }

    public void setDataScopeRestricted(Boolean dataScopeRestricted) {
        this.dataScopeRestricted = dataScopeRestricted;
    }

    public Boolean getDataScopeAllowSelf() {
        return dataScopeAllowSelf;
    }

    public void setDataScopeAllowSelf(Boolean dataScopeAllowSelf) {
        this.dataScopeAllowSelf = dataScopeAllowSelf;
    }

    public String getDataScopeUserId() {
        return dataScopeUserId;
    }

    public void setDataScopeUserId(String dataScopeUserId) {
        this.dataScopeUserId = dataScopeUserId;
    }

    public List<String> getDataScopeDeptIds() {
        return dataScopeDeptIds;
    }

    public void setDataScopeDeptIds(List<String> dataScopeDeptIds) {
        this.dataScopeDeptIds = dataScopeDeptIds;
    }

    public int getOffset() {
        return (Math.max(page, 1) - 1) * Math.max(pageSize, 1);
    }
}
