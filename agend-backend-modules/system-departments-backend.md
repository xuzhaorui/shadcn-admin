# Agent D - 部门管理后端模块

## 模块职责与范围

### ✅ In Scope
- 部门树查询
- 部门新增/编辑/删除
- 部门排序
- 部门状态管理

### ❌ Out of Scope
- 用户管理（Agent A）

---

## 核心数据结构（最小化）

```sql
-- sys_department
id, parent_id, name, code, sort, status, version
```

---

## API 设计

- `GET /api/system/departments/tree`
- `GET /api/system/departments/{id}`
- `POST /api/system/departments`
- `PUT /api/system/departments/{id}`
- `DELETE /api/system/departments/{id}`
- `POST /api/system/departments/reorder`
- `PATCH /api/system/departments/{id}/status`

---

## 权限点

- `system:departments:view`
- `system:departments:create`
- `system:departments:edit`
- `system:departments:delete`

---

## 业务规则

- `code` 唯一。
- 禁止删除存在子部门的节点。
- 禁止删除仍被用户绑定的部门。

---

## WebFlux + MyBatis 约束

- 树结构构建在 Service 内纯内存完成，避免递归 SQL。
- 删除前依赖校验（子节点/用户数）合并在同事务检查与执行。

