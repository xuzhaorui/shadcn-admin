package com.shadcn.admin.backend.modules.monitor.jobs.domain;

import com.shadcn.admin.backend.common.exception.BusinessException;
import java.util.Locale;

public enum JobInvokeTarget {
    LOG_CLEANUP("LOG_CLEANUP"),
    DATA_BACKUP("DATA_BACKUP");

    private final String code;

    JobInvokeTarget(String code) {
        this.code = code;
    }

    public String code() {
        return code;
    }

    public static JobInvokeTarget parse(String value) {
        if (value == null || value.isBlank()) {
            throw invalidTarget(value);
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        for (JobInvokeTarget target : values()) {
            if (target.code.equals(normalized)) {
                return target;
            }
        }
        if ("LOGCLEANUPJOBBEAN.CLEANUP()".equals(normalized)) {
            return LOG_CLEANUP;
        }
        if ("DATABACKUPJOBBEAN.BACKUP()".equals(normalized)) {
            return DATA_BACKUP;
        }
        throw invalidTarget(value);
    }

    private static BusinessException invalidTarget(String value) {
        return new BusinessException(400, "invokeTarget must be one of: LOG_CLEANUP, DATA_BACKUP; current=" + value);
    }
}
