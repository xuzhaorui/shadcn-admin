# Project Backend Agenda (agend-backend.md)

> 本文档是后端实现的最高约束。用于 Spring Boot WebFlux + MyBatis 适配系统管理模块（Users/Roles/Menus/Departments/Dicts/Logs）。

## 1. 技术栈与关键前提

### 1.1 技术栈
- Framework: `Spring Boot 3.x`
- Web: `Spring WebFlux`
- Persistence: `MyBatis` + `MySQL 8.x`
- Cache: 默认不启用外部缓存（初始阶段仅 DB + 应用内短期缓存可选）
- Auth: `JWT`（或网关透传用户上下文）

### 1.2 必须明确的现实约束（第一性原理）
- `MyBatis/JDBC` 是阻塞 I/O；`WebFlux` 是非阻塞模型。
- 结论：**必须将所有 MyBatis 调用隔离到 `Schedulers.boundedElastic()`**。
- 禁止在 Netty event-loop 线程直接执行 Mapper。

## 2. 架构原则（马斯克五步）

### 2.1 质疑需求
- 默认拒绝非核心字段、非核心流程。
- 每个新增字段必须说明“业务不可替代性”。

### 2.2 删除冗余
- 只保留模块最小可行数据模型。
- 删除“看起来可能有用”的历史字段与装饰字段。
- 初期禁止引入 Redis/消息队列等基础设施，除非有明确性能瓶颈证据。

### 2.3 简化后优化
- 先保证单体可维护，再考虑分库分表、读写分离。
- 禁止为不存在的瓶颈做提前优化。

### 2.4 加速循环
- API 设计优先 CRUD + 查询闭环。
- 每个模块先打通：查询/新增/编辑/删除/权限校验/审计。

### 2.5 最后自动化
- 自动化只做在稳定流程上：OpenAPI、SQL migration、测试、CI。

## 3. 分层规范

- `controller`: 只做参数校验与协议转换，返回 `Mono<Response<T>>`。
- `service`: 业务编排与权限判定。
- `repository/mapper`: MyBatis SQL。
- `domain`: 实体与值对象。
- `app`: DTO/Query/Command。

### 3.1 WebFlux + MyBatis 调用模板（强制）
```java
public Mono<UserDTO> getById(String id) {
  return Mono.fromCallable(() -> userMapper.selectById(id))
      .subscribeOn(Schedulers.boundedElastic())
      .map(UserAssembler::toDTO);
}
```

## 4. 统一协议

### 4.1 统一响应
```json
{ "code": 200, "message": "ok", "data": {} }
```

### 4.2 分页
```json
{
  "list": [],
  "total": 0,
  "page": 1,
  "pageSize": 20
}
```

### 4.3 错误码
- `400` 参数错误
- `401` 未认证
- `403` 无权限
- `404` 资源不存在
- `409` 资源冲突（编码重复、版本冲突）
- `500` 服务内部错误

## 5. 横切能力

- 鉴权：权限点格式 `system:{module}:{action}`
- 审计：写操作必须记录 `operation_log`
- 幂等：批量操作支持幂等（重复提交不破坏状态）
- 并发：编辑接口支持乐观锁 `version`
- 导出：异步生成或流式导出，限制最大行数

## 6. 数据建模硬约束

- 所有业务表必须包含：
  - `id`（snowflake/uuid）
  - `status`（如适用）
  - `version`（乐观锁）
  - `created_by` / `created_at`
  - `updated_by` / `updated_at`
- 日志表只读，不提供更新/删除接口。

## 7. 模块清单

- Agent A: `system-users-backend.md`
- Agent B: `system-roles-backend.md`
- Agent C: `system-menus-backend.md`
- Agent D: `system-departments-backend.md`
- Agent E: `system-dicts-backend.md`
- Agent F: `system-logs-backend.md`
