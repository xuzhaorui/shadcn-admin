package com.shadcn.admin.backend.infra.seed;

import com.shadcn.admin.backend.modules.system.departments.domain.DepartmentDO;
import com.shadcn.admin.backend.modules.system.departments.mapper.DepartmentMapper;
import com.shadcn.admin.backend.modules.system.roles.domain.RoleDO;
import com.shadcn.admin.backend.modules.system.roles.mapper.RoleMapper;
import com.shadcn.admin.backend.modules.system.users.domain.UserDO;
import com.shadcn.admin.backend.modules.system.users.mapper.UserMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

@Component
@Profile("dev")
public class DevAdminSeedRunner implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(DevAdminSeedRunner.class);
    private static final String DEFAULT_DEPT_CODE = "default";
    private static final String ADMIN_ROLE_CODE = "admin";

    private final DepartmentMapper departmentMapper;
    private final RoleMapper roleMapper;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final TransactionTemplate transactionTemplate;

    @Value("${app.seed.enabled:false}")
    private boolean seedEnabled;

    @Value("${app.seed.admin-username:}")
    private String adminUsername;

    @Value("${app.seed.admin-password:}")
    private String adminPassword;

    @Value("${app.seed.admin-real-name:}")
    private String adminRealName;

    @Value("${app.seed.admin-email:}")
    private String adminEmail;

    public DevAdminSeedRunner(
            DepartmentMapper departmentMapper,
            RoleMapper roleMapper,
            UserMapper userMapper,
            PasswordEncoder passwordEncoder,
            TransactionTemplate transactionTemplate) {
        this.departmentMapper = departmentMapper;
        this.roleMapper = roleMapper;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.transactionTemplate = transactionTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!seedEnabled) {
            return;
        }
        if (isBlank(adminUsername) || isBlank(adminPassword)) {
            log.warn("seed skipped: app.seed.admin-username/admin-password are required when app.seed.enabled=true");
            return;
        }
        transactionTemplate.executeWithoutResult(status -> seedAdmin());
    }

    private void seedAdmin() {
        DepartmentDO department = ensureDepartment();
        RoleDO adminRole = ensureAdminRole();
        UserDO adminUser = ensureAdminUser(department.getId());
        roleMapper.insertUserRole(adminUser.getId(), adminRole.getId());

        log.info(
                "dev admin seed ready: username={}, password={} (change in production)",
                adminUsername,
                adminPassword);
    }

    private DepartmentDO ensureDepartment() {
        DepartmentDO department = departmentMapper.selectByCode(DEFAULT_DEPT_CODE);
        if (department != null) {
            return department;
        }

        department = new DepartmentDO();
        department.setParentId(null);
        department.setName("Default Department");
        department.setCode(DEFAULT_DEPT_CODE);
        department.setSort(0);
        department.setStatus("enabled");
        department.setVersion(0L);
        departmentMapper.insert(department);
        return department;
    }

    private RoleDO ensureAdminRole() {
        RoleDO role = roleMapper.selectByCode(ADMIN_ROLE_CODE);
        if (role != null) {
            role.setStatus("enabled");
            role.setDataScope("all");
            roleMapper.update(role);
            return role;
        }

        role = new RoleDO();
        role.setCode(ADMIN_ROLE_CODE);
        role.setName("Super Admin");
        role.setStatus("enabled");
        role.setDataScope("all");
        role.setVersion(0L);
        roleMapper.insert(role);
        return role;
    }

    private UserDO ensureAdminUser(String departmentId) {
        String seedRealName = isBlank(adminRealName) ? adminUsername : adminRealName;
        String seedEmail = isBlank(adminEmail) ? adminUsername : adminEmail;
        UserDO user = userMapper.selectByUsername(adminUsername);
        if (user == null) {
            user = new UserDO();
            user.setUsername(adminUsername);
            user.setRealName(seedRealName);
            user.setEmail(seedEmail);
            user.setPhone(null);
            user.setDepartmentId(departmentId);
            user.setStatus("enabled");
            user.setPasswordHash(passwordEncoder.encode(adminPassword));
            user.setVersion(0L);
            userMapper.insert(user);
            return user;
        }

        user.setRealName(isBlank(user.getRealName()) ? seedRealName : user.getRealName());
        user.setEmail(isBlank(user.getEmail()) ? seedEmail : user.getEmail());
        user.setDepartmentId(isBlank(user.getDepartmentId()) ? departmentId : user.getDepartmentId());
        user.setStatus("enabled");
        userMapper.update(user);
        return user;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
