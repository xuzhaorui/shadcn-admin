package com.shadcn.admin.backend.modules.system.dictionaries.mapper;

import com.shadcn.admin.backend.modules.system.dictionaries.domain.DictItemDO;
import com.shadcn.admin.backend.modules.system.dictionaries.domain.DictTypeDO;
import com.shadcn.admin.backend.modules.system.dictionaries.dto.DictItemListQuery;
import com.shadcn.admin.backend.modules.system.dictionaries.dto.DictTypeListQuery;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface DictionaryMapper {
    List<DictTypeDO> selectTypePage(DictTypeListQuery query);
    long countType(DictTypeListQuery query);
    DictTypeDO selectTypeById(@Param("id") String id);
    int insertType(DictTypeDO type);
    int updateType(DictTypeDO type);
    int deleteType(@Param("id") String id);
    int existsTypeCode(@Param("code") String code, @Param("excludeId") String excludeId);

    List<DictItemDO> selectItemPage(DictItemListQuery query);
    long countItem(DictItemListQuery query);
    DictItemDO selectItemById(@Param("id") String id);
    int insertItem(DictItemDO item);
    int updateItem(DictItemDO item);
    int deleteItem(@Param("id") String id);
    int countItemsByTypeId(@Param("typeId") String typeId);
    int existsItemValue(@Param("typeId") String typeId, @Param("value") String value, @Param("excludeId") String excludeId);
}
