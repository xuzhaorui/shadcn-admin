package com.shadcn.admin.backend.modules.system.menus.mapper;

import com.shadcn.admin.backend.modules.system.menus.domain.MenuDO;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface MenuMapper {
    List<MenuDO> selectAll();
    MenuDO selectById(@Param("id") String id);
    MenuDO selectByCode(@Param("code") String code);
    int insert(MenuDO menu);
    int update(MenuDO menu);
    int deleteById(@Param("id") String id);
    int existsByCode(@Param("code") String code, @Param("excludeId") String excludeId);
    int countChildren(@Param("id") String id);
    int countRoleBindings(@Param("id") String id);
    int updateSort(@Param("id") String id, @Param("sort") int sort);
    int countByParentAndIds(@Param("parentId") String parentId, @Param("orderedIds") List<String> orderedIds);
}
