# Agent B - 角色与权限后端模块

## 模块职责与范围

### ✅ In Scope
- 角色分页查询/新增/编辑/删除
- 角色状态切换
- 菜单权限分配（菜单+按钮一体化）
- 数据权限设置（all/custom/dept/dept_down/self）
- 角色绑定用户（添加/移除）
- 角色导出

### ❌ Out of Scope
- 用户 CRUD（Agent A）
- 菜单 CRUD（Agent C）

---

## 核心数据结构（最小化）

```sql
-- sys_role
id, code, name, status, data_scope, version

-- sys_role_menu
role_id, menu_id

-- sys_role_dept (仅 data_scope=custom)
role_id, dept_id
```

---

## API 设计

- `GET /api/system/roles/list`
- `GET /api/system/roles/{id}`
- `POST /api/system/roles`
- `PUT /api/system/roles/{id}`
- `DELETE /api/system/roles/{id}`
- `DELETE /api/system/roles/batch`
- `PATCH /api/system/roles/{id}/status`
- `GET /api/system/roles/{id}/permissions`
- `POST /api/system/roles/{id}/permissions`
- `POST /api/system/roles/{id}/data-scope`
- `GET /api/system/roles/{id}/users`
- `POST /api/system/roles/{id}/users`
- `DELETE /api/system/roles/{id}/users`
- `GET /api/system/roles/export`

---

## 权限点

- `system:roles:view`
- `system:roles:create`
- `system:roles:edit`
- `system:roles:delete`
- `system:roles:assign-perms`
- `system:roles:assign-data-scope`
- `system:roles:assign-users`
- `system:roles:export`

---

## 业务规则

- `code` 唯一，冲突 `409`。
- 系统内置角色（如 `admin`）禁止删除、禁止修改编码。
- `data_scope=custom` 时 `dept_ids` 不能为空。
- 删除角色前校验是否仍绑定用户。

---

## WebFlux + MyBatis 约束

- 权限保存（角色-菜单）与数据权限保存（角色-部门）采用“先删后插”单事务。
- 用户分配接口必须幂等（重复添加不报错）。

