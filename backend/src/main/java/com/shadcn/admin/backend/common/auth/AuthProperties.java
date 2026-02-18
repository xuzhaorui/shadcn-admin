package com.shadcn.admin.backend.common.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.auth")
public class AuthProperties {
    private String jwtSecret;
    private long tokenExpireSeconds = 7200;

    public String getJwtSecret() {
        return jwtSecret;
    }

    public void setJwtSecret(String jwtSecret) {
        this.jwtSecret = jwtSecret;
    }

    public long getTokenExpireSeconds() {
        return tokenExpireSeconds;
    }

    public void setTokenExpireSeconds(long tokenExpireSeconds) {
        this.tokenExpireSeconds = tokenExpireSeconds;
    }
}
