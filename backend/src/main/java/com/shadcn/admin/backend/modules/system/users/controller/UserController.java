package com.shadcn.admin.backend.modules.system.users.controller;

import com.shadcn.admin.backend.common.api.ApiResponse;
import com.shadcn.admin.backend.common.api.PageResponse;
import com.shadcn.admin.backend.common.auth.AuthUser;
import com.shadcn.admin.backend.infra.web.JwtAuthWebFilter;
import com.shadcn.admin.backend.modules.system.users.dto.BatchDeleteRequest;
import com.shadcn.admin.backend.modules.system.users.dto.ResetPasswordRequest;
import com.shadcn.admin.backend.modules.system.users.dto.RoleAvailableUserQuery;
import com.shadcn.admin.backend.modules.system.users.dto.ToggleStatusRequest;
import com.shadcn.admin.backend.modules.system.users.dto.UserDTO;
import com.shadcn.admin.backend.modules.system.users.dto.UserListQuery;
import com.shadcn.admin.backend.modules.system.users.dto.UserLiteDTO;
import com.shadcn.admin.backend.modules.system.users.dto.UserRoleAssignRequest;
import com.shadcn.admin.backend.modules.system.users.dto.UserUpsertRequest;
import com.shadcn.admin.backend.modules.system.users.service.UserService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Validated
@RestController
@RequestMapping("/api/system/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/list")
    public Mono<ApiResponse<PageResponse<UserDTO>>> list(UserListQuery query, ServerWebExchange exchange) {
        AuthUser authUser = exchange.getAttribute(JwtAuthWebFilter.AUTH_USER_ATTR);
        return userService.list(query, authUser == null ? null : authUser.userId()).map(ApiResponse::success);
    }

    @GetMapping("/available-for-role")
    public Mono<ApiResponse<PageResponse<UserLiteDTO>>> availableForRole(
            RoleAvailableUserQuery query, ServerWebExchange exchange) {
        AuthUser authUser = exchange.getAttribute(JwtAuthWebFilter.AUTH_USER_ATTR);
        return userService.availableForRole(query, authUser == null ? null : authUser.userId()).map(ApiResponse::success);
    }

    @GetMapping("/{id}")
    public Mono<ApiResponse<UserDTO>> detail(@PathVariable String id) {
        return userService.detail(id).map(ApiResponse::success);
    }

    @PostMapping
    public Mono<ApiResponse<Map<String, String>>> create(@Valid @RequestBody UserUpsertRequest req) {
        return userService.create(req).map(id -> ApiResponse.success(Map.of("id", id)));
    }

    @PutMapping("/{id}")
    public Mono<ApiResponse<Void>> update(@PathVariable String id, @Valid @RequestBody UserUpsertRequest req) {
        return userService.update(id, req).thenReturn(ApiResponse.success());
    }

    @DeleteMapping("/{id}")
    public Mono<ApiResponse<Void>> delete(@PathVariable String id) {
        return userService.delete(id).thenReturn(ApiResponse.success());
    }

    @DeleteMapping("/batch")
    public Mono<ApiResponse<Void>> batchDelete(@Valid @RequestBody BatchDeleteRequest req) {
        return userService.batchDelete(req).thenReturn(ApiResponse.success());
    }

    @PatchMapping("/{id}/status")
    public Mono<ApiResponse<Void>> toggleStatus(@PathVariable String id, @Valid @RequestBody ToggleStatusRequest req) {
        return userService.toggleStatus(id, req).thenReturn(ApiResponse.success());
    }

    @PostMapping("/{id}/reset-password")
    public Mono<ApiResponse<Void>> resetPassword(@PathVariable String id, @Valid @RequestBody ResetPasswordRequest req) {
        return userService.resetPassword(id, req).thenReturn(ApiResponse.success());
    }

    @PostMapping("/{id}/roles")
    public Mono<ApiResponse<Void>> assignRoles(@PathVariable String id, @Valid @RequestBody UserRoleAssignRequest req) {
        return userService.assignRoles(id, req).thenReturn(ApiResponse.success());
    }

    @GetMapping("/export")
    public Mono<ApiResponse<String>> export() {
        return Mono.just(ApiResponse.fail(501, "export users not implemented"));
    }
}
