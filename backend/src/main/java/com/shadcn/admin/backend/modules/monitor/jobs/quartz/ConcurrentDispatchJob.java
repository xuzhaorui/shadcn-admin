package com.shadcn.admin.backend.modules.monitor.jobs.quartz;

import com.shadcn.admin.backend.modules.monitor.jobs.service.JobRuntimeService;
import org.quartz.Job;
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.beans.factory.annotation.Autowired;

public class ConcurrentDispatchJob implements Job {
    @Autowired
    private JobRuntimeService jobRuntimeService;

    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        JobDataMap data = context.getMergedJobDataMap();
        String jobId = data.getString("jobId");
        String invokeTarget = data.getString("invokeTarget");
        jobRuntimeService.execute(jobId, invokeTarget, context.getFireTime(), context.getNextFireTime());
    }
}
