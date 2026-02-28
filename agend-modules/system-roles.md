# Agent B - 角色与权限模块

## 模块职责与范围

### ✅ In Scope
- 角色列表展示（分页、搜索、筛选）
- 角色新增/编辑/删除
- 角色详情查看
- 角色状态启用/禁用
- 菜单权限设置（多选树：目录/菜单/按钮）
- 数据权限设置（全部/自定义/本部门/本部门及以下/仅本人）
- 分配用户（给角色绑定用户、移除用户）
- 导出角色列表（按筛选条件导出）
- 权限树展示与选择（菜单+按钮一体化树）
- 角色与权限回显/保存

### ❌ Out of Scope
- 用户的 CRUD（属于 Agent A）
- 菜单的 CRUD（属于 Agent C）
- 部门的 CRUD（属于 Agent D）
- 通用组件开发（属于 Agent S）

---

## 页面清单

### 1. 角色列表页
- **路由**：`/system/roles/list`
- **文件**：`src/pages/system/roles/list.tsx`
- **组件**：
  - `RoleSearchBar`：搜索区
  - `RoleToolbar`：工具栏
  - `RoleTable`：角色表格
  - `RolePagination`：分页器

### 2. 角色编辑抽屉
- **组件**：`RoleDrawer`
- **文件**：`src/pages/system/roles/components/RoleDrawer.tsx`
- **模式**：新增 / 编辑
- **包含**：基础信息 + 数据权限设置（含自定义数据权限配置）

### 3. 权限分配弹窗
- **组件**：`AssignPermissionModal`
- **文件**：`src/pages/system/roles/components/AssignPermissionModal.tsx`
- **包含**：菜单权限树（目录/菜单/按钮统一多选）

### 4. 角色详情抽屉
- **组件**：`RoleDetailDrawer`
- **文件**：`src/pages/system/roles/components/RoleDetailDrawer.tsx`
- **模式**：已分配用户列表 + 可分配用户搜索选择 + 批量添加/移除

---

## 核心数据结构

```typescript
// 最小化角色模型
interface Role {
  id: string;
  code: string;
  name: string;
  status: 'active' | 'inactive';
  dataScope: 'all' | 'custom' | 'dept' | 'dept_down' | 'self';
  customDeptIds?: string[]; // dataScope=custom 时使用
  permissionNodeIds: string[]; // 权限节点ID
}

// 权限节点（目录/菜单/按钮统一树）
interface PermissionNode {
  id: string;
  name: string;
  type: 'directory' | 'menu' | 'button';
  code?: string;
  parentId?: string;
}
```

> **马斯克哲学应用**
> - **删除冗余**：移除 `description`、`sort`、`isSystem`、`createdAt`、`updatedAt`
> - **质疑需求**：复杂的校验规则是为了防止用户犯错，还是为了展示工程师的智商？
> - **简化优化**：权限管理的本质是角色-权限映射，其他都是装饰
> - **单体思维**：不需要把权限分成菜单权限、按钮权限、数据权限多个微服务，一棵树就够了

---

## 页面交互规范

### 搜索区（RoleSearchBar）
**字段**：
- 关键词搜索（角色编码/角色名称）
- 状态筛选（全部/启用/禁用）
- 创建时间范围
- 数据权限范围筛选（全部/自定义/本部门/本部门及以下/仅本人）

**行为**：
- 输入防抖（300ms）
- 点击"搜索"触发查询
- 点击"重置"清空所有条件

### 工具栏（RoleToolbar）
**按钮**：
- `[+ 新增角色]`：权限 `system:roles:create`
- `[批量删除]`：权限 `system:roles:delete`，选中行数 > 0 时启用 （系统内置角色禁止选中）
- `[刷新]`：无权限限制
- `[导出]`：权限 system:roles:export（按当前筛选条件导出）

### 表格列（RoleTable）
| 列名 | 字段 | 宽度 | 说明 |
|------|------|------|------|
| 多选框 | - | 50px | 批量操作（系统内置角色禁止选中） |
| 角色编码 | code | 120px | - |
| 角色名称 | name | 150px | - |
| 描述 | description | 200px | 超出省略 |
| 数据权限 | dataScope | 140px   | Tag 展示（含自定义提示） |
| 状态 | status | 80px | Badge/Tag |
| 排序 | sort | 80px | - |
| 创建时间 | createdAt | 160px | - |
| 操作 | - | 320px | 见下方 |

**行操作按钮**：
- `[编辑]`：权限 `system:roles:edit`，系统内置角色禁用
- `[删除]`：权限 `system:roles:delete`，系统内置角色禁用
- `[详情]`：无权限限制
- `[菜单权限]`：`system:roles:assign-perms`
- `[数据权限]`：`system:roles:assign-data-scope`（可复用编辑抽屉中的区域，或独立弹窗）
- `[分配用户]`：权限 `system:roles:assign-users`

### 角色编辑抽屉（RoleDrawer）
**表单字段**：
```typescript
[
  { label: '角色编码', field: 'code', type: 'input', required: true, disabled: isEdit },
  { label: '角色名称', field: 'name', type: 'input', required: true },
  { label: '描述', field: 'description', type: 'textarea', rows: 3 },

  // 数据权限（5档）
  { label: '数据权限', field: 'dataScope', type: 'radio', options: [
    { label: '全部数据权限', value: 'all' },
    { label: '自定义数据权限', value: 'custom' },
    { label: '本部门数据权限', value: 'dept' },
    { label: '本部门及以下数据权限', value: 'dept_down' },
    { label: '仅本人数据权限', value: 'self' }
  ]},

  // dataScope=custom 时显示
  { label: '可访问部门', field: 'customDeptIds', type: 'deptTreeSelect', visibleWhen: dataScope==='custom', required: true },

  { label: '排序', field: 'sort', type: 'number', default: 0 },
  { label: '状态', field: 'status', type: 'switch', default: 'active' }
]

```

