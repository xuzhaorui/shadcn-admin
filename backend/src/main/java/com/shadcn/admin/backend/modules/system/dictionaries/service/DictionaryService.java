package com.shadcn.admin.backend.modules.system.dictionaries.service;

import com.shadcn.admin.backend.common.api.PageResponse;
import com.shadcn.admin.backend.common.exception.BusinessException;
import com.shadcn.admin.backend.infra.mybatis.BlockingMyBatisExecutor;
import com.shadcn.admin.backend.modules.system.dictionaries.domain.DictItemDO;
import com.shadcn.admin.backend.modules.system.dictionaries.domain.DictTypeDO;
import com.shadcn.admin.backend.modules.system.dictionaries.dto.DictItemDTO;
import com.shadcn.admin.backend.modules.system.dictionaries.dto.DictItemListQuery;
import com.shadcn.admin.backend.modules.system.dictionaries.dto.DictItemUpsertRequest;
import com.shadcn.admin.backend.modules.system.dictionaries.dto.DictTypeDTO;
import com.shadcn.admin.backend.modules.system.dictionaries.dto.DictTypeListQuery;
import com.shadcn.admin.backend.modules.system.dictionaries.dto.DictTypeUpsertRequest;
import com.shadcn.admin.backend.modules.system.dictionaries.mapper.DictionaryMapper;
import java.util.UUID;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class DictionaryService {
    private final BlockingMyBatisExecutor executor;
    private final DictionaryMapper dictionaryMapper;

    public DictionaryService(BlockingMyBatisExecutor executor, DictionaryMapper dictionaryMapper) {
        this.executor = executor;
        this.dictionaryMapper = dictionaryMapper;
    }

    public Mono<PageResponse<DictTypeDTO>> listTypes(DictTypeListQuery query) {
        return executor.call(() -> new PageResponse<>(
                dictionaryMapper.selectTypePage(query).stream().map(this::toTypeDto).toList(),
                dictionaryMapper.countType(query),
                query.getPage(),
                query.getPageSize()));
    }

    public Mono<String> createType(DictTypeUpsertRequest req) {
        return executor.call(() -> {
            validateTypeCode(req.getCode(), null);
            DictTypeDO type = new DictTypeDO();
            type.setId(UUID.randomUUID().toString());
            type.setCode(req.getCode());
            type.setName(req.getName());
            type.setStatus(req.getStatus());
            type.setVersion(0L);
            dictionaryMapper.insertType(type);
            return type.getId();
        });
    }

    public Mono<Void> updateType(String id, DictTypeUpsertRequest req) {
        return executor.call(() -> {
            DictTypeDO type = dictionaryMapper.selectTypeById(id);
            if (type == null) {
                throw new BusinessException(404, "dict type not found");
            }
            validateTypeCode(req.getCode(), id);
            type.setCode(req.getCode());
            type.setName(req.getName());
            type.setStatus(req.getStatus());
            dictionaryMapper.updateType(type);
            return null;
        });
    }

    public Mono<Void> deleteType(String id) {
        return executor.call(() -> {
            if (dictionaryMapper.countItemsByTypeId(id) > 0) {
                throw new BusinessException(400, "dict type contains items, clear items first");
            }
            dictionaryMapper.deleteType(id);
            return null;
        });
    }

    public Mono<PageResponse<DictItemDTO>> listItems(DictItemListQuery query) {
        return executor.call(() -> new PageResponse<>(
                dictionaryMapper.selectItemPage(query).stream().map(this::toItemDto).toList(),
                dictionaryMapper.countItem(query),
                query.getPage(),
                query.getPageSize()));
    }

    public Mono<String> createItem(DictItemUpsertRequest req) {
        return executor.call(() -> {
            validateItemValue(req.getTypeId(), req.getValue(), null);
            DictItemDO item = new DictItemDO();
            item.setId(UUID.randomUUID().toString());
            item.setTypeId(req.getTypeId());
            item.setLabel(req.getLabel());
            item.setValue(req.getValue());
            item.setSort(req.getSort() == null ? 0 : req.getSort());
            item.setStatus(req.getStatus());
            item.setVersion(0L);
            dictionaryMapper.insertItem(item);
            return item.getId();
        });
    }

    public Mono<Void> updateItem(String id, DictItemUpsertRequest req) {
        return executor.call(() -> {
            DictItemDO item = dictionaryMapper.selectItemById(id);
            if (item == null) {
                throw new BusinessException(404, "dict item not found");
            }
            validateItemValue(req.getTypeId(), req.getValue(), id);
            item.setTypeId(req.getTypeId());
            item.setLabel(req.getLabel());
            item.setValue(req.getValue());
            item.setSort(req.getSort() == null ? 0 : req.getSort());
            item.setStatus(req.getStatus());
            dictionaryMapper.updateItem(item);
            return null;
        });
    }

    public Mono<Void> deleteItem(String id) {
        return executor.call(() -> {
            dictionaryMapper.deleteItem(id);
            return null;
        });
    }

    public Mono<String> refreshCache() {
        return Mono.just("no-op: local cache disabled, redis not enabled by design");
    }

    private DictTypeDTO toTypeDto(DictTypeDO type) {
        return new DictTypeDTO(type.getId(), type.getCode(), type.getName(), type.getStatus());
    }

    private DictItemDTO toItemDto(DictItemDO item) {
        return new DictItemDTO(item.getId(), item.getTypeId(), item.getLabel(), item.getValue(), item.getSort(), item.getStatus());
    }

    private void validateTypeCode(String code, String excludeId) {
        if (dictionaryMapper.existsTypeCode(code, excludeId) > 0) {
            throw new BusinessException(409, "dict type code already exists");
        }
    }

    private void validateItemValue(String typeId, String value, String excludeId) {
        if (dictionaryMapper.existsItemValue(typeId, value, excludeId) > 0) {
            throw new BusinessException(409, "dict item value already exists in type");
        }
    }
}
