# shadcn-admin backend skeleton

Initial backend skeleton for system management modules.

## Stack
- Spring Boot 3.x
- Spring WebFlux
- MyBatis + MySQL 8
- Caffeine (local in-memory cache for auth/session state)

## Cache Principle
- Keep core business simple: no external cache infrastructure.
- Auth/session transient state is held in local Caffeine caches.
- If future scale requires distributed state, add that only with measured evidence.

## Modules
- Users: `/api/system/users/*`
- Roles: `/api/system/roles/*`
- Menus: `/api/system/menus/*`
- Departments: `/api/system/departments/*`
- Logs: `/api/system/logs/*`

## Run
1. Create database `shadcn_admin`.
2. Execute `backend/sql/001_schema.sql`.
3. Update env vars (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`).
4. Set `APP_AUTH_JWT_SECRET` with a 32+ chars key.
5. Run:

```bash
cd backend
mvn spring-boot:run
```

## Profiles
- `dev` (default): local Caffeine-backed auth/session state.
- `prod`: local Caffeine-backed auth/session state + startup safety guard.

## Production Baseline
`prod` startup enforces:
- `app.auth.jwt-secret` must be non-default and >= 32 chars
- `app.auth.cookie-secure=true`
- `app.auth.allow-register=false`
- `app.seed.enabled=false`
- reject `root/root` datasource credential

## Auth Smoke Test
Run end-to-end auth hardening checks (login -> me -> refresh -> permission deny -> logout -> post-logout invalidation):

```powershell
cd backend
powershell -ExecutionPolicy Bypass -File .\scripts\auth-smoke.ps1
```

Optional params:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\auth-smoke.ps1 `
  -ApiBaseUrl "http://127.0.0.1:8081/api" `
  -AdminUsername "admin@example.com" `
  -AdminPassword "Admin@123"
```

## WebFlux + MyBatis rule
All MyBatis calls are wrapped in `BlockingMyBatisExecutor` and executed on `Schedulers.boundedElastic()`.

## Notes
- Export endpoints are placeholders with guardrail notes.
- AuthN/AuthZ and AOP audit write are not fully integrated in this skeleton yet.
- Quartz `invokeTarget` is restricted to enum targets: `LOG_CLEANUP`, `DATA_BACKUP`.

## Auth
- Login: `POST /api/auth/login`
- JWT protects all `/api/**` except login.
- Current permission checks are enabled for `Users`, `Roles`, `Menus`, `Departments`.
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
