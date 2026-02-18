package com.shadcn.admin.backend.modules.system.users.service;

import com.shadcn.admin.backend.common.api.PageResponse;
import com.shadcn.admin.backend.common.exception.BusinessException;
import com.shadcn.admin.backend.infra.mybatis.BlockingMyBatisExecutor;
import com.shadcn.admin.backend.modules.system.users.domain.UserDO;
import com.shadcn.admin.backend.modules.system.users.dto.BatchDeleteRequest;
import com.shadcn.admin.backend.modules.system.users.dto.ResetPasswordRequest;
import com.shadcn.admin.backend.modules.system.users.dto.ToggleStatusRequest;
import com.shadcn.admin.backend.modules.system.users.dto.UserDTO;
import com.shadcn.admin.backend.modules.system.users.dto.UserListQuery;
import com.shadcn.admin.backend.modules.system.users.dto.UserUpsertRequest;
import com.shadcn.admin.backend.modules.system.users.mapper.UserMapper;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.support.TransactionTemplate;
import reactor.core.publisher.Mono;

@Service
public class UserService {
    private final BlockingMyBatisExecutor executor;
    private final UserMapper userMapper;
    private final TransactionTemplate transactionTemplate;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            BlockingMyBatisExecutor executor,
            UserMapper userMapper,
            TransactionTemplate transactionTemplate,
            PasswordEncoder passwordEncoder) {
        this.executor = executor;
        this.userMapper = userMapper;
        this.transactionTemplate = transactionTemplate;
        this.passwordEncoder = passwordEncoder;
    }

    public Mono<PageResponse<UserDTO>> list(UserListQuery query) {
        return executor.call(() -> {
            List<UserDTO> list = userMapper.selectPage(query).stream().map(this::toDto).toList();
            long total = userMapper.count(query);
            return new PageResponse<>(list, total, query.getPage(), query.getPageSize());
        });
    }

    public Mono<UserDTO> detail(String id) {
        return executor.call(() -> {
            UserDO user = userMapper.selectById(id);
            if (user == null) {
                throw new BusinessException(404, "user not found");
            }
            return toDto(user);
        });
    }

    public Mono<String> create(UserUpsertRequest req) {
        return executor.call(() -> transactionTemplate.execute(status -> {
            validateUsername(req.getUsername(), null);
            UserDO user = new UserDO();
            user.setId(UUID.randomUUID().toString());
            user.setUsername(req.getUsername());
            user.setRealName(req.getRealName());
            user.setEmail(req.getEmail());
            user.setPhone(req.getPhone());
            user.setDepartmentId(req.getDepartmentId());
            user.setStatus(req.getStatus());
            String rawPassword = (req.getPassword() == null || req.getPassword().isBlank()) ? "123456" : req.getPassword();
            user.setPasswordHash(passwordEncoder.encode(rawPassword));
            user.setVersion(0L);
            userMapper.insert(user);
            replaceRoles(user.getId(), req.getRoleIds());
            return user.getId();
        }));
    }

    public Mono<Void> update(String id, UserUpsertRequest req) {
        return executor.call(() -> {
            transactionTemplate.executeWithoutResult(status -> {
                UserDO existed = userMapper.selectById(id);
                if (existed == null) {
                    throw new BusinessException(404, "user not found");
                }
                validateUsername(req.getUsername(), id);
                existed.setUsername(req.getUsername());
                existed.setRealName(req.getRealName());
                existed.setEmail(req.getEmail());
                existed.setPhone(req.getPhone());
                existed.setDepartmentId(req.getDepartmentId());
                existed.setStatus(req.getStatus());
                userMapper.update(existed);
                replaceRoles(id, req.getRoleIds());
            });
            return null;
        });
    }

    public Mono<Void> delete(String id) {
        return executor.call(() -> {
            transactionTemplate.executeWithoutResult(status -> {
                userMapper.deleteById(id);
                userMapper.deleteRolesByUserId(id);
            });
            return null;
        });
    }

    public Mono<Void> batchDelete(BatchDeleteRequest req) {
        return executor.call(() -> {
            transactionTemplate.executeWithoutResult(status -> {
                for (String id : req.getIds()) {
                    userMapper.deleteById(id);
                    userMapper.deleteRolesByUserId(id);
                }
            });
            return null;
        });
    }

    public Mono<Void> toggleStatus(String id, ToggleStatusRequest req) {
        return executor.call(() -> {
            userMapper.updateStatus(id, req.getStatus());
            return null;
        });
    }

    public Mono<Void> resetPassword(String id, ResetPasswordRequest req) {
        return executor.call(() -> {
            UserDO existed = userMapper.selectById(id);
            if (existed == null) {
                throw new BusinessException(404, "user not found");
            }
            existed.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
            userMapper.update(existed);
            return null;
        });
    }

    private UserDTO toDto(UserDO user) {
        List<String> roleIds = userMapper.selectRoleIdsByUserId(user.getId());
        return new UserDTO(
                user.getId(),
                user.getUsername(),
                user.getRealName(),
                user.getEmail(),
                user.getPhone(),
                user.getDepartmentId(),
                roleIds == null ? Collections.emptyList() : roleIds,
                user.getStatus());
    }

    private void validateUsername(String username, String excludeId) {
        if (userMapper.existsByUsername(username, excludeId) > 0) {
            throw new BusinessException(409, "username already exists");
        }
    }

    private void replaceRoles(String userId, List<String> roleIds) {
        userMapper.deleteRolesByUserId(userId);
        if (roleIds == null || roleIds.isEmpty()) {
            return;
        }
        for (String roleId : roleIds) {
            userMapper.insertUserRole(userId, roleId);
        }
    }
}
