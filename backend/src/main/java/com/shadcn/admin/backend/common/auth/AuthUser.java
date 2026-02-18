package com.shadcn.admin.backend.common.auth;

import java.util.List;

public record AuthUser(String userId, String username, List<String> permissions) {}
