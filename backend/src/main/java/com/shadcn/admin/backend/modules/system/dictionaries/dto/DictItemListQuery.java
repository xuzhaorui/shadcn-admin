package com.shadcn.admin.backend.modules.system.dictionaries.dto;

public class DictItemListQuery {
    private int page = 1;
    private int pageSize = 20;
    private String typeId;

    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }
    public int getPageSize() { return pageSize; }
    public void setPageSize(int pageSize) { this.pageSize = pageSize; }
    public String getTypeId() { return typeId; }
    public void setTypeId(String typeId) { this.typeId = typeId; }
    public int getOffset() { return (Math.max(page, 1) - 1) * Math.max(pageSize, 1); }
}
