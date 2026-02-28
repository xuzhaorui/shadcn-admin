# Agent A - 用户管理模块

## 模块职责与范围

### ✅ In Scope
- 用户列表展示（分页、搜索、筛选）
- 用户新增/编辑/删除
- 用户详情查看
- 用户状态启用/禁用
- 用户密码重置
- 用户导出（Excel）
- 用户关联角色分配
- 用户关联部门分配

### ❌ Out of Scope
- 角色的 CRUD（属于 Agent B）
- 部门的 CRUD（属于 Agent D）
- 权限配置逻辑（属于 Agent B）
- 通用组件开发（属于 Agent S）

---

## 页面清单

### 1. 用户列表页
- **路由**：`/system/users/list`
- **文件**：`src/pages/system/users/list.tsx`
- **组件**：
  - `UserSearchBar`：搜索区
  - `UserToolbar`：工具栏
  - `UserTable`：用户表格
  - `UserPagination`：分页器

### 2. 用户编辑抽屉
- **组件**：`UserDrawer`
- **文件**：`src/pages/system/users/components/UserDrawer.tsx`
- **模式**：新增 / 编辑

### 3. 用户详情抽屉
- **组件**：`UserDetailDrawer`
- **文件**：`src/pages/system/users/components/UserDetailDrawer.tsx`
- **模式**：只读

### 4. 角色分配弹窗
- **组件**：`AssignRoleModal`
- **文件**：`src/pages/system/users/components/AssignRoleModal.tsx`

### 5. 重置密码弹窗
- **组件**：`ResetPasswordModal`
- **文件**：`src/pages/system/users/components/ResetPasswordModal.tsx`

---

## 核心数据结构

```typescript
// 最小化用户模型
interface User {
  id: string;
  username: string;
  realName: string;
  email: string;
  phone?: string;
  departmentId: string;
  roleIds: string[];
  status: 'active' | 'inactive';
}
```

> **马斯克哲学应用**
> - **删除冗余**：移除 `avatar`、`gender`、`departmentName`、`roleNames`、`createdAt`、`updatedAt`、`lastLoginAt`、`lastLoginIp`
> - **质疑需求**：这些字段真的必要吗？还是"聪明人"提出的"可能有用"的需求？
> - **代码即负债**：每个字段都需要前端展示、后端存储、数据库索引 - 只保留核心业务字段
> - **校验规则**：前端校验是装饰，真正的校验在用户操作时自然发生

---

## 页面交互规范

### 搜索区（UserSearchBar）
**字段**：
- 关键词搜索（用户名/真实姓名/邮箱/手机号）
- 状态筛选（全部/启用/禁用）
- 部门筛选（树形选择器）
- 角色筛选（多选下拉）
- 创建时间范围

**行为**：
- 输入防抖（300ms）
- 点击"搜索"触发查询
- 点击"重置"清空所有条件

### 工具栏（UserToolbar）
**按钮**：
- `[+ 新增用户]`：权限 `system:users:create`
- `[批量删除]`：权限 `system:users:delete`，选中行数 > 0 时启用
- `[导出]`：权限 `system:users:export`
- `[刷新]`：无权限限制

### 表格列（UserTable）
| 列名 | 字段 | 宽度 | 说明 |
|------|------|------|------|
| 多选框 | - | 50px | 批量操作 |
| 头像 | avatar | 80px | 显示头像或默认图标 |
| 用户名 | username | 120px | - |
| 真实姓名 | realName | 100px | - |
| 邮箱 | email | 180px | - |
| 手机号 | phone | 120px | - |
| 部门 | departmentName | 120px | - |
| 角色 | roleNames | 150px | 标签展示，最多显示3个 |
| 状态 | status | 80px | Badge 组件 |
| 最后登录 | lastLoginAt | 160px | 相对时间 |
| 操作 | - | 200px | 见下方 |

