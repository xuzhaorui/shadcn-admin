# Agent E - 字典管理模块

## 模块职责与范围

### ✅ In Scope
- 字典分类管理
- 字典项管理
- 字典缓存刷新

### ❌ Out of Scope
- 通用组件开发（属于 Agent S）

---

## 核心数据结构

```typescript
// 字典类型
interface DictType {
  id: string;
  code: string;
  name: string;
  status: 'active' | 'inactive';
}

// 字典项
interface DictItem {
  id: string;
  typeId: string;
  label: string;
  value: string;
  sort: number;
  status: 'active' | 'inactive';
}
```

> **马斯克哲学应用**
> - **删除冗余**：移除 `description`、`remark`、`createdAt`、`updatedAt` 等装饰性字段
> - **直击本质**：字典就是 key-value 映射，其他都是噪音

---

## 权限点设计

- `system:dictionaries:view`
- `system:dictionaries:create`
- `system:dictionaries:edit`
- `system:dictionaries:delete`

---

## Agent 行为约束

### ✅ 允许修改的目录
```
src/pages/system/dictionaries/**
```

### ❌ 明确禁止的行为
- 修改其他 Agent 的业务代码
- 修改通用组件
