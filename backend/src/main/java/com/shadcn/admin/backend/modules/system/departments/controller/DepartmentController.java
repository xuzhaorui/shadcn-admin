package com.shadcn.admin.backend.modules.system.departments.controller;

import com.shadcn.admin.backend.common.api.ApiResponse;
import com.shadcn.admin.backend.modules.system.departments.dto.DepartmentDTO;
import com.shadcn.admin.backend.modules.system.departments.dto.DepartmentReorderRequest;
import com.shadcn.admin.backend.modules.system.departments.dto.DepartmentUpsertRequest;
import com.shadcn.admin.backend.modules.system.departments.dto.ToggleDepartmentStatusRequest;
import com.shadcn.admin.backend.modules.system.departments.service.DepartmentService;
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
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/system/departments")
public class DepartmentController {
    private final DepartmentService departmentService;

    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    @GetMapping("/tree")
    public Mono<ApiResponse<List<DepartmentDTO>>> tree() {
        return departmentService.tree().map(ApiResponse::success);
    }

    @GetMapping("/{id}")
    public Mono<ApiResponse<DepartmentDTO>> detail(@PathVariable String id) {
        return departmentService.detail(id).map(ApiResponse::success);
    }

    @PostMapping
    public Mono<ApiResponse<Map<String, String>>> create(@Valid @RequestBody DepartmentUpsertRequest req) {
        return departmentService.create(req).map(id -> ApiResponse.success(Map.of("id", id)));
    }

    @PutMapping("/{id}")
    public Mono<ApiResponse<Void>> update(@PathVariable String id, @Valid @RequestBody DepartmentUpsertRequest req) {
        return departmentService.update(id, req).thenReturn(ApiResponse.success());
    }

    @DeleteMapping("/{id}")
    public Mono<ApiResponse<Void>> delete(@PathVariable String id) {
        return departmentService.delete(id).thenReturn(ApiResponse.success());
    }

    @PostMapping("/reorder")
    public Mono<ApiResponse<Void>> reorder(@Valid @RequestBody DepartmentReorderRequest req) {
        return departmentService.reorder(req).thenReturn(ApiResponse.success());
    }

    @PatchMapping("/{id}/status")
    public Mono<ApiResponse<Void>> toggleStatus(
            @PathVariable String id, @Valid @RequestBody ToggleDepartmentStatusRequest req) {
        return departmentService.toggleStatus(id, req).thenReturn(ApiResponse.success());
    }
}
