package com.shadcn.admin.backend.modules.system.users.dto;

import java.util.List;

public class UserListQuery {
    private int page = 1;
    private int pageSize = 20;
    private String keyword;
    private String status;
    private String departmentId;
    private List<String> roleIds;

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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(String departmentId) {
        this.departmentId = departmentId;
    }

    public List<String> getRoleIds() {
        return roleIds;
    }

    public void setRoleIds(List<String> roleIds) {
        this.roleIds = roleIds;
    }

    public int getOffset() {
        int safePage = Math.max(page, 1);
        int safeSize = Math.max(pageSize, 1);
        return (safePage - 1) * safeSize;
    }
}
