package com.shadcn.admin.backend.modules.system.departments.mapper;

import com.shadcn.admin.backend.modules.system.departments.domain.DepartmentDO;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface DepartmentMapper {
    List<DepartmentDO> selectAll();
    DepartmentDO selectById(@Param("id") String id);
    int insert(DepartmentDO department);
    int update(DepartmentDO department);
    int deleteById(@Param("id") String id);
    int updateStatus(@Param("id") String id, @Param("status") String status);
    int existsByCode(@Param("code") String code, @Param("excludeId") String excludeId);
    int countChildren(@Param("id") String id);
    int countUsers(@Param("id") String id);
    int updateSort(@Param("id") String id, @Param("sort") int sort);
    int countByParentAndIds(@Param("parentId") String parentId, @Param("orderedIds") List<String> orderedIds);
}
