# Agent D - 部门管理模块

## 模块职责与范围

### ✅ In Scope
- 部门树展示
- 部门新增/编辑/删除
- 部门排序
- 部门状态管理

### ❌ Out of Scope
- 用户管理（属于 Agent A）
- 通用组件开发（属于 Agent S）

---

## 核心数据结构

```typescript
// 最小化数据模型 - 只保留必需字段
interface Department {
  id: string;
  parentId: string | null;
  name: string;
  code: string;
  sort: number;
  status: 'active' | 'inactive';
  children?: Department[];
}
```

> **马斯克哲学应用**
> - **删除冗余**：移除 `leader`、`phone`、`email`、`createdAt`、`updatedAt` 等非核心字段
> - **第一性原理**：部门管理的本质是组织层级关系，其他都是装饰
> - **代码即负债**：每个字段都需要维护、校验、展示 - 只保留真正需要的

---

## 权限点设计

- `system:departments:view`
- `system:departments:create`
- `system:departments:edit`
- `system:departments:delete`

---

## Agent 行为约束

### ✅ 允许修改的目录
```
src/pages/system/departments/**
```

### ❌ 明确禁止的行为
- 修改其他 Agent 的业务代码
- 修改通用组件
