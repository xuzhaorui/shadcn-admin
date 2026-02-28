package com.shadcn.admin.backend.modules.monitor.jobs.controller;

import com.shadcn.admin.backend.common.api.ApiResponse;
import com.shadcn.admin.backend.common.api.PageResponse;
import com.shadcn.admin.backend.modules.monitor.jobs.dto.JobDTO;
import com.shadcn.admin.backend.modules.monitor.jobs.dto.JobListQuery;
import com.shadcn.admin.backend.modules.monitor.jobs.dto.JobUpsertRequest;
import com.shadcn.admin.backend.modules.monitor.jobs.dto.ToggleJobStatusRequest;
import com.shadcn.admin.backend.modules.monitor.jobs.service.JobService;
import jakarta.validation.Valid;
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
@RequestMapping("/api/monitor/jobs")
public class JobController {
    private final JobService jobService;

    public JobController(JobService jobService) {
        this.jobService = jobService;
    }

    @GetMapping("/list")
    public Mono<ApiResponse<PageResponse<JobDTO>>> list(JobListQuery query) {
        return jobService.list(query).map(ApiResponse::success);
    }

    @PostMapping
    public Mono<ApiResponse<Map<String, String>>> create(@Valid @RequestBody JobUpsertRequest request) {
        return jobService.create(request).map(id -> ApiResponse.success(Map.of("id", id)));
    }

    @PutMapping("/{id}")
    public Mono<ApiResponse<Void>> update(@PathVariable String id, @Valid @RequestBody JobUpsertRequest request) {
        return jobService.update(id, request).thenReturn(ApiResponse.success());
    }

    @DeleteMapping("/{id}")
    public Mono<ApiResponse<Void>> delete(@PathVariable String id) {
        return jobService.delete(id).thenReturn(ApiResponse.success());
    }

    @PatchMapping("/{id}/status")
    public Mono<ApiResponse<Void>> toggleStatus(
            @PathVariable String id, @Valid @RequestBody ToggleJobStatusRequest request) {
        return jobService.toggleStatus(id, request).thenReturn(ApiResponse.success());
    }

    @PostMapping("/{id}/execute")
    public Mono<ApiResponse<Void>> execute(@PathVariable String id) {
        return jobService.execute(id).thenReturn(ApiResponse.success());
    }
}
