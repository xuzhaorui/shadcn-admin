package com.shadcn.admin.backend.modules.monitor.jobs.service;

import com.shadcn.admin.backend.common.api.PageResponse;
import com.shadcn.admin.backend.common.exception.BusinessException;
import com.shadcn.admin.backend.infra.mybatis.BlockingMyBatisExecutor;
import com.shadcn.admin.backend.modules.monitor.jobs.domain.JobDO;
import com.shadcn.admin.backend.modules.monitor.jobs.domain.JobInvokeTarget;
import com.shadcn.admin.backend.modules.monitor.jobs.dto.JobDTO;
import com.shadcn.admin.backend.modules.monitor.jobs.dto.JobListQuery;
import com.shadcn.admin.backend.modules.monitor.jobs.dto.JobUpsertRequest;
import com.shadcn.admin.backend.modules.monitor.jobs.dto.ToggleJobStatusRequest;
import com.shadcn.admin.backend.modules.monitor.jobs.mapper.JobMapper;
import java.util.List;
import java.util.Locale;
import org.quartz.CronExpression;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class JobService {
    private final BlockingMyBatisExecutor executor;
    private final JobMapper jobMapper;
    private final QuartzJobManager quartzJobManager;
    private final InvokeTargetExecutor invokeTargetExecutor;

    public JobService(
            BlockingMyBatisExecutor executor,
            JobMapper jobMapper,
            QuartzJobManager quartzJobManager,
            InvokeTargetExecutor invokeTargetExecutor) {
        this.executor = executor;
        this.jobMapper = jobMapper;
        this.quartzJobManager = quartzJobManager;
        this.invokeTargetExecutor = invokeTargetExecutor;
    }

    public Mono<PageResponse<JobDTO>> list(JobListQuery query) {
        return executor.call(() -> {
            List<JobDO> rows = jobMapper.selectPage(query);
            long total = jobMapper.count(query);
            List<JobDTO> list = rows.stream().map(this::toDtoWithQuartzNextTime).toList();
            return new PageResponse<>(list, total, query.getPage(), query.getPageSize());
        });
    }

    public Mono<String> create(JobUpsertRequest req) {
        return executor.call(() -> {
            JobDO row = new JobDO();
            fillJob(row, req);
            jobMapper.insert(row);
            quartzJobManager.upsert(row);
            jobMapper.updateNextExecuteTime(row.getId(), quartzJobManager.nextFireTime(row.getId()));
            return row.getId();
        });
    }

    public Mono<Void> update(String id, JobUpsertRequest req) {
        return executor.call(() -> {
            JobDO existed = jobMapper.selectById(id);
            if (existed == null) {
                throw new BusinessException(404, "job not found");
            }
            fillJob(existed, req);
            existed.setId(id);
            jobMapper.update(existed);
            quartzJobManager.upsert(existed);
            jobMapper.updateNextExecuteTime(id, quartzJobManager.nextFireTime(id));
            return null;
        });
    }

    public Mono<Void> delete(String id) {
        return executor.call(() -> {
            JobDO existed = jobMapper.selectById(id);
            if (existed == null) {
                throw new BusinessException(404, "job not found");
            }
            quartzJobManager.delete(id);
            jobMapper.deleteById(id);
            return null;
        });
    }

    public Mono<Void> toggleStatus(String id, ToggleJobStatusRequest request) {
        return executor.call(() -> {
            JobDO existed = jobMapper.selectById(id);
            if (existed == null) {
                throw new BusinessException(404, "job not found");
            }
            String nextStatus = normalizeStatus(request.getStatus());
            if ("running".equals(nextStatus)) {
                quartzJobManager.upsert(existed);
                quartzJobManager.resume(id);
            } else {
                quartzJobManager.pause(id);
            }
            jobMapper.updateStatus(id, nextStatus);
            jobMapper.updateNextExecuteTime(id, quartzJobManager.nextFireTime(id));
            return null;
        });
    }

    public Mono<Void> execute(String id) {
        return executor.call(() -> {
            JobDO existed = jobMapper.selectById(id);
            if (existed == null) {
                throw new BusinessException(404, "job not found");
            }
            quartzJobManager.runOnce(existed);
            jobMapper.updateNextExecuteTime(id, quartzJobManager.nextFireTime(id));
            return null;
        });
    }

    private JobDTO toDtoWithQuartzNextTime(JobDO row) {
        var next = quartzJobManager.nextFireTime(row.getId());
        return new JobDTO(
                row.getId(),
                row.getName(),
                row.getGroup(),
                row.getInvokeTarget(),
                row.getCronExpression(),
                row.getMisfirePolicy(),
                row.isConcurrent(),
                row.getStatus(),
                row.getRemark(),
                row.getCreatedAt(),
                next != null ? next : row.getNextExecuteTime());
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            throw new BusinessException(400, "status is required");
        }
        String value = status.trim().toLowerCase(Locale.ROOT);
        if (!"running".equals(value) && !"paused".equals(value)) {
            throw new BusinessException(400, "status must be running or paused");
        }
        return value;
    }

    private String normalizeMisfirePolicy(String policy) {
        if (policy == null || policy.isBlank()) {
            return "default";
        }
        String value = policy.trim().toLowerCase(Locale.ROOT);
        return switch (value) {
            case "default" -> "default";
            case "ignore" -> "ignore";
            case "fireonce" -> "fireOnce";
            case "fireall" -> "fireAll";
            default -> throw new BusinessException(
                    400, "misfirePolicy must be one of: default, ignore, fireOnce, fireAll");
        };
    }

    private void fillJob(JobDO row, JobUpsertRequest req) {
        String cronExpression = req.getCronExpression() == null ? null : req.getCronExpression().trim();
        if (cronExpression == null || cronExpression.isBlank()) {
            throw new BusinessException(400, "cronExpression is required");
        }
        if (!CronExpression.isValidExpression(cronExpression)) {
            throw new BusinessException(400, "invalid cron expression: " + cronExpression);
        }

        row.setName(trimRequired(req.getName(), "name"));
        row.setGroup(trimRequired(req.getGroup(), "group"));
        String invokeTarget = trimRequired(req.getInvokeTarget(), "invokeTarget");
        JobInvokeTarget normalizedTarget = JobInvokeTarget.parse(invokeTarget);
        invokeTargetExecutor.validate(normalizedTarget.code());
        row.setInvokeTarget(normalizedTarget.code());
        row.setCronExpression(cronExpression);
        row.setMisfirePolicy(normalizeMisfirePolicy(req.getMisfirePolicy()));
        row.setConcurrent(Boolean.TRUE.equals(req.getConcurrent()));
        row.setStatus(normalizeStatus(req.getStatus()));
        row.setRemark(req.getRemark() == null ? null : req.getRemark().trim());
    }

    private String trimRequired(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new BusinessException(400, field + " is required");
        }
        return value.trim();
    }
}
