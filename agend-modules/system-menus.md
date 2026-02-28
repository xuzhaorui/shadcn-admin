# Agent C - 菜单与路由模块

## 模块职责与范围

### ✅ In Scope
- 菜单树展示（树形表格）
- 菜单新增/编辑/删除
- 菜单详情查看
- 菜单排序（拖拽排序）
- 菜单图标选择器
- 菜单类型管理（目录/菜单/按钮）
- 路由配置（path、component）
- 菜单显示/隐藏控制

### ❌ Out of Scope
- 权限分配逻辑（属于 Agent B）
- 用户/角色的 CRUD（属于 Agent A/B）
- 通用组件开发（属于 Agent S）

---

## 页面清单

### 1. 菜单管理页
- **路由**：`/system/menus/list`
- **文件**：`src/pages/system/menus/list.tsx`

### 2. 菜单编辑抽屉
- **组件**：`MenuDrawer`
- **文件**：`src/pages/system/menus/components/MenuDrawer.tsx`

### 3. 图标选择器
- **组件**：`IconPicker`
- **文件**：`src/pages/system/menus/components/IconPicker.tsx`

---

## 核心数据结构

```typescript
// 最小化菜单模型
interface Menu {
  id: string;
  parentId: string | null;
  type: 'directory' | 'menu' | 'button';
  name: string;
  code: string;
  path?: string;
  icon?: string;
  sort: number;
  visible: boolean;
  children?: Menu[];
}
```

> **马斯克哲学应用**
> - **质疑需求**：移除 `component`、`isExternal`、`externalUrl`、`cache`、`affix`、`badge` 等过度设计
> - **简化优化**：菜单的本质是导航树，其他功能都是"未来可能需要"的过度工程
> - **10%回添率原则**：如果真的需要这些字段，再加回来

---

## 权限点设计

- `system:menus:view`
- `system:menus:create`
- `system:menus:edit`
- `system:menus:delete`

---

## Agent 行为约束

### ✅ 允许修改的目录
```
src/pages/system/menus/**
```

### ❌ 明确禁止的行为
- 修改其他 Agent 的业务代码
- 修改通用组件
