package com.shadcn.admin.backend.modules.system.roles.service;

import com.shadcn.admin.backend.common.api.PageResponse;
import com.shadcn.admin.backend.common.exception.BusinessException;
import com.shadcn.admin.backend.infra.mybatis.BlockingMyBatisExecutor;
import com.shadcn.admin.backend.modules.system.shared.service.DataScopeResolver;
import com.shadcn.admin.backend.modules.system.roles.domain.RoleDO;
import com.shadcn.admin.backend.modules.system.roles.dto.RoleDTO;
import com.shadcn.admin.backend.modules.system.roles.dto.RoleListQuery;
import com.shadcn.admin.backend.modules.system.roles.dto.RoleUserListQuery;
import com.shadcn.admin.backend.modules.system.roles.dto.RoleUpsertRequest;
import com.shadcn.admin.backend.modules.system.roles.dto.RoleUserAssignRequest;
import com.shadcn.admin.backend.modules.system.roles.dto.SaveRoleDataScopeRequest;
import com.shadcn.admin.backend.modules.system.roles.dto.SaveRolePermissionsRequest;
import com.shadcn.admin.backend.modules.system.roles.dto.ToggleRoleStatusRequest;
import com.shadcn.admin.backend.modules.system.roles.mapper.RoleMapper;
import com.shadcn.admin.backend.modules.system.users.dto.UserLiteDTO;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import reactor.core.publisher.Mono;

@Service
public class RoleService {
    private final BlockingMyBatisExecutor executor;
    private final RoleMapper roleMapper;
    private final TransactionTemplate transactionTemplate;
    private final DataScopeResolver dataScopeResolver;

    public RoleService(
            BlockingMyBatisExecutor executor,
            RoleMapper roleMapper,
            TransactionTemplate transactionTemplate,
            DataScopeResolver dataScopeResolver) {
        this.executor = executor;
        this.roleMapper = roleMapper;
        this.transactionTemplate = transactionTemplate;
        this.dataScopeResolver = dataScopeResolver;
    }

    public Mono<PageResponse<RoleDTO>> list(RoleListQuery query) {
        return executor.call(() -> {
            List<RoleDO> roles = roleMapper.selectPage(query);
            Map<String, List<String>> menuIdsByRoleId = loadMenuIdsByRoleIds(roles);
            List<RoleDTO> list = roles.stream()
                    .map(role -> toDto(role, menuIdsByRoleId.get(role.getId())))
                    .toList();
            return new PageResponse<>(list, roleMapper.count(query), query.getPage(), query.getPageSize());
        });
    }

    public Mono<RoleDTO> detail(String id) {
        return executor.call(() -> {
            RoleDO role = roleMapper.selectById(id);
            if (role == null) {
                throw new BusinessException(404, "role not found");
            }
            return toDto(role);
        });
    }

    public Mono<String> create(RoleUpsertRequest req) {
        return executor.call(() -> transactionTemplate.execute(status -> {
            validateCode(req.getCode(), null);
            RoleDO role = new RoleDO();
            role.setCode(req.getCode());
            role.setName(req.getName());
            role.setStatus(req.getStatus());
            role.setDataScope("self");
            role.setVersion(0L);
            roleMapper.insert(role);
            return role.getId();
        }));
    }

    public Mono<Void> update(String id, RoleUpsertRequest req) {
        return executor.call(() -> {
            transactionTemplate.executeWithoutResult(status -> {
                RoleDO role = roleMapper.selectById(id);
                if (role == null) {
                    throw new BusinessException(404, "role not found");
                }
                if ("admin".equals(role.getCode()) && !role.getCode().equals(req.getCode())) {
                    throw new BusinessException(400, "built-in admin code cannot be changed");
                }
                validateCode(req.getCode(), id);
                role.setCode(req.getCode());
                role.setName(req.getName());
                role.setStatus(req.getStatus());
                roleMapper.update(role);
            });
            return null;
        });
    }

    public Mono<Void> delete(String id) {
        return executor.call(() -> {
            transactionTemplate.executeWithoutResult(status -> {
                RoleDO role = roleMapper.selectById(id);
                if (role == null) {
                    return;
                }
                if ("admin".equals(role.getCode())) {
                    throw new BusinessException(400, "built-in admin role cannot be deleted");
                }
                if (roleMapper.countUsersByRoleId(id) > 0) {
                    throw new BusinessException(409, "role has bound users");
                }
                roleMapper.deleteRoleMenus(id);
                roleMapper.deleteRoleDepts(id);
                roleMapper.deleteById(id);
            });
            return null;
        });
    }

    public Mono<Void> batchDelete(List<String> ids) {
        return executor.call(() -> {
            transactionTemplate.executeWithoutResult(status -> ids.forEach(this::deleteSync));
            return null;
        });
    }

    public Mono<Void> toggleStatus(String id, ToggleRoleStatusRequest req) {
        return executor.call(() -> {
            ensureMutableRole(id);
            roleMapper.updateStatus(id, req.getStatus());
            return null;
        });
    }

    public Mono<List<String>> getPermissions(String id) {
        return executor.call(() -> roleMapper.selectMenuIds(id));
    }