**行操作按钮**：
- `[编辑]`：权限 `system:users:edit`
- `[删除]`：权限 `system:users:delete`
- `[详情]`：无权限限制
- `[更多]`：下拉菜单
  - `[分配角色]`：权限 `system:users:assign-roles`
  - `[重置密码]`：权限 `system:users:reset-pwd`
  - `[启用/禁用]`：权限 `system:users:edit`

### 用户编辑抽屉（UserDrawer）
**表单字段**：
```typescript
[
  { label: '用户名', field: 'username', type: 'input', required: true, disabled: isEdit },
  { label: '真实姓名', field: 'realName', type: 'input', required: true },
  { label: '邮箱', field: 'email', type: 'input', required: true },
  { label: '手机号', field: 'phone', type: 'input', required: false },
  { label: '性别', field: 'gender', type: 'radio', options: ['男', '女', '未知'] },
  { label: '部门', field: 'departmentId', type: 'tree-select', required: true },
  { label: '角色', field: 'roleIds', type: 'multi-select', required: true },
  { label: '状态', field: 'status', type: 'switch', default: 'active' },
  { label: '头像', field: 'avatar', type: 'upload', accept: 'image/*' }
]
```

**提交行为**：
- 校验通过后调用 API
- 成功：Toast 提示 + 关闭抽屉 + 刷新列表
- 失败：显示错误信息

### 重置密码弹窗（ResetPasswordModal）
**字段**：
- 新密码（必填，8-20位，包含字母+数字）
- 确认密码（必填，与新密码一致）

**行为**：
- 提交后发送邮件通知用户
- 成功后关闭弹窗

---

## 权限点设计

### 菜单权限
- `system:users:view`：用户管理菜单

### 按钮权限
- `system:users:create`：新增用户
- `system:users:edit`：编辑用户
- `system:users:delete`：删除用户
- `system:users:assign-roles`：分配角色
- `system:users:reset-pwd`：重置密码
- `system:users:export`：导出用户

---

## Edge Cases 与异常处理

### 空态
- 无用户数据时显示 Empty 组件
- 提示文案："暂无用户数据，点击新增创建第一个用户"
- 显示"新增用户"按钮（需权限）

### 错误态
- 网络错误：显示 Toast "网络异常，请稍后重试"
- 权限不足：隐藏按钮或显示 403 提示
- 表单校验失败：字段下方显示红色错误文案

### 冲突处理
- 用户名/邮箱/手机号重复：后端返回 409，前端显示具体冲突字段
- 删除用户时如有关联数据：后端返回 400，提示"该用户存在关联数据，无法删除"

### 并发处理
- 编辑时检测数据版本号（乐观锁）
- 版本冲突时提示"数据已被他人修改，请刷新后重试"

### 特殊场景
- 禁止删除当前登录用户
- 禁止修改超级管理员的角色
- 重置密码后强制用户下次登录修改

---

## Agent 行为约束

### ✅ 允许修改的目录
```
src/pages/system/users/
├── list.tsx
├── components/
│   ├── UserSearchBar.tsx
│   ├── UserToolbar.tsx
│   ├── UserTable.tsx
│   ├── UserDrawer.tsx
│   ├── UserDetailDrawer.tsx
│   ├── AssignRoleModal.tsx
│   └── ResetPasswordModal.tsx
├── hooks/
│   ├── useUserList.ts
│   └── useUserForm.ts
├── api/
│   └── user.ts
└── types/
    └── user.ts
```

### ❌ 明确禁止的行为
- 修改 `src/pages/system/roles/**`（Agent B 职责）
- 修改 `src/pages/system/departments/**`（Agent D 职责）
- 修改 `src/components/shared/**`（Agent S 职责）
- 直接调用其他模块的内部方法
- 在用户模块中实现通用表格组件（必须使用 Agent S 提供的组件）
- 修改全局路由配置文件

### 依赖约定
- 部门数据：通过 `GET /api/system/departments/tree` 获取
- 角色数据：通过 `GET /api/system/roles/list` 获取
- 不允许直接导入其他模块的 Store 或 Hook
