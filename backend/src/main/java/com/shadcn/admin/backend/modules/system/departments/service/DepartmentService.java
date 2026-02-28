package com.shadcn.admin.backend.modules.system.departments.service;

import com.shadcn.admin.backend.common.exception.BusinessException;
import com.shadcn.admin.backend.infra.mybatis.BlockingMyBatisExecutor;
import com.shadcn.admin.backend.modules.system.departments.domain.DepartmentDO;
import com.shadcn.admin.backend.modules.system.departments.dto.DepartmentDTO;
import com.shadcn.admin.backend.modules.system.departments.dto.DepartmentReorderRequest;
import com.shadcn.admin.backend.modules.system.departments.dto.DepartmentUpsertRequest;
import com.shadcn.admin.backend.modules.system.departments.dto.ToggleDepartmentStatusRequest;
import com.shadcn.admin.backend.modules.system.departments.mapper.DepartmentMapper;
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
public class DepartmentService {
    private final BlockingMyBatisExecutor executor;
    private final DepartmentMapper departmentMapper;
    private final TransactionTemplate transactionTemplate;

    public DepartmentService(
            BlockingMyBatisExecutor executor, DepartmentMapper departmentMapper, TransactionTemplate transactionTemplate) {
        this.executor = executor;
        this.departmentMapper = departmentMapper;
        this.transactionTemplate = transactionTemplate;
    }

    public Mono<List<DepartmentDTO>> tree() {
        return executor.call(() -> buildTree(departmentMapper.selectAll()));
    }

    public Mono<DepartmentDTO> detail(String id) {
        return executor.call(() -> {
            DepartmentDO department = departmentMapper.selectById(id);
            if (department == null) {
                throw new BusinessException(404, "department not found");
            }
            return toDto(department, List.of());
        });
    }

    public Mono<String> create(DepartmentUpsertRequest req) {
        return executor.call(() -> {
            validateCode(req.getCode(), null);
            validateParent(req.getParentId(), null);
            DepartmentDO department = new DepartmentDO();
            fill(department, req);
            department.setVersion(0L);
            departmentMapper.insert(department);
            return department.getId();
        });
    }

    public Mono<Void> update(String id, DepartmentUpsertRequest req) {
        return executor.call(() -> {
            DepartmentDO department = departmentMapper.selectById(id);
            if (department == null) {
                throw new BusinessException(404, "department not found");
            }
            validateCode(req.getCode(), id);
            validateParent(req.getParentId(), id);
            fill(department, req);
            departmentMapper.update(department);
            return null;
        });
    }

    public Mono<Void> delete(String id) {
        return executor.call(() -> {
            if (departmentMapper.countChildren(id) > 0) {
                throw new BusinessException(400, "cannot delete department with children");
            }
            if (departmentMapper.countUsers(id) > 0) {
                throw new BusinessException(400, "cannot delete department bound by users");
            }
            if (departmentMapper.countRoleBindings(id) > 0) {
                throw new BusinessException(400, "cannot delete department bound by role data scope");
            }
            departmentMapper.deleteById(id);
            return null;
        });
    }

    public Mono<Void> reorder(DepartmentReorderRequest req) {
        return executor.call(() -> {
            transactionTemplate.executeWithoutResult(status -> {
                String normalizedParentId = normalizeParentId(req.getParentId());
                int count = departmentMapper.countByParentAndIds(normalizedParentId, req.getOrderedIds());
                if (count != req.getOrderedIds().size()) {
                    throw new BusinessException(400, "reorder only supports same-level nodes");
                }
                for (int i = 0; i < req.getOrderedIds().size(); i++) {
                    departmentMapper.updateSort(req.getOrderedIds().get(i), i);
                }
            });
            return null;
        });
    }

    public Mono<Void> toggleStatus(String id, ToggleDepartmentStatusRequest req) {
        return executor.call(() -> {
            departmentMapper.updateStatus(id, req.getStatus());
            return null;
        });
    }

    private void fill(DepartmentDO department, DepartmentUpsertRequest req) {
        department.setParentId(normalizeParentId(req.getParentId()));
        department.setName(req.getName());
        department.setCode(req.getCode());
        department.setSort(req.getSort() == null ? 0 : req.getSort());
        department.setStatus(normalizeStatus(req.getStatus()));
    }

    private void validateCode(String code, String excludeId) {
        if (departmentMapper.existsByCode(code, excludeId) > 0) {
            throw new BusinessException(409, "department code already exists");
        }
    }

    private void validateParent(String parentId, String currentId) {
        String normalizedParentId = normalizeParentId(parentId);
        if (normalizedParentId == null) {
            return;
        }
        if (currentId != null && currentId.equals(normalizedParentId)) {
            throw new BusinessException(400, "department parent cannot be self");
        }

        DepartmentDO parent = departmentMapper.selectById(normalizedParentId);
        if (parent == null) {
            throw new BusinessException(400, "parent department not found");
        }
        if (currentId == null) {
            return;
        }

        Set<String> visited = new HashSet<>();
        String cursor = normalizedParentId;
        while (cursor != null) {
            if (!visited.add(cursor)) {
                throw new BusinessException(400, "department parent cycle detected");
            }
            if (currentId.equals(cursor)) {
                throw new BusinessException(400, "department parent cannot be current department descendant");
            }
            DepartmentDO node = departmentMapper.selectById(cursor);
            if (node == null) {
                return;
            }
            cursor = normalizeParentId(node.getParentId());
        }
    }

    private String normalizeParentId(String parentId) {
        if (isBlank(parentId) || "0".equals(parentId)) {
            return null;
        }
        return parentId;
    }

    private String normalizeStatus(String status) {
        if (isBlank(status)) {
            return "enabled";
        }
        if ("active".equalsIgnoreCase(status)) {
            return "enabled";
        }
        if ("inactive".equalsIgnoreCase(status)) {
            return "disabled";
        }
        return status;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private List<DepartmentDTO> buildTree(List<DepartmentDO> flat) {
        Map<String, List<DepartmentDO>> byParent = new HashMap<>();
        for (DepartmentDO department : flat) {
            String parentId = department.getParentId() == null ? "0" : department.getParentId();
            byParent.computeIfAbsent(parentId, k -> new ArrayList<>()).add(department);
        }
        for (List<DepartmentDO> value : byParent.values()) {
            value.sort(Comparator.comparing(DepartmentDO::getSort));
        }
        return buildChildren("0", byParent, new HashSet<>());
    }

    private List<DepartmentDTO> buildChildren(
            String parentId, Map<String, List<DepartmentDO>> byParent, Set<String> path) {
        List<DepartmentDO> children = byParent.getOrDefault(parentId, List.of());
        List<DepartmentDTO> result = new ArrayList<>();
        for (DepartmentDO child : children) {
            if (path.contains(child.getId())) {
                throw new BusinessException(500, "department tree contains cycle");
            }
            Set<String> nextPath = new HashSet<>(path);
            nextPath.add(child.getId());
            result.add(toDto(child, buildChildren(child.getId(), byParent, nextPath)));
        }
        return result;
    }

    private DepartmentDTO toDto(DepartmentDO department, List<DepartmentDTO> children) {
        return new DepartmentDTO(department.getId(), department.getParentId(), department.getName(), department.getCode(),
                department.getSort(), department.getStatus(), children);
    }
}
