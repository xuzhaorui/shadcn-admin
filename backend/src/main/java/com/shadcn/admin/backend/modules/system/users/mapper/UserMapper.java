package com.shadcn.admin.backend.modules.system.users.mapper;

import com.shadcn.admin.backend.modules.system.users.domain.UserDO;
import com.shadcn.admin.backend.modules.system.users.dto.UserListQuery;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserMapper {
    List<UserDO> selectPage(UserListQuery query);

    long count(UserListQuery query);

    UserDO selectById(@Param("id") String id);

    UserDO selectByUsername(@Param("username") String username);

    int insert(UserDO user);

    int update(UserDO user);

    int deleteById(@Param("id") String id);

    int updateStatus(@Param("id") String id, @Param("status") String status);

    int existsByUsername(@Param("username") String username, @Param("excludeId") String excludeId);

    int deleteRolesByUserId(@Param("userId") String userId);

    int insertUserRole(@Param("userId") String userId, @Param("roleId") String roleId);

    List<String> selectRoleIdsByUserId(@Param("userId") String userId);

    List<String> selectRoleCodesByUserId(@Param("userId") String userId);

    List<UserDO> selectAllForPasswordMigration();

    int updatePasswordHashById(@Param("id") String id, @Param("passwordHash") String passwordHash);
}
