package com.shadcn.admin.backend.modules.system.dictionaries.dto;

public class DictTypeListQuery {
    private int page = 1;
    private int pageSize = 20;
    private String keyword;

    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }
    public int getPageSize() { return pageSize; }
    public void setPageSize(int pageSize) { this.pageSize = pageSize; }
    public String getKeyword() { return keyword; }
    public void setKeyword(String keyword) { this.keyword = keyword; }
    public int getOffset() { return (Math.max(page, 1) - 1) * Math.max(pageSize, 1); }
}
