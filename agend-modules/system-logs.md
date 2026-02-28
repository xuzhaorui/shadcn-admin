# Agent F - 日志管理模块

## 模块职责与范围

### ✅ In Scope
- 操作日志查询
- 登录日志查询
- 日志导出

### ❌ Out of Scope
- 日志的新增/编辑/删除（只读）
- 通用组件开发（属于 Agent S）

---

## 核心数据结构

```typescript
// 操作日志 - 只读查询
interface OperationLog {
  id: string;
  username: string;
  action: string;
  ip: string;
  status: 'success' | 'failure';
  createdAt: string;
}

// 登录日志 - 只读查询
interface LoginLog {
  id: string;
  username: string;
  ip: string;
  status: 'success' | 'failure';
  createdAt: string;
}
```

> **马斯克哲学应用**
> - **极致简化**：日志是只读的，移除所有非必要展示字段
> - **物理约束**：日志存储受限于磁盘，保留核心审计信息即可
> - **反过度工程**：不需要 `location`、`browser`、`os`、`params`、`result` 等详细信息

---

## 权限点设计

- `system:logs:view`
- `system:logs:export`

---

## Agent 行为约束

### ✅ 允许修改的目录
```
src/pages/system/logs/**
```

### ❌ 明确禁止的行为
- 修改其他 Agent 的业务代码
- 修改通用组件
- 实现日志的编辑/删除功能
