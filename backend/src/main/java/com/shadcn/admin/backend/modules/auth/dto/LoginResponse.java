package com.shadcn.admin.backend.modules.auth.dto;

import java.util.List;

public record LoginResponse(String accessToken, String tokenType, long expiresIn, String userId, String username,
                            List<String> permissions) {}
