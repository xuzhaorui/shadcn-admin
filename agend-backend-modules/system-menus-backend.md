# Agent C - 菜单与路由后端模块

## 模块职责与范围

### ✅ In Scope
- 菜单树查询
- 菜单新增/编辑/删除
- 菜单排序
- 菜单显示/隐藏
- 菜单类型（directory/menu/button）

### ❌ Out of Scope
- 权限分配流程（Agent B）

---

## 核心数据结构（最小化）

```sql
-- sys_menu
id, parent_id, type, name, code, path, icon, sort, visible, status, version
```

---

## API 设计

- `GET /api/system/menus/tree`
- `GET /api/system/menus/{id}`
- `POST /api/system/menus`
- `PUT /api/system/menus/{id}`
- `DELETE /api/system/menus/{id}`
- `POST /api/system/menus/reorder`

---

## 权限点

- `system:menus:view`
- `system:menus:create`
- `system:menus:edit`
- `system:menus:delete`

---

## 业务规则

- `code` 唯一。
- `type=button` 可无 `path`；`directory/menu` 必须有 `path`。
- 删除菜单前校验是否有子节点或被角色绑定。
- 拖拽排序只允许同层级重排（默认策略）。

---

## WebFlux + MyBatis 约束

- 树查询在 SQL 层一次拉平，应用层组装树，避免 N+1。
- 重排接口批量更新 `sort`，单事务提交。