    public Mono<Void> savePermissions(String id, SaveRolePermissionsRequest req) {
        return executor.call(() -> {
            transactionTemplate.executeWithoutResult(status -> {
                ensureMutableRole(id);
                replaceMenus(id, req.getMenuIds());
            });
            return null;
        });
    }

    public Mono<Void> saveDataScope(String id, SaveRoleDataScopeRequest req) {
        return executor.call(() -> {
            transactionTemplate.executeWithoutResult(status -> {
                RoleDO role = roleMapper.selectById(id);
                if (role == null) {
                    throw new BusinessException(404, "role not found");
                }
                if ("admin".equals(role.getCode())) {
                    throw new BusinessException(400, "built-in admin role cannot be modified");
                }
                role.setDataScope(req.getDataScope());
                roleMapper.update(role);
                roleMapper.deleteRoleDepts(id);
                if ("custom".equals(req.getDataScope())) {
                    List<String> deptIds = req.getDeptIds();
                    if (deptIds == null || deptIds.isEmpty()) {
                        throw new BusinessException(400, "dept_ids cannot be empty when data_scope is custom");
                    }
                    for (String deptId : deptIds) {
                        roleMapper.insertRoleDept(id, deptId);
                    }
                }
            });
            return null;
        });
    }

    public Mono<PageResponse<UserLiteDTO>> users(String id, RoleUserListQuery query, String currentUserId) {
        return executor.call(() -> {
            dataScopeResolver.apply(query, currentUserId);
            List<UserLiteDTO> list = roleMapper.selectUsersByRoleId(id, query);
            long total = roleMapper.countUsersByRoleIdWithKeyword(id, query);
            return new PageResponse<>(list, total, query.getPage(), query.getPageSize());
        });
    }

    public Mono<Void> assignUsers(String id, RoleUserAssignRequest req) {
        return executor.call(() -> {
            transactionTemplate.executeWithoutResult(status -> {
                ensureMutableRole(id);
                for (String userId : req.getUserIds()) {
                    roleMapper.insertUserRole(userId, id);
                }
            });
            return null;
        });
    }

    public Mono<Void> removeUsers(String id, RoleUserAssignRequest req) {
        return executor.call(() -> {
            transactionTemplate.executeWithoutResult(status -> {
                ensureMutableRole(id);
                for (String userId : req.getUserIds()) {
                    roleMapper.deleteUserRole(userId, id);
                }
            });
            return null;
        });
    }

    private RoleDTO toDto(RoleDO role) {
        List<String> menuIds = roleMapper.selectMenuIds(role.getId());
        return toDto(role, menuIds);
    }

    private RoleDTO toDto(RoleDO role, List<String> menuIds) {
        return new RoleDTO(role.getId(), role.getCode(), role.getName(), role.getStatus(), role.getDataScope(),
                menuIds == null ? Collections.emptyList() : menuIds);
    }

    private Map<String, List<String>> loadMenuIdsByRoleIds(List<RoleDO> roles) {
        if (roles == null || roles.isEmpty()) {
            return Map.of();
        }
        List<String> roleIds = roles.stream().map(RoleDO::getId).toList();
        List<Map<String, Object>> rows = roleMapper.selectMenuBindingsByRoleIds(roleIds);
        if (rows == null || rows.isEmpty()) {
            return Map.of();
        }

        Map<String, List<String>> result = new HashMap<>();
        for (Map<String, Object> row : rows) {
            String roleId = toStringValue(row.get("roleId"));
            String menuId = toStringValue(row.get("menuId"));
            if (roleId == null || menuId == null) {
                continue;
            }
            result.computeIfAbsent(roleId, ignored -> new ArrayList<>()).add(menuId);
        }
        return result;
    }

    private String toStringValue(Object value) {
        if (value == null) {
            return null;
        }
        String text = String.valueOf(value).trim();
        return text.isEmpty() ? null : text;
    }

    private void validateCode(String code, String excludeId) {
        if (roleMapper.existsByCode(code, excludeId) > 0) {
            throw new BusinessException(409, "role code already exists");
        }
    }

    private void replaceMenus(String roleId, List<String> menuIds) {
        roleMapper.deleteRoleMenus(roleId);
        if (menuIds == null || menuIds.isEmpty()) {
            return;
        }
        for (String menuId : menuIds) {
            roleMapper.insertRoleMenu(roleId, menuId);
        }
    }

    private void deleteSync(String id) {
        RoleDO role = roleMapper.selectById(id);
        if (role == null) {
            return;
        }
        if ("admin".equals(role.getCode())) {
            throw new BusinessException(400, "built-in admin role cannot be deleted");
        }
        if (roleMapper.countUsersByRoleId(id) > 0) {
            throw new BusinessException(409, "role has bound users");
        }
        roleMapper.deleteRoleMenus(id);
        roleMapper.deleteRoleDepts(id);
        roleMapper.deleteById(id);
    }

    private void ensureMutableRole(String id) {
        RoleDO role = roleMapper.selectById(id);
        if (role == null) {
            throw new BusinessException(404, "role not found");
        }
        if ("admin".equals(role.getCode())) {
            throw new BusinessException(400, "built-in admin role cannot be modified");
        }
    }
}
