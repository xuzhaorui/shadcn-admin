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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
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
            DepartmentDO department = new DepartmentDO();
            department.setId(UUID.randomUUID().toString());
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
            departmentMapper.deleteById(id);
            return null;
        });
    }

    public Mono<Void> reorder(DepartmentReorderRequest req) {
        return executor.call(() -> {
            transactionTemplate.executeWithoutResult(status -> {
                int count = departmentMapper.countByParentAndIds(req.getParentId(), req.getOrderedIds());
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
        department.setParentId(req.getParentId());
        department.setName(req.getName());
        department.setCode(req.getCode());
        department.setSort(req.getSort() == null ? 0 : req.getSort());
        department.setStatus(req.getStatus());
    }

    private void validateCode(String code, String excludeId) {
        if (departmentMapper.existsByCode(code, excludeId) > 0) {
            throw new BusinessException(409, "department code already exists");
        }
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
        return buildChildren("0", byParent);
    }

    private List<DepartmentDTO> buildChildren(String parentId, Map<String, List<DepartmentDO>> byParent) {
        List<DepartmentDO> children = byParent.getOrDefault(parentId, List.of());
        List<DepartmentDTO> result = new ArrayList<>();
        for (DepartmentDO child : children) {
            result.add(toDto(child, buildChildren(child.getId(), byParent)));
        }
        return result;
    }

    private DepartmentDTO toDto(DepartmentDO department, List<DepartmentDTO> children) {
        return new DepartmentDTO(department.getId(), department.getParentId(), department.getName(), department.getCode(),
                department.getSort(), department.getStatus(), children);
    }
}
