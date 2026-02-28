package com.shadcn.admin.backend.modules.monitor.jobs.service;

import com.shadcn.admin.backend.modules.monitor.jobs.mapper.JobMapper;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class JobRuntimeService {
    private static final Logger log = LoggerFactory.getLogger(JobRuntimeService.class);

    private final JobMapper jobMapper;
    private final InvokeTargetExecutor invokeTargetExecutor;

    public JobRuntimeService(JobMapper jobMapper, InvokeTargetExecutor invokeTargetExecutor) {
        this.jobMapper = jobMapper;
        this.invokeTargetExecutor = invokeTargetExecutor;
    }

    public void execute(String jobId, String invokeTarget, Date fireTime, Date nextFireTime) {
        log.info("quartz executing job: id={}, invokeTarget={}", jobId, invokeTarget);
        dispatchInvokeTarget(jobId, invokeTarget);
        LocalDateTime last = toLocalDateTime(fireTime);
        LocalDateTime next = toLocalDateTime(nextFireTime);
        jobMapper.updateExecutionTime(jobId, last, next);
    }

    private void dispatchInvokeTarget(String jobId, String invokeTarget) {
        invokeTargetExecutor.execute(invokeTarget);
        log.info("quartz invokeTarget executed: id={}, invokeTarget={}", jobId, invokeTarget);
    }

    private LocalDateTime toLocalDateTime(Date value) {
        if (value == null) {
            return null;
        }
        return LocalDateTime.ofInstant(Instant.ofEpochMilli(value.getTime()), ZoneId.systemDefault());
    }
}
