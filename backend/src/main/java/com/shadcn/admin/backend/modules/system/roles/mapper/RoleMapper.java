package com.shadcn.admin.backend.modules.system.roles.mapper;

import com.shadcn.admin.backend.modules.system.roles.domain.RoleDO;
import com.shadcn.admin.backend.modules.system.roles.dto.RoleListQuery;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface RoleMapper {
    List<RoleDO> selectPage(RoleListQuery query);
    long count(RoleListQuery query);
    RoleDO selectById(@Param("id") String id);
    int insert(RoleDO role);
    int update(RoleDO role);
    int deleteById(@Param("id") String id);
    int updateStatus(@Param("id") String id, @Param("status") String status);
    int existsByCode(@Param("code") String code, @Param("excludeId") String excludeId);

    int deleteRoleMenus(@Param("roleId") String roleId);
    int insertRoleMenu(@Param("roleId") String roleId, @Param("menuId") String menuId);
    List<String> selectMenuIds(@Param("roleId") String roleId);

    int deleteRoleDepts(@Param("roleId") String roleId);
    int insertRoleDept(@Param("roleId") String roleId, @Param("deptId") String deptId);

    List<String> selectUserIds(@Param("roleId") String roleId);
    int insertUserRole(@Param("userId") String userId, @Param("roleId") String roleId);
    int deleteUserRole(@Param("userId") String userId, @Param("roleId") String roleId);
    int countUsersByRoleId(@Param("roleId") String roleId);
}
