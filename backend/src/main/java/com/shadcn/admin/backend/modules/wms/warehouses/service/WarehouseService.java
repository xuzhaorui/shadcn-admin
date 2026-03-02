package com.shadcn.admin.backend.modules.wms.warehouses.service;

import com.shadcn.admin.backend.common.api.PageResponse;
import com.shadcn.admin.backend.common.exception.BusinessException;
import com.shadcn.admin.backend.infra.mybatis.BlockingMyBatisExecutor;
import com.shadcn.admin.backend.modules.wms.warehouses.domain.WarehouseDO;
import com.shadcn.admin.backend.modules.wms.warehouses.dto.WarehouseDTO;
import com.shadcn.admin.backend.modules.wms.warehouses.dto.WarehouseListQuery;
import com.shadcn.admin.backend.modules.wms.warehouses.dto.WarehouseUpsertRequest;
import com.shadcn.admin.backend.modules.wms.warehouses.mapper.WarehouseMapper;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class WarehouseService {
    private final BlockingMyBatisExecutor executor;
    private final WarehouseMapper warehouseMapper;

    public WarehouseService(BlockingMyBatisExecutor executor, WarehouseMapper warehouseMapper) {
        this.executor = executor;
        this.warehouseMapper = warehouseMapper;
    }

    public Mono<PageResponse<WarehouseDTO>> list(WarehouseListQuery query) {
        return executor.call(() -> {
            List<WarehouseDO> rows = warehouseMapper.selectPage(query);
            long total = warehouseMapper.count(query);
            List<WarehouseDTO> list = rows.stream().map(this::toDto).toList();
            return new PageResponse<>(list, total, query.getPage(), query.getPageSize());
        });
    }

    public Mono<WarehouseDTO> detail(String id) {
        return executor.call(() -> {
            WarehouseDO row = warehouseMapper.selectById(id);
            if (row == null) {
                throw new BusinessException(404, "warehouse not found");
            }
            return toDto(row);
        });
    }

    public Mono<String> create(WarehouseUpsertRequest request) {
        return executor.call(() -> {
            WarehouseDO row = new WarehouseDO();
            fillWarehouse(row, request, null);
            warehouseMapper.insert(row);
            return row.getId();
        });
    }

    public Mono<Void> update(String id, WarehouseUpsertRequest request) {
        return executor.call(() -> {
            WarehouseDO existed = warehouseMapper.selectById(id);
            if (existed == null) {
                throw new BusinessException(404, "warehouse not found");
            }
            fillWarehouse(existed, request, id);
            existed.setId(id);
            warehouseMapper.update(existed);
            return null;
        });
    }

    private WarehouseDTO toDto(WarehouseDO row) {
        return new WarehouseDTO(
                row.getId(), row.getName(), row.getDescription(), row.getStatus(), row.getCreatedAt(), row.getUpdatedAt());
    }

    private void fillWarehouse(WarehouseDO row, WarehouseUpsertRequest request, String excludeId) {
        String name = trimRequired(request.getName(), "name");
        if (warehouseMapper.existsByName(name, excludeId) > 0) {
            throw new BusinessException(409, "warehouse name already exists");
        }
        row.setName(name);
        row.setDescription(trimToNull(request.getDescription()));
        row.setStatus(normalizeStatus(request.getStatus()));
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            throw new BusinessException(400, "status is required");
        }
        String value = status.trim().toLowerCase(Locale.ROOT);
        if ("enabled".equals(value) || "active".equals(value)) {
            return "enabled";
        }
        if ("disabled".equals(value) || "inactive".equals(value)) {
            return "disabled";
        }
        throw new BusinessException(400, "status must be enabled/disabled");
    }

    private String trimRequired(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new BusinessException(400, field + " is required");
        }
        return value.trim();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
