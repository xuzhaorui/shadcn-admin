# Agent A - 用户管理后端模块

## 模块职责与范围

### ✅ In Scope
- 用户分页查询（关键词/状态/部门/角色）
- 用户新增/编辑/删除（含批量删除）
- 用户详情查询
- 用户状态启用/禁用
- 用户重置密码
- 用户导出
- 用户与角色/部门关系维护

### ❌ Out of Scope
- 角色 CRUD（Agent B）
- 部门 CRUD（Agent D）

---

## 核心数据结构（最小化）

```sql
-- sys_user
id, username, real_name, email, phone, department_id, status, password_hash, version
```

```sql
-- sys_user_role
user_id, role_id
```

---

## API 设计

- `GET /api/system/users/list`
- `GET /api/system/users/{id}`
- `POST /api/system/users`
- `PUT /api/system/users/{id}`
- `DELETE /api/system/users/{id}`
- `DELETE /api/system/users/batch`
- `PATCH /api/system/users/{id}/status`
- `POST /api/system/users/{id}/reset-password`
- `GET /api/system/users/export`

---

## 权限点

- `system:users:view`
- `system:users:create`
- `system:users:edit`
- `system:users:delete`
- `system:users:assign-roles`
- `system:users:reset-pwd`
- `system:users:export`

---

## 业务规则

- `username` 全局唯一（冲突返回 `409`）。
- 禁止删除当前登录用户。
- 超级管理员用户不可降权为无管理员权限。
- 重置密码后可配置“下次登录强制修改”。

---

## WebFlux + MyBatis 约束

- 所有 Mapper 调用使用 `Mono.fromCallable(...).subscribeOn(boundedElastic())`。
- 批量删除与角色绑定变更必须在事务内执行。

