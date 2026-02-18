package com.shadcn.admin.backend.infra.audit;

import com.shadcn.admin.backend.infra.mybatis.BlockingMyBatisExecutor;
import com.shadcn.admin.backend.modules.system.logs.mapper.LogMapper;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class AuditService {
    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final BlockingMyBatisExecutor executor;
    private final LogMapper logMapper;

    public AuditService(BlockingMyBatisExecutor executor, LogMapper logMapper) {
        this.executor = executor;
        this.logMapper = logMapper;
    }

    public Mono<Void> recordLogin(String username, String ip, String status) {
        return executor.call(() -> {
                    logMapper.insertLoginLog(UUID.randomUUID().toString(), username, ip, status);
                    return null;
                })
                .then()
                .onErrorResume(ex -> {
                    log.error("failed to write login log: username={}, status={}", username, status, ex);
                    return Mono.empty();
                });
    }

    public Mono<Void> recordOperation(String username, String action, String ip, String status) {
        return executor.call(() -> {
                    logMapper.insertOperationLog(UUID.randomUUID().toString(), username, action, ip, status);
                    return null;
                })
                .then()
                .onErrorResume(ex -> {
                    log.error("failed to write operation log: username={}, action={}", username, action, ex);
                    return Mono.empty();
                });
    }
}
