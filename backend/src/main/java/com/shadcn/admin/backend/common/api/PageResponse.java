package com.shadcn.admin.backend.common.api;

import java.util.List;

public record PageResponse<T>(List<T> list, long total, int page, int pageSize) {}
