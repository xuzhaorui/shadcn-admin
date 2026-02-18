package com.shadcn.admin.backend.modules.auth.service;

import com.shadcn.admin.backend.common.auth.AuthProperties;
import com.shadcn.admin.backend.common.auth.AuthUser;
import com.shadcn.admin.backend.common.auth.JwtTokenService;
import com.shadcn.admin.backend.common.exception.BusinessException;
import com.shadcn.admin.backend.infra.audit.AuditService;
import com.shadcn.admin.backend.infra.mybatis.BlockingMyBatisExecutor;
import com.shadcn.admin.backend.modules.auth.dto.LoginRequest;
import com.shadcn.admin.backend.modules.auth.dto.LoginResponse;
import com.shadcn.admin.backend.modules.system.users.domain.UserDO;
import com.shadcn.admin.backend.modules.system.users.mapper.UserMapper;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import reactor.core.publisher.Mono;

@Service
public class AuthService {
    private final BlockingMyBatisExecutor executor;
    private final UserMapper userMapper;
    private final JwtTokenService jwtTokenService;
    private final AuthProperties authProperties;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public AuthService(
            BlockingMyBatisExecutor executor,
            UserMapper userMapper,
            JwtTokenService jwtTokenService,
            AuthProperties authProperties,
            PasswordEncoder passwordEncoder,
            AuditService auditService) {
        this.executor = executor;
        this.userMapper = userMapper;
        this.jwtTokenService = jwtTokenService;
        this.authProperties = authProperties;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    public Mono<LoginResponse> login(LoginRequest request, String ip) {
        return executor.call(() -> {
            UserDO user = userMapper.selectByUsername(request.getUsername());
            if (user == null || !passwordMatches(request.getPassword(), user.getPasswordHash())) {
                throw new BusinessException(401, "invalid username or password");
            }
            if ("disabled".equalsIgnoreCase(user.getStatus())) {
                throw new BusinessException(403, "user is disabled");
            }
            List<String> permissions = resolvePermissions(user.getId());
            AuthUser authUser = new AuthUser(user.getId(), user.getUsername(), permissions);
            String token = jwtTokenService.generateToken(authUser);
            return new LoginResponse(
                    token,
                    "Bearer",
                    authProperties.getTokenExpireSeconds(),
                    user.getId(),
                    user.getUsername(),
                    permissions);
        }).flatMap(resp ->
                auditService.recordLogin(request.getUsername(), ip, "success").thenReturn(resp))
                .onErrorResume(BusinessException.class, ex ->
                        auditService.recordLogin(request.getUsername(), ip, "failed").then(Mono.error(ex)));
    }

    private List<String> resolvePermissions(String userId) {
        List<String> roleCodes = userMapper.selectRoleCodesByUserId(userId);
        if (roleCodes != null && roleCodes.stream().anyMatch(v -> "admin".equalsIgnoreCase(v))) {
            return List.of("*");
        }
        return List.of(
                "system:users:view",
                "system:roles:view",
                "system:menus:view",
                "system:departments:view");
    }

    private boolean passwordMatches(String raw, String stored) {
        if (stored == null || stored.isBlank()) {
            return false;
        }
        try {
            return passwordEncoder.matches(raw, stored);
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }
}
