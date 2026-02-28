package com.shadcn.admin.backend.common.config;

import com.shadcn.admin.backend.common.auth.AuthProperties;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("prod")
public class ProductionSafetyGuard implements ApplicationRunner {
    private static final String DEFAULT_DEV_SECRET = "local-dev-jwt-secret-change-me-2026-02-18";

    private final AuthProperties authProperties;

    @Value("${app.seed.enabled:false}")
    private boolean seedEnabled;

    @Value("${spring.datasource.username:}")
    private String datasourceUsername;

    @Value("${spring.datasource.password:}")
    private String datasourcePassword;

    public ProductionSafetyGuard(AuthProperties authProperties) {
        this.authProperties = authProperties;
    }

    @Override
    public void run(ApplicationArguments args) {
        List<String> violations = new ArrayList<>();

        String jwtSecret = authProperties.getJwtSecret();
        if (jwtSecret == null || jwtSecret.isBlank() || jwtSecret.length() < 32) {
            violations.add("app.auth.jwt-secret must be at least 32 characters in prod");
        } else if (DEFAULT_DEV_SECRET.equals(jwtSecret.trim())) {
            violations.add("app.auth.jwt-secret cannot use the default local dev secret in prod");
        }

        if (!authProperties.isCookieSecure()) {
            violations.add("app.auth.cookie-secure must be true in prod");
        }

        if (authProperties.isAllowRegister()) {
            violations.add("app.auth.allow-register must be false in prod");
        }

        if (seedEnabled) {
            violations.add("app.seed.enabled must be false in prod");
        }

        if ("root".equalsIgnoreCase(valueOrBlank(datasourceUsername))
                && "root".equals(valueOrBlank(datasourcePassword))) {
            violations.add("spring.datasource root/root credential is not allowed in prod");
        }

        if (!violations.isEmpty()) {
            String message = "Production safety guard failed:\n - " + String.join("\n - ", violations);
            throw new IllegalStateException(message);
        }
    }

    private String valueOrBlank(String value) {
        return value == null ? "" : value.trim();
    }
}
