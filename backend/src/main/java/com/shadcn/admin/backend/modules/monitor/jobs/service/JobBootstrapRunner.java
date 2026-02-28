package com.shadcn.admin.backend.modules.monitor.jobs.service;

import com.shadcn.admin.backend.modules.monitor.jobs.domain.JobInvokeTarget;
import com.shadcn.admin.backend.modules.monitor.jobs.domain.JobDO;
import com.shadcn.admin.backend.modules.monitor.jobs.mapper.JobMapper;
import java.util.List;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class JobBootstrapRunner implements ApplicationRunner {
    private static final Set<String> LEGACY_INVOKE_TARGETS = Set.of(
            "com.shadcn.jobs.HealthCheckJob.execute()",
            "com.shadcn.jobs.LogCleanupJob.execute()",
            "com.shadcn.jobs.DatabaseBackupJob.execute()",
            "logCleanupJobBean.cleanup()",
            "dataBackupJobBean.backup()");
    private static final String LOG_CLEANUP_INVOKE_TARGET = JobInvokeTarget.LOG_CLEANUP.code();
    private static final String DATA_BACKUP_INVOKE_TARGET = JobInvokeTarget.DATA_BACKUP.code();

    private final JobMapper jobMapper;
    private final QuartzJobManager quartzJobManager;
    @Value("${app.jobs.bootstrap-enabled:false}")
    private boolean bootstrapEnabled;

    public JobBootstrapRunner(JobMapper jobMapper, QuartzJobManager quartzJobManager) {
        this.jobMapper = jobMapper;
        this.quartzJobManager = quartzJobManager;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (bootstrapEnabled) {
            migrateAndSeedJobs();
        }
        quartzJobManager.syncAll(jobMapper.selectAll());
    }

    private void migrateAndSeedJobs() {
        List<JobDO> jobs = jobMapper.selectAll();
        for (JobDO job : jobs) {
            if (LEGACY_INVOKE_TARGETS.contains(job.getInvokeTarget())) {
                quartzJobManager.delete(job.getId());
                jobMapper.deleteById(job.getId());
            }
        }

        List<JobDO> currentJobs = jobMapper.selectAll();
        ensureJobIfMissing(
                currentJobs,
                "Log Cleanup",
                "SYSTEM",
                LOG_CLEANUP_INVOKE_TARGET,
                "0 0 2 * * ?",
                "fireOnce",
                false,
                "paused",
                "Cleanup operation and login logs");
        ensureJobIfMissing(
                currentJobs,
                "Data Backup",
                "SYSTEM",
                DATA_BACKUP_INVOKE_TARGET,
                "0 0 0 * * ?",
                "fireOnce",
                false,
                "running",
                "Export database schema and data to SQL file");
    }

    private void ensureJobIfMissing(
            List<JobDO> jobs,
            String name,
            String group,
            String invokeTarget,
            String cronExpression,
            String misfirePolicy,
            boolean concurrent,
            String status,
            String remark) {
        boolean exists = jobs.stream().anyMatch(job -> invokeTarget.equals(job.getInvokeTarget()));
        if (exists) {
            return;
        }

        JobDO seed = new JobDO();
        seed.setName(name);
        seed.setGroup(group);
        seed.setInvokeTarget(invokeTarget);
        seed.setCronExpression(cronExpression);
        seed.setMisfirePolicy(misfirePolicy);
        seed.setConcurrent(concurrent);
        seed.setStatus(status);
        seed.setRemark(remark);
        jobMapper.insert(seed);
    }
}
