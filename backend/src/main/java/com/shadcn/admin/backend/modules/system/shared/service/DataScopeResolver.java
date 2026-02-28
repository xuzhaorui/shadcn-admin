package com.shadcn.admin.backend.modules.system.shared.service;

import com.shadcn.admin.backend.modules.system.departments.domain.DepartmentDO;
import com.shadcn.admin.backend.modules.system.departments.mapper.DepartmentMapper;
import com.shadcn.admin.backend.modules.system.roles.dto.RoleUserListQuery;
import com.shadcn.admin.backend.modules.system.users.domain.UserDO;
import com.shadcn.admin.backend.modules.system.users.dto.RoleAvailableUserQuery;
import com.shadcn.admin.backend.modules.system.users.dto.UserListQuery;
import com.shadcn.admin.backend.modules.system.users.mapper.UserMapper;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class DataScopeResolver {
    private final UserMapper userMapper;
    private final DepartmentMapper departmentMapper;

    public DataScopeResolver(UserMapper userMapper, DepartmentMapper departmentMapper) {
        this.userMapper = userMapper;
        this.departmentMapper = departmentMapper;
    }

    public void apply(UserListQuery query, String currentUserId) {
        ResolvedDataScope scope = resolve(currentUserId);
        query.setDataScopeRestricted(scope.restricted());
        query.setDataScopeAllowSelf(scope.allowSelf());
        query.setDataScopeUserId(scope.userId());
        query.setDataScopeDeptIds(scope.deptIds());
    }

    public void apply(RoleUserListQuery query, String currentUserId) {
        ResolvedDataScope scope = resolve(currentUserId);
        query.setDataScopeRestricted(scope.restricted());
        query.setDataScopeAllowSelf(scope.allowSelf());
        query.setDataScopeUserId(scope.userId());
        query.setDataScopeDeptIds(scope.deptIds());
    }

    public void apply(RoleAvailableUserQuery query, String currentUserId) {
        ResolvedDataScope scope = resolve(currentUserId);
        query.setDataScopeRestricted(scope.restricted());
        query.setDataScopeAllowSelf(scope.allowSelf());
        query.setDataScopeUserId(scope.userId());
        query.setDataScopeDeptIds(scope.deptIds());
    }

    private ResolvedDataScope resolve(String currentUserId) {
        if (isBlank(currentUserId)) {
            return ResolvedDataScope.restricted(currentUserId, false, List.of());
        }

        List<String> roleCodes = normalize(userMapper.selectRoleCodesByUserId(currentUserId));
        if (roleCodes.stream().anyMatch(code -> "admin".equalsIgnoreCase(code))) {
            return ResolvedDataScope.unrestricted(currentUserId);
        }

        List<String> scopes = normalize(userMapper.selectRoleDataScopesByUserId(currentUserId));
        if (scopes.stream().anyMatch(scope -> "all".equals(scope))) {
            return ResolvedDataScope.unrestricted(currentUserId);
        }

        boolean allowSelf = scopes.stream().anyMatch(scope -> "self".equals(scope));
        LinkedHashSet<String> deptIds = new LinkedHashSet<>();
        String currentDeptId = resolveCurrentDeptId(currentUserId);

        if (hasScope(scopes, "dept") && !isBlank(currentDeptId)) {
            deptIds.add(currentDeptId);
        }
        if (hasScope(scopes, "dept_down") && !isBlank(currentDeptId)) {
            deptIds.addAll(expandDeptWithChildren(currentDeptId));
        }
        if (hasScope(scopes, "custom")) {
            deptIds.addAll(normalize(userMapper.selectCustomDeptIdsByUserId(currentUserId)));
        }

        return ResolvedDataScope.restricted(currentUserId, allowSelf, new ArrayList<>(deptIds));
    }

    private String resolveCurrentDeptId(String currentUserId) {
        UserDO currentUser = userMapper.selectById(currentUserId);
        return currentUser == null ? null : currentUser.getDepartmentId();
    }

    private List<String> expandDeptWithChildren(String rootDeptId) {
        if (isBlank(rootDeptId)) {
            return List.of();
        }

        List<DepartmentDO> departments = departmentMapper.selectAll();
        if (departments == null || departments.isEmpty()) {
            return List.of(rootDeptId);
        }

        Map<String, List<String>> childrenByParent = new HashMap<>();
        for (DepartmentDO department : departments) {
            if (department == null || isBlank(department.getId()) || isBlank(department.getParentId())) {
                continue;
            }
            childrenByParent
                    .computeIfAbsent(department.getParentId(), ignored -> new ArrayList<>())
                    .add(department.getId());
        }

        LinkedHashSet<String> result = new LinkedHashSet<>();
        Set<String> visited = new LinkedHashSet<>();
        ArrayDeque<String> queue = new ArrayDeque<>();
        queue.offer(rootDeptId);

        while (!queue.isEmpty()) {
            String current = queue.poll();
            if (isBlank(current) || visited.contains(current)) {
                continue;
            }
            visited.add(current);
            result.add(current);
            List<String> children = childrenByParent.get(current);
            if (children != null && !children.isEmpty()) {
                children.forEach(queue::offer);
            }
        }

        return new ArrayList<>(result);
    }

    private boolean hasScope(List<String> scopes, String target) {
        return scopes.stream().anyMatch(scope -> target.equals(scope));
    }

    private List<String> normalize(List<String> values) {
        if (values == null || values.isEmpty()) {
            return List.of();
        }
        LinkedHashSet<String> normalized = new LinkedHashSet<>();
        for (String value : values) {
            if (isBlank(value)) {
                continue;
            }
            normalized.add(value.trim());
        }
        return new ArrayList<>(normalized);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private record ResolvedDataScope(boolean restricted, boolean allowSelf, String userId, List<String> deptIds) {
        private static ResolvedDataScope unrestricted(String userId) {
            return new ResolvedDataScope(false, false, userId, List.of());
        }

        private static ResolvedDataScope restricted(String userId, boolean allowSelf, List<String> deptIds) {
            return new ResolvedDataScope(true, allowSelf, userId, deptIds == null ? List.of() : deptIds);
        }
    }
}
