package com.shadcn.admin.backend.modules.monitor.jobs.service;

import com.shadcn.admin.backend.common.exception.BusinessException;
import com.shadcn.admin.backend.modules.monitor.jobs.domain.JobDO;
import com.shadcn.admin.backend.modules.monitor.jobs.quartz.ConcurrentDispatchJob;
import com.shadcn.admin.backend.modules.monitor.jobs.quartz.NonConcurrentDispatchJob;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import org.quartz.CronScheduleBuilder;
import org.quartz.CronTrigger;
import org.quartz.JobBuilder;
import org.quartz.JobDetail;
import org.quartz.JobKey;
import org.quartz.Scheduler;
import org.quartz.SchedulerException;
import org.quartz.TriggerBuilder;
import org.quartz.TriggerKey;
import org.springframework.stereotype.Component;

@Component
public class QuartzJobManager {
    private final Scheduler scheduler;

    public QuartzJobManager(Scheduler scheduler) {
        this.scheduler = scheduler;
    }

    public void syncAll(List<JobDO> jobs) {
        for (JobDO job : jobs) {
            upsert(job);
        }
    }

    public void upsert(JobDO job) {
        try {
            JobKey jobKey = jobKey(job.getId());
            TriggerKey triggerKey = triggerKey(job.getId());

            if (scheduler.checkExists(jobKey)) {
                scheduler.deleteJob(jobKey);
            }

            JobDetail detail = JobBuilder.newJob(jobClass(job))
                    .withIdentity(jobKey)
                    .usingJobData("jobId", job.getId())
                    .usingJobData("invokeTarget", job.getInvokeTarget())
                    .build();

            CronScheduleBuilder schedule = cronSchedule(job.getCronExpression(), job.getMisfirePolicy());
            CronTrigger trigger = TriggerBuilder.newTrigger()
                    .withIdentity(triggerKey)
                    .forJob(detail)
                    .withSchedule(schedule)
                    .build();

            scheduler.scheduleJob(detail, trigger);
            if ("paused".equalsIgnoreCase(job.getStatus())) {
                scheduler.pauseJob(jobKey);
            } else {
                scheduler.resumeJob(jobKey);
            }
        } catch (SchedulerException ex) {
            throw new BusinessException(500, "failed to sync quartz job: " + ex.getMessage());
        }
    }

    public void pause(String id) {
        try {
            scheduler.pauseJob(jobKey(id));
        } catch (SchedulerException ex) {
            throw new BusinessException(500, "failed to pause job: " + ex.getMessage());
        }
    }

    public void resume(String id) {
        try {
            scheduler.resumeJob(jobKey(id));
        } catch (SchedulerException ex) {
            throw new BusinessException(500, "failed to resume job: " + ex.getMessage());
        }
    }

    public void triggerNow(String id) {
        try {
            scheduler.triggerJob(jobKey(id));
        } catch (SchedulerException ex) {
            throw new BusinessException(500, "failed to execute job now: " + ex.getMessage());
        }
    }

    public void delete(String id) {
        try {
            JobKey key = jobKey(id);
            if (scheduler.checkExists(key)) {
                scheduler.deleteJob(key);
            }
        } catch (SchedulerException ex) {
            throw new BusinessException(500, "failed to delete job: " + ex.getMessage());
        }
    }

    public void runOnce(JobDO job) {
        try {
            String uid = UUID.randomUUID().toString();
            JobDetail detail = JobBuilder.newJob(jobClass(job))
                    .withIdentity(JobKey.jobKey("manual:" + job.getId() + ":" + uid, "monitor-manual"))
                    .usingJobData("jobId", job.getId())
                    .usingJobData("invokeTarget", job.getInvokeTarget())
                    .build();
            var trigger = TriggerBuilder.newTrigger()
                    .withIdentity(TriggerKey.triggerKey("manual-trigger:" + job.getId() + ":" + uid, "monitor-manual"))
                    .forJob(detail)
                    .startNow()
                    .build();
            scheduler.scheduleJob(detail, trigger);
        } catch (SchedulerException ex) {
            throw new BusinessException(500, "failed to execute job now: " + ex.getMessage());
        }
    }

    public LocalDateTime nextFireTime(String id) {
        try {
            var trigger = scheduler.getTrigger(triggerKey(id));
            Date next = trigger == null ? null : trigger.getNextFireTime();
            return toLocalDateTime(next);
        } catch (SchedulerException ex) {
            throw new BusinessException(500, "failed to query next fire time: " + ex.getMessage());
        }
    }

    private Class<? extends org.quartz.Job> jobClass(JobDO job) {
        return job.isConcurrent() ? ConcurrentDispatchJob.class : NonConcurrentDispatchJob.class;
    }

    private CronScheduleBuilder cronSchedule(String cronExpression, String misfirePolicy) {
        try {
            CronScheduleBuilder builder = CronScheduleBuilder.cronSchedule(cronExpression);
            String policy = misfirePolicy == null ? "default" : misfirePolicy.trim().toLowerCase();
            return switch (policy) {
                case "ignore", "fireall" -> builder.withMisfireHandlingInstructionIgnoreMisfires();
                case "fireonce" -> builder.withMisfireHandlingInstructionFireAndProceed();
                default -> builder.withMisfireHandlingInstructionDoNothing();
            };
        } catch (RuntimeException ex) {
            throw new BusinessException(400, "invalid cron expression: " + cronExpression);
        }
    }

    private JobKey jobKey(String id) {
        return JobKey.jobKey("job:" + id, "monitor");
    }

    private TriggerKey triggerKey(String id) {
        return TriggerKey.triggerKey("trigger:" + id, "monitor");
    }

    private LocalDateTime toLocalDateTime(Date value) {
        if (value == null) {
            return null;
        }
        return LocalDateTime.ofInstant(Instant.ofEpochMilli(value.getTime()), ZoneId.systemDefault());
    }
}
