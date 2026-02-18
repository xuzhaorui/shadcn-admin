package com.shadcn.admin.backend.infra.migration;

import com.shadcn.admin.backend.modules.system.users.domain.UserDO;
import com.shadcn.admin.backend.modules.system.users.mapper.UserMapper;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

@Component
public class PasswordBcryptMigrationRunner implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(PasswordBcryptMigrationRunner.class);

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final TransactionTemplate transactionTemplate;

    @Value("${app.migration.password-bcrypt-enabled:false}")
    private boolean enabled;

    public PasswordBcryptMigrationRunner(
            UserMapper userMapper, PasswordEncoder passwordEncoder, TransactionTemplate transactionTemplate) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.transactionTemplate = transactionTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!enabled) {
            return;
        }
        transactionTemplate.executeWithoutResult(status -> migrate());
    }

    private void migrate() {
        List<UserDO> users = userMapper.selectAllForPasswordMigration();
        int migrated = 0;
        int skipped = 0;
        for (UserDO user : users) {
            String current = user.getPasswordHash();
            if (isBcrypt(current)) {
                skipped++;
                continue;
            }
            if (current == null || current.isBlank()) {
                skipped++;
                continue;
            }
            String encoded = passwordEncoder.encode(current);
            userMapper.updatePasswordHashById(user.getId(), encoded);
            migrated++;
        }
        log.info("password bcrypt migration finished: total={}, migrated={}, skipped={}", users.size(), migrated, skipped);
    }

    private boolean isBcrypt(String value) {
        if (value == null) {
            return false;
        }
        return value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$");
    }
}
