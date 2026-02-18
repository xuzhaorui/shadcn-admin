package com.shadcn.admin.backend.modules.system.menus.controller;

import com.shadcn.admin.backend.common.api.ApiResponse;
import com.shadcn.admin.backend.modules.system.menus.dto.MenuDTO;
import com.shadcn.admin.backend.modules.system.menus.dto.MenuReorderRequest;
import com.shadcn.admin.backend.modules.system.menus.dto.MenuUpsertRequest;
import com.shadcn.admin.backend.modules.system.menus.service.MenuService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/system/menus")
public class MenuController {
    private final MenuService menuService;

    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    @GetMapping("/tree")
    public Mono<ApiResponse<List<MenuDTO>>> tree() {
        return menuService.tree().map(ApiResponse::success);
    }

    @GetMapping("/{id}")
    public Mono<ApiResponse<MenuDTO>> detail(@PathVariable String id) {
        return menuService.detail(id).map(ApiResponse::success);
    }

    @PostMapping
    public Mono<ApiResponse<Map<String, String>>> create(@Valid @RequestBody MenuUpsertRequest req) {
        return menuService.create(req).map(id -> ApiResponse.success(Map.of("id", id)));
    }

    @PutMapping("/{id}")
    public Mono<ApiResponse<Void>> update(@PathVariable String id, @Valid @RequestBody MenuUpsertRequest req) {
        return menuService.update(id, req).thenReturn(ApiResponse.success());
    }

    @DeleteMapping("/{id}")
    public Mono<ApiResponse<Void>> delete(@PathVariable String id) {
        return menuService.delete(id).thenReturn(ApiResponse.success());
    }

    @PostMapping("/reorder")
    public Mono<ApiResponse<Void>> reorder(@Valid @RequestBody MenuReorderRequest req) {
        return menuService.reorder(req).thenReturn(ApiResponse.success());
    }
}
