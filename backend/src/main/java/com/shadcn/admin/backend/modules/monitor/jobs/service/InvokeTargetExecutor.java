package com.shadcn.admin.backend.modules.monitor.jobs.service;

import com.shadcn.admin.backend.modules.monitor.jobs.domain.JobInvokeTarget;
import org.springframework.stereotype.Component;

@Component
public class InvokeTargetExecutor {
    private final LogCleanupJobBean logCleanupJobBean;
    private final DataBackupJobBean dataBackupJobBean;

    public InvokeTargetExecutor(LogCleanupJobBean logCleanupJobBean, DataBackupJobBean dataBackupJobBean) {
        this.logCleanupJobBean = logCleanupJobBean;
        this.dataBackupJobBean = dataBackupJobBean;
    }

    public void validate(String invokeTarget) {
        JobInvokeTarget.parse(invokeTarget);
    }

    public void execute(String invokeTarget) {
        JobInvokeTarget target = JobInvokeTarget.parse(invokeTarget);
        switch (target) {
            case LOG_CLEANUP -> logCleanupJobBean.cleanup();
            case DATA_BACKUP -> dataBackupJobBean.backup();
        }
    }
}
