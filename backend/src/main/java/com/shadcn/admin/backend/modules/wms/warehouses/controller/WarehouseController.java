package com.shadcn.admin.backend.modules.wms.warehouses.controller;

import com.shadcn.admin.backend.common.api.ApiResponse;
import com.shadcn.admin.backend.common.api.PageResponse;
import com.shadcn.admin.backend.modules.wms.warehouses.dto.WarehouseDTO;
import com.shadcn.admin.backend.modules.wms.warehouses.dto.WarehouseListQuery;
import com.shadcn.admin.backend.modules.wms.warehouses.dto.WarehouseUpsertRequest;
import com.shadcn.admin.backend.modules.wms.warehouses.service.WarehouseService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/wms/warehouses")
public class WarehouseController {
    private final WarehouseService warehouseService;

    public WarehouseController(WarehouseService warehouseService) {
        this.warehouseService = warehouseService;
    }

    @GetMapping("/list")
    public Mono<ApiResponse<PageResponse<WarehouseDTO>>> list(WarehouseListQuery query) {
        return warehouseService.list(query).map(ApiResponse::success);
    }

    @GetMapping("/{id}")
    public Mono<ApiResponse<WarehouseDTO>> detail(@PathVariable String id) {
        return warehouseService.detail(id).map(ApiResponse::success);
    }

    @PostMapping
    public Mono<ApiResponse<Map<String, String>>> create(@Valid @RequestBody WarehouseUpsertRequest request) {
        return warehouseService.create(request).map(id -> ApiResponse.success(Map.of("id", id)));
    }

    @PutMapping("/{id}")
    public Mono<ApiResponse<Void>> update(@PathVariable String id, @Valid @RequestBody WarehouseUpsertRequest request) {
        return warehouseService.update(id, request).thenReturn(ApiResponse.success());
    }
}
