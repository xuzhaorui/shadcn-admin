package com.shadcn.admin.backend.infra.web;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;

class JwtAuthWebFilterPermissionResolverTest {

    @Test
    void shouldAllowAuthMeWithoutExtraPermission() {
        assertNull(JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.GET, "/api/auth/me"));
    }

    @Test
    void shouldMapMonitorPermissionsCorrectly() {
        assertEquals(
                "monitor:online:view",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.GET, "/api/monitor/online/list"));
        assertEquals(
                "monitor:online:force-logout",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.POST, "/api/monitor/online/force-logout"));
        assertEquals(
                "monitor:jobs:view",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.GET, "/api/monitor/jobs/list"));
        assertEquals(
                "monitor:jobs:create",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.POST, "/api/monitor/jobs"));
        assertEquals(
                "monitor:jobs:run",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.POST, "/api/monitor/jobs/execute"));
        assertEquals(
                "monitor:jobs:edit",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.PATCH, "/api/monitor/jobs/1/status"));
        assertEquals(
                "monitor:jobs:delete",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.DELETE, "/api/monitor/jobs/1"));
        assertEquals(
                "monitor:cache:view",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.GET, "/api/monitor/cache/summary"));
        assertEquals(
                "monitor:cache:clear",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.POST, "/api/monitor/cache/clear"));
        assertEquals(
                "monitor:cache:clear",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.DELETE, "/api/monitor/cache/clear"));
        assertEquals(
                "monitor:server:view",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.GET, "/api/monitor/server/metrics"));
    }

    @Test
    void shouldMapUserCreatePermissionForPostUsers() {
        assertEquals(
                "system:users:create",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.POST, "/api/system/users"));
    }

    @Test
    void shouldMapSystemManagementPermissionsCorrectly() {
        assertEquals(
                "system:users:view",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.GET, "/api/system/users"));
        assertEquals(
                "system:users:export",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.GET, "/api/system/users/export"));
        assertEquals(
                "system:users:reset-pwd",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.POST, "/api/system/users/1/reset-password"));
        assertEquals(
                "system:users:assign-roles",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.POST, "/api/system/users/1/roles"));
        assertEquals(
                "system:users:edit",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.PATCH, "/api/system/users/1"));
        assertEquals(
                "system:users:delete",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.DELETE, "/api/system/users/1"));

        assertEquals(
                "system:roles:view",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.GET, "/api/system/roles"));
        assertEquals(
                "system:roles:export",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.GET, "/api/system/roles/export"));
        assertEquals(
                "system:roles:create",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.POST, "/api/system/roles"));
        assertEquals(
                "system:roles:edit",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.PUT, "/api/system/roles/1"));
        assertEquals(
                "system:roles:delete",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.DELETE, "/api/system/roles/1"));
        assertEquals(
                "system:roles:assign-perms",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.POST, "/api/system/roles/1/permissions"));
        assertEquals(
                "system:roles:assign-data-scope",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.POST, "/api/system/roles/1/data-scope"));
        assertEquals(
                "system:roles:assign-users",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.POST, "/api/system/roles/1/users"));
        assertEquals(
                "system:roles:assign-users",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.DELETE, "/api/system/roles/1/users"));

        assertNull(JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.GET, "/api/system/menus/tree"));
        assertEquals(
                "system:menus:create",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.POST, "/api/system/menus"));
        assertEquals(
                "system:menus:edit",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.PATCH, "/api/system/menus/1"));
        assertEquals(
                "system:menus:delete",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.DELETE, "/api/system/menus/1"));

        assertEquals(
                "system:departments:view",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.GET, "/api/system/departments/tree"));
        assertEquals(
                "system:departments:create",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.POST, "/api/system/departments"));
        assertEquals(
                "system:departments:edit",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.PUT, "/api/system/departments/1"));
        assertEquals(
                "system:departments:delete",
                JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.DELETE, "/api/system/departments/1"));
    }

    @Test
    void shouldDenyUnknownApiByDefault() {
        assertEquals("__deny__", JwtAuthWebFilter.PermissionResolver.resolve(HttpMethod.GET, "/api/unknown/path"));
    }
}
