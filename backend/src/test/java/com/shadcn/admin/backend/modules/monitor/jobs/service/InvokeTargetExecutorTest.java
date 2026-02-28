package com.shadcn.admin.backend.modules.monitor.jobs.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import com.shadcn.admin.backend.common.exception.BusinessException;
import org.junit.jupiter.api.Test;

class InvokeTargetExecutorTest {
    private final LogCleanupJobBean logCleanupJobBean = mock(LogCleanupJobBean.class);
    private final DataBackupJobBean dataBackupJobBean = mock(DataBackupJobBean.class);
    private final InvokeTargetExecutor executor = new InvokeTargetExecutor(logCleanupJobBean, dataBackupJobBean);

    @Test
    void execute_shouldDispatchLogCleanup() {
        executor.execute("LOG_CLEANUP");

        verify(logCleanupJobBean).cleanup();
    }

    @Test
    void execute_shouldDispatchDataBackup() {
        executor.execute("DATA_BACKUP");

        verify(dataBackupJobBean).backup();
    }

    @Test
    void execute_shouldRejectInvalidTarget() {
        assertThatThrownBy(() -> executor.execute("testJobBean.noArg()"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("invokeTarget must be one of");
    }
}
