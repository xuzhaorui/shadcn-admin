package com.shadcn.admin.backend.modules.monitor.jobs.service;

import com.shadcn.admin.backend.modules.system.logs.service.LogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component("logCleanupJobBean")
public class LogCleanupJobBean {
    private static final Logger log = LoggerFactory.getLogger(LogCleanupJobBean.class);

    private final LogService logService;

    public LogCleanupJobBean(LogService logService) {
        this.logService = logService;
    }

    public void cleanup() {
        int cleaned = logService.cleanupAllLogs();
        log.info("log cleanup job finished, removed rows={}", cleaned);
    }
}
