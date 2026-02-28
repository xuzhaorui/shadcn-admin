package com.shadcn.admin.backend.modules.system.menus.service;

import com.shadcn.admin.backend.common.exception.BusinessException;
import com.shadcn.admin.backend.infra.mybatis.BlockingMyBatisExecutor;
import com.shadcn.admin.backend.modules.system.menus.domain.MenuDO;
import com.shadcn.admin.backend.modules.system.menus.dto.MenuDTO;
import com.shadcn.admin.backend.modules.system.menus.dto.MenuReorderRequest;
import com.shadcn.admin.backend.modules.system.menus.dto.MenuUpsertRequest;
import com.shadcn.admin.backend.modules.system.menus.mapper.MenuMapper;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import reactor.core.publisher.Mono;

@Service
public class MenuService {
    private final BlockingMyBatisExecutor executor;
    private final MenuMapper menuMapper;
    private final TransactionTemplate transactionTemplate;

    public MenuService(BlockingMyBatisExecutor executor, MenuMapper menuMapper, TransactionTemplate transactionTemplate) {
        this.executor = executor;
        this.menuMapper = menuMapper;
        this.transactionTemplate = transactionTemplate;
    }

    public Mono<List<MenuDTO>> tree() {
        return executor.call(() -> buildTree(menuMapper.selectAll()));
    }

    public Mono<MenuDTO> detail(String id) {
        return executor.call(() -> {
            MenuDO menu = menuMapper.selectById(id);
            if (menu == null) {
                throw new BusinessException(404, "menu not found");
            }
            return toDto(menu, List.of());
        });
    }

    public Mono<String> create(MenuUpsertRequest req) {
        return executor.call(() -> {
            validateMenu(req, null);
            MenuDO menu = new MenuDO();
            fill(menu, req);
            menu.setVersion(0L);
            menuMapper.insert(menu);
            return menu.getId();
        });
    }

    public Mono<Void> update(String id, MenuUpsertRequest req) {
        return executor.call(() -> {
            MenuDO menu = menuMapper.selectById(id);
            if (menu == null) {
                throw new BusinessException(404, "menu not found");
            }
            validateMenu(req, id);
            fill(menu, req);
            menuMapper.update(menu);
            return null;
        });
    }

    public Mono<Void> delete(String id) {
        return executor.call(() -> {
            if (menuMapper.countChildren(id) > 0) {
                throw new BusinessException(400, "cannot delete menu with children");
            }
            if (menuMapper.countRoleBindings(id) > 0) {
                throw new BusinessException(400, "cannot delete menu bound by roles");
            }
            menuMapper.deleteById(id);
            return null;
        });
    }

    public Mono<Void> reorder(MenuReorderRequest req) {
        return executor.call(() -> {
            transactionTemplate.executeWithoutResult(status -> {
                String normalizedParentId = normalizeParentId(req.getParentId());
                int count = menuMapper.countByParentAndIds(normalizedParentId, req.getOrderedIds());
                if (count != req.getOrderedIds().size()) {
                    throw new BusinessException(400, "reorder only supports same-level nodes");
                }
                for (int i = 0; i < req.getOrderedIds().size(); i++) {
                    menuMapper.updateSort(req.getOrderedIds().get(i), i);
                }
            });
            return null;
        });
    }

    private void fill(MenuDO menu, MenuUpsertRequest req) {
        menu.setParentId(normalizeParentId(req.getParentId()));
        menu.setType(req.getType());
        menu.setName(req.getName());
        menu.setCode(req.getCode());
        menu.setPath(req.getPath());
        menu.setIcon(req.getIcon());
        menu.setSort(req.getSort() == null ? 0 : req.getSort());
        menu.setVisible(req.getVisible());
        menu.setStatus(req.getStatus());
    }

    private void validateMenu(MenuUpsertRequest req, String excludeId) {
        if (menuMapper.existsByCode(req.getCode(), excludeId) > 0) {
            throw new BusinessException(409, "menu code already exists");
        }
        validateParent(req.getParentId(), excludeId);
        if (("directory".equals(req.getType()) || "menu".equals(req.getType()))
                && (req.getPath() == null || req.getPath().isBlank())) {
            throw new BusinessException(400, "path is required for directory/menu");
        }
    }

    private void validateParent(String parentId, String currentId) {
        String normalizedParentId = normalizeParentId(parentId);
        if (normalizedParentId == null) {
            return;
        }
        if (currentId != null && currentId.equals(normalizedParentId)) {
            throw new BusinessException(400, "menu parent cannot be self");
        }

        MenuDO parent = menuMapper.selectById(normalizedParentId);
        if (parent == null) {
            throw new BusinessException(400, "parent menu not found");
        }
        if (currentId == null) {
            return;
        }

        Set<String> visited = new HashSet<>();
        String cursor = normalizedParentId;
        while (cursor != null) {
            if (!visited.add(cursor)) {
                throw new BusinessException(400, "menu parent cycle detected");
            }
            if (currentId.equals(cursor)) {
                throw new BusinessException(400, "menu parent cannot be current menu descendant");
            }
            MenuDO node = menuMapper.selectById(cursor);
            if (node == null) {
                return;
            }
            cursor = normalizeParentId(node.getParentId());
        }
    }

    private String normalizeParentId(String parentId) {
        if (parentId == null || parentId.isBlank() || "0".equals(parentId)) {
            return null;
        }
        return parentId;
    }

    private List<MenuDTO> buildTree(List<MenuDO> flat) {
        Map<String, List<MenuDO>> byParent = new HashMap<>();
        for (MenuDO menu : flat) {
            String parentId = menu.getParentId() == null ? "0" : menu.getParentId();
            byParent.computeIfAbsent(parentId, k -> new ArrayList<>()).add(menu);
        }
        for (List<MenuDO> value : byParent.values()) {
            value.sort(Comparator.comparing(MenuDO::getSort));
        }
        return buildChildren("0", byParent, new HashSet<>());
    }

    private List<MenuDTO> buildChildren(String parentId, Map<String, List<MenuDO>> byParent, Set<String> path) {
        List<MenuDO> children = byParent.getOrDefault(parentId, List.of());
        List<MenuDTO> result = new ArrayList<>();
        for (MenuDO child : children) {
            if (path.contains(child.getId())) {
                throw new BusinessException(500, "menu tree contains cycle");
            }
            Set<String> nextPath = new HashSet<>(path);
            nextPath.add(child.getId());
            result.add(toDto(child, buildChildren(child.getId(), byParent, nextPath)));
        }
        return result;
    }

    private MenuDTO toDto(MenuDO menu, List<MenuDTO> children) {
        return new MenuDTO(menu.getId(), menu.getParentId(), menu.getType(), menu.getName(), menu.getCode(),
                menu.getPath(), menu.getIcon(), menu.getSort(), menu.getVisible(), menu.getStatus(), children);
    }
}
