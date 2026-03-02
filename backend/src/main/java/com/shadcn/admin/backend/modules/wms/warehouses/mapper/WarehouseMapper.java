package com.shadcn.admin.backend.modules.wms.warehouses.mapper;

import com.shadcn.admin.backend.modules.wms.warehouses.domain.WarehouseDO;
import com.shadcn.admin.backend.modules.wms.warehouses.dto.WarehouseListQuery;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface WarehouseMapper {
    List<WarehouseDO> selectPage(WarehouseListQuery query);

    long count(WarehouseListQuery query);

    WarehouseDO selectById(@Param("id") String id);

    int existsByName(@Param("name") String name, @Param("excludeId") String excludeId);

    int insert(WarehouseDO warehouse);

    int update(WarehouseDO warehouse);
}
