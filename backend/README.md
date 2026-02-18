# shadcn-admin backend skeleton

Initial backend skeleton for system management modules.

## Stack
- Spring Boot 3.x
- Spring WebFlux
- MyBatis + MySQL 8
- No Redis in initial architecture

## Why no Redis now
- Follow first-principles simplification: DB as single source of truth first.
- Remove non-essential infra at v1 stage.
- Add Redis only when measurable bottleneck exists.

## Modules
- Users: `/api/system/users/*`
- Roles: `/api/system/roles/*`
- Menus: `/api/system/menus/*`
- Departments: `/api/system/departments/*`
- Dictionaries: `/api/system/dictionaries/*`
- Logs: `/api/system/logs/*`

## Run
1. Create database `shadcn_admin`.
2. Execute `backend/sql/001_schema.sql`.
3. Update DB config in `backend/src/main/resources/application.yml`.
4. Set `app.auth.jwt-secret` with a 32+ chars key.
5. Run:

```bash
cd backend
mvn spring-boot:run
```

## WebFlux + MyBatis rule
All MyBatis calls are wrapped in `BlockingMyBatisExecutor` and executed on `Schedulers.boundedElastic()`.

## Notes
- Export endpoints are placeholders with guardrail notes.
- AuthN/AuthZ and AOP audit write are not fully integrated in this skeleton yet.

## Auth
- Login: `POST /api/auth/login`
- JWT protects all `/api/**` except login.
- Current permission checks are enabled for `Users`, `Roles`, `Menus`, `Departments`.
- Integration contract: `backend/docs/system-users-roles-contract.md`.
- Integration contract: `backend/docs/system-menus-departments-contract.md`.
- Password policy in code path:
  - create/reset user writes BCrypt hash
  - login supports BCrypt and legacy plaintext fallback (for old seed data migration)

## Audit
- Login audit writes `sys_login_log` on both success and failed login attempts.
- Write operations under `/api/system/**` write `sys_operation_log` asynchronously.

## One-time password migration (plaintext -> BCrypt)
Run once:

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.arguments="--app.migration.password-bcrypt-enabled=true --spring.main.web-application-type=none"
```

After migration, login accepts BCrypt hashes only.
