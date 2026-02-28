package com.shadcn.admin.backend.modules.auth.service;

import com.shadcn.admin.backend.common.auth.AuthProperties;
import com.shadcn.admin.backend.common.auth.AuthUser;
import com.shadcn.admin.backend.common.auth.JwtTokenService;
import com.shadcn.admin.backend.common.auth.RefreshTokenRegistry;
import com.shadcn.admin.backend.common.exception.BusinessException;
import com.shadcn.admin.backend.infra.audit.AuditService;
import com.shadcn.admin.backend.infra.mybatis.BlockingMyBatisExecutor;
import com.shadcn.admin.backend.modules.auth.dto.LoginRequest;
import com.shadcn.admin.backend.modules.auth.dto.LoginResponse;
import com.shadcn.admin.backend.modules.auth.dto.RegisterRequest;
import com.shadcn.admin.backend.modules.monitor.online.service.OnlineSessionRegistry;
import com.shadcn.admin.backend.modules.system.users.domain.UserDO;
import com.shadcn.admin.backend.modules.system.users.mapper.UserMapper;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.Set;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class AuthService {
    private static final Set<String> ACTION_SUFFIXES = Set.of(
            "view",
            "create",
            "edit",
            "delete",
            "export",
            "import",
            "reset-pwd",
            "assign",
            "assign-perms",
            "assign-data-scope",
            "assign-users");

    private final BlockingMyBatisExecutor executor;
    private final UserMapper userMapper;
    private final JwtTokenService jwtTokenService;
    private final AuthProperties authProperties;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final OnlineSessionRegistry onlineSessionRegistry;
    private final RefreshTokenRegistry refreshTokenRegistry;
    private final LoginProtectionService loginProtectionService;

    public AuthService(
            BlockingMyBatisExecutor executor,
            UserMapper userMapper,
            JwtTokenService jwtTokenService,
            AuthProperties authProperties,
            PasswordEncoder passwordEncoder,
            AuditService auditService,
            OnlineSessionRegistry onlineSessionRegistry,
            RefreshTokenRegistry refreshTokenRegistry,
            LoginProtectionService loginProtectionService) {
        this.executor = executor;
        this.userMapper = userMapper;
        this.jwtTokenService = jwtTokenService;
        this.authProperties = authProperties;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
        this.onlineSessionRegistry = onlineSessionRegistry;
        this.refreshTokenRegistry = refreshTokenRegistry;
        this.loginProtectionService = loginProtectionService;
    }

    public Mono<AuthSession> login(LoginRequest request, String ip, String userAgent) {
        return executor.call(() -> {
            try {
                loginProtectionService.checkAllowed(request.getUsername(), ip);
            } catch (LoginProtectionService.TooManyLoginAttemptsException ex) {
                throw new BusinessException(429, ex.getMessage());
            }
            UserDO user = userMapper.selectByUsername(request.getUsername());
            if (user == null) {
                user = userMapper.selectByEmail(request.getUsername());
            }
            if (user == null || !passwordMatches(request.getPassword(), user.getPasswordHash())) {
                loginProtectionService.onFailure(request.getUsername());
                throw new BusinessException(401, "invalid username or password");
            }
            if ("disabled".equalsIgnoreCase(user.getStatus())) {
                loginProtectionService.onFailure(request.getUsername());
                throw new BusinessException(403, "user is disabled");
            }
            loginProtectionService.onSuccess(request.getUsername());
            List<String> permissions = resolvePermissions(user.getId());
            List<String> roleNames = resolveRoleNames(user.getId());
            AuthUser authUser = new AuthUser(user.getId(), user.getUsername(), permissions, roleNames);
            String accessToken = jwtTokenService.generateAccessToken(authUser);
            JwtTokenService.RefreshTokenClaims refresh = jwtTokenService.generateRefreshToken(user.getId(), user.getUsername());
            refreshTokenRegistry.register(refresh.jti(), refresh.expireEpochMillis());
            LoginResponse payload = new LoginResponse(
                    accessToken,
                    "Bearer",
                    authProperties.getTokenExpireSeconds(),
                    user.getId(),
                    user.getUsername(),
                    permissions,
                    roleNames);
            return new AuthSession(payload, accessToken, refresh.token(), refresh.jti());
        }).flatMap(resp -> {
                    onlineSessionRegistry.registerSession(
                            resp.accessToken(),
                            resp.response().userId(),
                            resp.response().username(),
                            "-",
                            ip,
                            userAgent,
                            authProperties.getTokenExpireSeconds());
                    return auditService.recordLogin(request.getUsername(), ip, "success").thenReturn(resp);
                })
                .onErrorResume(BusinessException.class, ex ->
                        auditService.recordLogin(request.getUsername(), ip, "failed").then(Mono.error(ex)));
    }

    public Mono<AuthSession> refresh(String refreshToken, String ip, String userAgent) {
        return executor.call(() -> {
            JwtTokenService.ParsedRefreshToken parsed;
            try {
                parsed = jwtTokenService.parseRefreshToken(refreshToken);
            } catch (Exception ex) {
                throw new BusinessException(401, "invalid refresh token");
            }
            if (!refreshTokenRegistry.consume(parsed.jti())) {
                throw new BusinessException(401, "refresh token revoked");
            }

            UserDO user = userMapper.selectById(parsed.userId());
            if (user == null || "disabled".equalsIgnoreCase(user.getStatus())) {
                throw new BusinessException(401, "user not available");
            }

            List<String> permissions = resolvePermissions(user.getId());
            List<String> roleNames = resolveRoleNames(user.getId());
            AuthUser authUser = new AuthUser(user.getId(), user.getUsername(), permissions, roleNames);
            String accessToken = jwtTokenService.generateAccessToken(authUser);
            JwtTokenService.RefreshTokenClaims nextRefresh =
                    jwtTokenService.generateRefreshToken(user.getId(), user.getUsername());
            refreshTokenRegistry.register(nextRefresh.jti(), nextRefresh.expireEpochMillis());

            LoginResponse payload = new LoginResponse(
                    accessToken,
                    "Bearer",
                    authProperties.getTokenExpireSeconds(),
                    user.getId(),
                    user.getUsername(),
                    permissions,
                    roleNames);
            return new AuthSession(payload, accessToken, nextRefresh.token(), nextRefresh.jti());
        }).doOnNext(resp -> onlineSessionRegistry.registerSession(
                resp.accessToken(),
                resp.response().userId(),
                resp.response().username(),
                "-",
                ip,
                userAgent,
                authProperties.getTokenExpireSeconds()));
    }

    public Mono<Void> logout(String accessToken, String refreshToken) {
        return Mono.fromRunnable(() -> {
            if (accessToken != null && !accessToken.isBlank()) {
                onlineSessionRegistry.revokeToken(accessToken, authProperties.getTokenExpireSeconds());
            }
            if (refreshToken != null && !refreshToken.isBlank()) {
                try {
                    JwtTokenService.ParsedRefreshToken parsed = jwtTokenService.parseRefreshToken(refreshToken);
                    refreshTokenRegistry.revoke(parsed.jti());
                } catch (Exception ignored) {
                    // ignore malformed refresh token on logout
                }
            }
        });
    }

    public Mono<Map<String, String>> register(RegisterRequest request, String ip) {
        if (!authProperties.isAllowRegister()) {
            return Mono.error(new BusinessException(403, "register disabled"));
        }
        return executor.call(() -> {
            if (userMapper.selectByEmail(request.getEmail()) != null) {
                throw new BusinessException(409, "email already exists");
            }
            if (userMapper.selectByUsername(request.getEmail()) != null) {
                throw new BusinessException(409, "username already exists");
            }

            UserDO user = new UserDO();
            user.setUsername(request.getEmail());
            user.setRealName(request.getEmail().split("@")[0]);
            user.setEmail(request.getEmail());
            user.setPhone(null);
            user.setDepartmentId(null);
            user.setStatus("enabled");
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            user.setVersion(0L);
            userMapper.insert(user);

            return Map.of("id", user.getId());
        }).flatMap(resp ->
                auditService.recordLogin(request.getEmail(), ip, "success").thenReturn(resp))
                .onErrorResume(BusinessException.class, ex ->
                        auditService.recordLogin(request.getEmail(), ip, "failed").then(Mono.error(ex)));
    }

    public record AuthSession(LoginResponse response, String accessToken, String refreshToken, String refreshJti) {}

    private List<String> resolvePermissions(String userId) {
        List<String> roleCodes = userMapper.selectRoleCodesByUserId(userId);
        if (roleCodes != null && roleCodes.stream().anyMatch(v -> "admin".equalsIgnoreCase(v))) {
            return List.of("*");
        }
        List<String> menuCodes = userMapper.selectMenuCodesByUserId(userId);
        if (menuCodes == null || menuCodes.isEmpty()) {
            return List.of();
        }
        return menuCodes.stream()
                .map(this::toPermissionCode)
                .filter(v -> v != null && !v.isBlank())
                .distinct()
                .toList();
    }

    private List<String> resolveRoleNames(String userId) {
        List<String> roleNames = userMapper.selectRoleNamesByUserId(userId);
        if (roleNames == null || roleNames.isEmpty()) {
            return List.of();
        }
        return roleNames.stream()
                .filter(v -> v != null && !v.isBlank())
                .distinct()
                .toList();
    }

    private String toPermissionCode(String menuCode) {
        if (menuCode == null || menuCode.isBlank()) {
            return null;
        }
        String code = menuCode.trim().toLowerCase(Locale.ROOT);
        return switch (code) {
            case "system:users" -> "system:users:view";
            case "system:roles" -> "system:roles:view";
            case "system:menus" -> "system:menus:view";
            case "system:depts" -> "system:departments:view";
            case "system:logs", "system:logs:operation", "system:logs:login" -> "system:logs:view";
            default -> {
                String[] parts = code.split(":");
                String suffix = parts[parts.length - 1];
                if (parts.length >= 3 || ACTION_SUFFIXES.contains(suffix)) {
                    yield code;
                }
                yield code + ":view";
            }
        };
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