**提交行为**：
- 校验通过后调用 API
- 成功：Toast 提示 + 关闭抽屉 + 刷新列表
- 失败：显示错误信息

### 权限分配弹窗（AssignPermissionModal）
**布局**：
```
┌─────────────────────────────────────┐
│ 菜单权限（左侧）                     │
│ ┌─────────────────────────────────┐ │
│ │ 树形结构（Tree）                 │ │
│ │ ☑ 系统管理                       │ │
│ │   ☑ 用户管理                     │ │
│ │   ☐ 角色管理                     │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 按钮权限（右侧）                     │
│ ┌─────────────────────────────────┐ │
│ │ 根据选中菜单动态展示             │ │
│ │ ☑ 新增用户 (system:users:create)│ │
│ │ ☑ 编辑用户 (system:users:edit)  │ │
│ │ ☐ 删除用户 (system:users:delete)│ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**交互规则**：
- 选中父菜单时，自动选中所有子菜单
- 取消父菜单时，自动取消所有子菜单和按钮权限
- 选中菜单后，右侧显示该菜单下的按钮权限
- 支持"全选"/"反选"快捷操作

---

### 分配用户（AssignUsersModal）新增规范
```
布局建议：

左侧：已分配用户（可搜索、可多选移除）

右侧：可分配用户列表（搜索、分页、多选添加）

顶部显示当前角色信息（name/code）

交互规则：

支持按用户名/姓名/手机号搜索

批量添加、批量移除

保存后刷新角色详情（用户数量、列表）

若后端支持“即时生效”，保存后 toast 提示：“已更新角色用户”
---

## 权限点设计

### 菜单权限
- `system:roles:view`：角色管理菜单

### 按钮权限
- `system:roles:create`：新增角色
- `system:roles:edit`：编辑角色
- `system:roles:delete`：删除角色
- `system:roles:assign-perms`：分配权限
- `system:roles:assign-data-scope`：数据权限设置
- `system:roles:assign-users`：分配用户
- `system:roles:export`：导出

---

## Edge Cases 与异常处理
### 数据权限
- dataScope=custom 但未选择部门：前端校验阻止提交
- 后端返回 customDeptIds 为空：前端提示“自定义数据权限未配置”

### 菜单权限树
- 半选节点保存策略：保存 实际勾选节点（checkedKeys），半选（halfCheckedKeys）由后端根据树结构推导或前端补全（按后端约定）
- 权限树数据更新后回显失败：提示“权限数据已变更，请重新分配”

### 分配用户
- 角色禁用时是否允许分配用户：按规则（若不允许，按钮禁用并提示）
- 批量添加/移除失败：展示失败原因与失败数量

### 导出
- 导出按当前筛选条件执行
- 导出中禁用按钮，避免重复点击
- 导出失败提示可读原因（无权限/超时/数据过大）

### 空态
- 无角色数据时显示 Empty 组件
- 提示文案："暂无角色数据，点击新增创建第一个角色"
- 显示"新增角色"按钮（需权限）

### 错误态
- 网络错误：显示 Toast "网络异常，请稍后重试"
- 权限不足：隐藏按钮或显示 403 提示
- 表单校验失败：字段下方显示红色错误文案

### 冲突处理
- 角色编码重复：后端返回 409，前端显示"角色编码已存在"
- 删除角色时如有关联用户：后端返回 400，提示"该角色已分配给用户，无法删除"

### 并发处理
- 编辑时检测数据版本号（乐观锁）
- 版本冲突时提示"数据已被他人修改，请刷新后重试"

### 特殊场景
- 系统内置角色（如 admin）禁止删除和修改编码
- 禁止删除当前登录用户的角色
- 分配权限时，菜单权限和按钮权限必须同时保存

---

## Agent 行为约束

### ✅ 允许修改的目录
```
src/pages/system/roles/
├── list.tsx
├── components/
│   ├── RoleSearchBar.tsx
│   ├── RoleToolbar.tsx
│   ├── RoleTable.tsx
│   ├── RoleDrawer.tsx
│   ├── RoleDetailDrawer.tsx
│   └── AssignPermissionModal.tsx
├── hooks/
│   ├── useRoleList.ts
│   ├── useRoleForm.ts
│   └── usePermissionTree.ts
├── api/
│   ├── role.ts
│   └── permission.ts
└── types/
    ├── role.ts
    └── permission.ts
```

### ❌ 明确禁止的行为
- 修改 `src/pages/system/users/**`（Agent A 职责）
- 修改 `src/pages/system/menus/**`（Agent C 职责）
- 修改 `src/components/shared/**`（Agent S 职责）
- 直接调用其他模块的内部方法
- 在角色模块中实现通用树组件（必须使用 Agent S 提供的组件）
- 修改全局权限校验逻辑

### 依赖约定
- 菜单数据：通过 `GET /api/system/menus/tree` 获取（Agent C 提供）
- 不允许直接导入其他模块的 Store 或 Hook
