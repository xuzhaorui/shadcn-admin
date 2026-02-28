# Agent E - 字典管理后端模块

## 模块职责与范围

### ✅ In Scope
- 字典类型管理
- 字典项管理
- 字典缓存刷新

### ❌ Out of Scope
- 通用缓存框架建设（初期不引入 Redis）

---

## 核心数据结构（最小化）

```sql
-- sys_dict_type
id, code, name, status, version

-- sys_dict_item
id, type_id, label, value, sort, status, version
```

---

## API 设计

- `GET /api/system/dictionaries/types`
- `POST /api/system/dictionaries/types`
- `PUT /api/system/dictionaries/types/{id}`
- `DELETE /api/system/dictionaries/types/{id}`
- `GET /api/system/dictionaries/items`
- `POST /api/system/dictionaries/items`
- `PUT /api/system/dictionaries/items/{id}`
- `DELETE /api/system/dictionaries/items/{id}`
- `POST /api/system/dictionaries/cache/refresh`

---

## 权限点

- `system:dictionaries:view`
- `system:dictionaries:create`
- `system:dictionaries:edit`
- `system:dictionaries:delete`

---

## 业务规则

- `dict_type.code` 唯一。
- 同一 `type_id` 下 `value` 唯一。
- 删除字典类型前必须先清空其字典项，或返回 `400`。

---

## WebFlux + MyBatis 约束

- 初始实现以 DB 为唯一真实源，不依赖 Redis。
- `cache/refresh` 接口仅用于清理应用内本地缓存（若未启用缓存则返回成功 no-op）。
