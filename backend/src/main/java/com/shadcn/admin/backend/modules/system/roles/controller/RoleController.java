package com.shadcn.admin.backend.modules.system.roles.controller;

import com.shadcn.admin.backend.common.api.ApiResponse;
import com.shadcn.admin.backend.common.api.PageResponse;
import com.shadcn.admin.backend.common.auth.AuthUser;
import com.shadcn.admin.backend.infra.web.JwtAuthWebFilter;
import com.shadcn.admin.backend.modules.system.roles.dto.RoleBatchDeleteRequest;
import com.shadcn.admin.backend.modules.system.roles.dto.RoleDTO;
import com.shadcn.admin.backend.modules.system.roles.dto.RoleListQuery;
import com.shadcn.admin.backend.modules.system.roles.dto.RoleUpsertRequest;
import com.shadcn.admin.backend.modules.system.roles.dto.RoleUserListQuery;
import com.shadcn.admin.backend.modules.system.roles.dto.RoleUserAssignRequest;
import com.shadcn.admin.backend.modules.system.roles.dto.SaveRoleDataScopeRequest;
import com.shadcn.admin.backend.modules.system.roles.dto.SaveRolePermissionsRequest;
import com.shadcn.admin.backend.modules.system.roles.dto.ToggleRoleStatusRequest;
import com.shadcn.admin.backend.modules.system.roles.service.RoleService;
import com.shadcn.admin.backend.modules.system.users.dto.UserLiteDTO;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
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

@RestController
@RequestMapping("/api/system/roles")
public class RoleController {
    private final RoleService roleService;

    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    @GetMapping("/list")
    public Mono<ApiResponse<PageResponse<RoleDTO>>> list(RoleListQuery query) {
        return roleService.list(query).map(ApiResponse::success);
    }

    @GetMapping("/{id}")
    public Mono<ApiResponse<RoleDTO>> detail(@PathVariable String id) {
        return roleService.detail(id).map(ApiResponse::success);
    }

    @PostMapping
    public Mono<ApiResponse<Map<String, String>>> create(@Valid @RequestBody RoleUpsertRequest req) {
        return roleService.create(req).map(id -> ApiResponse.success(Map.of("id", id)));
    }

    @PutMapping("/{id}")
    public Mono<ApiResponse<Void>> update(@PathVariable String id, @Valid @RequestBody RoleUpsertRequest req) {
        return roleService.update(id, req).thenReturn(ApiResponse.success());
    }

    @DeleteMapping("/{id}")
    public Mono<ApiResponse<Void>> delete(@PathVariable String id) {
        return roleService.delete(id).thenReturn(ApiResponse.success());
    }

    @DeleteMapping("/batch")
    public Mono<ApiResponse<Void>> batchDelete(@Valid @RequestBody RoleBatchDeleteRequest req) {
        return roleService.batchDelete(req.getIds()).thenReturn(ApiResponse.success());
    }

    @PatchMapping("/{id}/status")
    public Mono<ApiResponse<Void>> toggleStatus(@PathVariable String id, @Valid @RequestBody ToggleRoleStatusRequest req) {
        return roleService.toggleStatus(id, req).thenReturn(ApiResponse.success());
    }

    @GetMapping("/{id}/permissions")
    public Mono<ApiResponse<List<String>>> permissions(@PathVariable String id) {
        return roleService.getPermissions(id).map(ApiResponse::success);
    }

    @PostMapping("/{id}/permissions")
    public Mono<ApiResponse<Void>> savePermissions(@PathVariable String id, @Valid @RequestBody SaveRolePermissionsRequest req) {
        return roleService.savePermissions(id, req).thenReturn(ApiResponse.success());
    }

    @PostMapping("/{id}/data-scope")
    public Mono<ApiResponse<Void>> saveDataScope(@PathVariable String id, @Valid @RequestBody SaveRoleDataScopeRequest req) {
        return roleService.saveDataScope(id, req).thenReturn(ApiResponse.success());
    }

    @GetMapping("/{id}/users")
    public Mono<ApiResponse<PageResponse<UserLiteDTO>>> users(
            @PathVariable String id, RoleUserListQuery query, ServerWebExchange exchange) {
        AuthUser authUser = exchange.getAttribute(JwtAuthWebFilter.AUTH_USER_ATTR);
        return roleService.users(id, query, authUser == null ? null : authUser.userId()).map(ApiResponse::success);
    }

    @PostMapping("/{id}/users")
    public Mono<ApiResponse<Void>> assignUsers(@PathVariable String id, @Valid @RequestBody RoleUserAssignRequest req) {
        return roleService.assignUsers(id, req).thenReturn(ApiResponse.success());
    }

    @DeleteMapping("/{id}/users")
    public Mono<ApiResponse<Void>> removeUsers(@PathVariable String id, @Valid @RequestBody RoleUserAssignRequest req) {
        return roleService.removeUsers(id, req).thenReturn(ApiResponse.success());
    }

    @GetMapping("/export")
    public Mono<ApiResponse<String>> export() {
        return Mono.just(ApiResponse.fail(501, "export roles not implemented"));
    }
}
