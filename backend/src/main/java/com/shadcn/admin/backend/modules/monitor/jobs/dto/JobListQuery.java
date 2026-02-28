package com.shadcn.admin.backend.modules.monitor.jobs.dto;

public class JobListQuery {
    private int page = 1;
    private int pageSize = 20;
    private String keyword;
    private String status;

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

    public int getOffset() {
        return (Math.max(page, 1) - 1) * Math.max(pageSize, 1);
    }
}
