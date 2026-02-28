# Agent F - 日志管理后端模块

## 模块职责与范围

### ✅ In Scope
- 操作日志查询
- 登录日志查询
- 日志导出

### ❌ Out of Scope
- 日志新增/编辑/删除 API（日志写入由 AOP/过滤器完成，不对外开放写接口）

---

## 核心数据结构（最小化）

```sql
-- sys_operation_log
id, username, action, ip, status, created_at

-- sys_login_log
id, username, ip, status, created_at
```

---

## API 设计

- `GET /api/system/logs/operation/list`
- `GET /api/system/logs/login/list`
- `GET /api/system/logs/operation/export`
- `GET /api/system/logs/login/export`

---

## 权限点

- `system:logs:view`
- `system:logs:export`

---

## 业务规则

- 日志只读，禁止修改/删除接口。
- 导出按查询条件执行，并限制导出上限（如 10w 行）。
- 超出阈值返回异步任务 ID（可选）。

---

## WebFlux + MyBatis 约束

- 写日志（AOP）允许异步 fire-and-forget，但失败必须可观测（error log + metric）。
- 查询接口支持分页，禁止全表扫描导出。

