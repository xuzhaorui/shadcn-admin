package com.shadcn.admin.backend.modules.system.dictionaries.controller;

import com.shadcn.admin.backend.common.api.ApiResponse;
import com.shadcn.admin.backend.common.api.PageResponse;
import com.shadcn.admin.backend.modules.system.dictionaries.dto.DictItemDTO;
import com.shadcn.admin.backend.modules.system.dictionaries.dto.DictItemListQuery;
import com.shadcn.admin.backend.modules.system.dictionaries.dto.DictItemUpsertRequest;
import com.shadcn.admin.backend.modules.system.dictionaries.dto.DictTypeDTO;
import com.shadcn.admin.backend.modules.system.dictionaries.dto.DictTypeListQuery;
import com.shadcn.admin.backend.modules.system.dictionaries.dto.DictTypeUpsertRequest;
import com.shadcn.admin.backend.modules.system.dictionaries.service.DictionaryService;
import jakarta.validation.Valid;
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
@RequestMapping("/api/system/dictionaries")
public class DictionaryController {
    private final DictionaryService dictionaryService;

    public DictionaryController(DictionaryService dictionaryService) {
        this.dictionaryService = dictionaryService;
    }

    @GetMapping("/types")
    public Mono<ApiResponse<PageResponse<DictTypeDTO>>> types(DictTypeListQuery query) {
        return dictionaryService.listTypes(query).map(ApiResponse::success);
    }

    @PostMapping("/types")
    public Mono<ApiResponse<Map<String, String>>> createType(@Valid @RequestBody DictTypeUpsertRequest req) {
        return dictionaryService.createType(req).map(id -> ApiResponse.success(Map.of("id", id)));
    }

    @PutMapping("/types/{id}")
    public Mono<ApiResponse<Void>> updateType(@PathVariable String id, @Valid @RequestBody DictTypeUpsertRequest req) {
        return dictionaryService.updateType(id, req).thenReturn(ApiResponse.success());
    }

    @DeleteMapping("/types/{id}")
    public Mono<ApiResponse<Void>> deleteType(@PathVariable String id) {
        return dictionaryService.deleteType(id).thenReturn(ApiResponse.success());
    }

    @GetMapping("/items")
    public Mono<ApiResponse<PageResponse<DictItemDTO>>> items(DictItemListQuery query) {
        return dictionaryService.listItems(query).map(ApiResponse::success);
    }

    @PostMapping("/items")
    public Mono<ApiResponse<Map<String, String>>> createItem(@Valid @RequestBody DictItemUpsertRequest req) {
        return dictionaryService.createItem(req).map(id -> ApiResponse.success(Map.of("id", id)));
    }

    @PutMapping("/items/{id}")
    public Mono<ApiResponse<Void>> updateItem(@PathVariable String id, @Valid @RequestBody DictItemUpsertRequest req) {
        return dictionaryService.updateItem(id, req).thenReturn(ApiResponse.success());
    }

    @DeleteMapping("/items/{id}")
    public Mono<ApiResponse<Void>> deleteItem(@PathVariable String id) {
        return dictionaryService.deleteItem(id).thenReturn(ApiResponse.success());
    }

    @PostMapping("/cache/refresh")
    public Mono<ApiResponse<String>> refreshCache() {
        return dictionaryService.refreshCache().map(ApiResponse::success);
    }
}
