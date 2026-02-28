package com.shadcn.admin.backend.modules.monitor.online.dto;

import jakarta.validation.constraints.NotBlank;

public class ForceLogoutRequest {
    @NotBlank
    private String sessionId;

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
}
