const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:8081";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";

const TARGET_ROLE_COUNT = Number(process.env.TARGET_ROLE_COUNT || "150");
const ROLE_PREFIX = process.env.ROLE_PREFIX || "k6_load_role_";
const USER_PREFIX = process.env.USER_PREFIX || "k6_user_";
const MAX_MENU_PER_ROLE = Number(process.env.MAX_MENU_PER_ROLE || "12");
const USER_ASSIGN_CONCURRENCY = Number(process.env.USER_ASSIGN_CONCURRENCY || "12");
const PAGE_SIZE = Number(process.env.PAGE_SIZE || "200");

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sampleUnique(arr, count) {
  if (count >= arr.length) return [...arr];
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

async function request(path, { method = "GET", token = "", body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let json = null;
  try {
    json = await res.json();
  } catch (_err) {
    throw new Error(`non-json response: ${method} ${path}, http=${res.status}`);
  }

  if (res.status !== 200 || !json || json.code !== 200) {
    throw new Error(
      `request failed: ${method} ${path}, http=${res.status}, body=${JSON.stringify(json)}`
    );
  }
  return json.data;
}

async function login() {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: { username: ADMIN_USERNAME, password: ADMIN_PASSWORD },
  });
  if (!data || !data.accessToken) {
    throw new Error("admin login failed: no accessToken");
  }
  return String(data.accessToken);
}

function flattenMenuIds(tree) {
  const ids = [];
  const stack = Array.isArray(tree) ? [...tree] : [];
  while (stack.length > 0) {
    const n = stack.pop();
    if (!n) continue;
    if (n.id) ids.push(String(n.id));
    if (Array.isArray(n.children) && n.children.length > 0) {
      stack.push(...n.children);
    }
  }
  return ids;
}

async function listRolesByKeyword(token, keyword) {
  const all = [];
  for (let page = 1; ; page += 1) {
    const q = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      keyword,
    }).toString();
    const data = await request(`/api/system/roles/list?${q}`, { token });
    const list = Array.isArray(data?.list) ? data.list : [];
    all.push(...list);
    if (list.length < PAGE_SIZE) break;
  }
  return all;
}

async function ensureTargetRoles(token, menuIds) {
  const existing = await listRolesByKeyword(token, ROLE_PREFIX);
  const matched = existing.filter((r) => String(r.code || "").startsWith(ROLE_PREFIX));
  const roleByCode = new Map(matched.map((r) => [String(r.code), String(r.id)]));

  let created = 0;
  for (let i = 1; i <= TARGET_ROLE_COUNT; i += 1) {
    const code = `${ROLE_PREFIX}${String(i).padStart(3, "0")}`;
    if (roleByCode.has(code)) continue;

    const createData = await request("/api/system/roles", {
      method: "POST",
      token,
      body: {
        code,
        name: `K6 Load Role ${String(i).padStart(3, "0")}`,
        status: "enabled",
      },
    });
    roleByCode.set(code, String(createData.id));
    created += 1;
  }

  const finalRoles = [];
  for (let i = 1; i <= TARGET_ROLE_COUNT; i += 1) {
    const code = `${ROLE_PREFIX}${String(i).padStart(3, "0")}`;
    const id = roleByCode.get(code);
    if (!id) {
      throw new Error(`role id missing after ensure: ${code}`);
    }
    finalRoles.push({ code, id });
  }

  let permissionPatched = 0;
  for (const role of finalRoles) {
    const menuPickCount = Math.min(
      menuIds.length,
      Math.max(1, randInt(1, Math.max(1, MAX_MENU_PER_ROLE)))
    );
    const pickedMenuIds = sampleUnique(menuIds, menuPickCount);
    await request(`/api/system/roles/${role.id}/permissions`, {
      method: "POST",
      token,
      body: { menuIds: pickedMenuIds },
    });
    permissionPatched += 1;
  }

  return {
    created,
    permissionPatched,
    roles: finalRoles,
  };
}

async function listSeedUsers(token) {
  const users = [];
  for (let page = 1; ; page += 1) {
    const q = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      keyword: USER_PREFIX,
    }).toString();
    const data = await request(`/api/system/users/list?${q}`, { token });
    const list = Array.isArray(data?.list) ? data.list : [];
    for (const u of list) {
      if (u && typeof u.username === "string" && u.username.startsWith(USER_PREFIX)) {
        users.push({ id: String(u.id), username: String(u.username) });
      }
    }
    if (list.length < PAGE_SIZE) break;
  }
  return users;
}

async function assignRolesToUsers(token, users, roleIds) {
  let success = 0;
  let failed = 0;
  let idx = 0;

  async function worker() {
    while (true) {
      const current = idx;
      idx += 1;
      if (current >= users.length) return;

      const user = users[current];
      const pickCount = randInt(1, Math.min(3, roleIds.length));
      const pickedRoleIds = sampleUnique(roleIds, pickCount);

      try {
        await request(`/api/system/users/${user.id}/roles`, {
          method: "POST",
          token,
          body: { roleIds: pickedRoleIds },
        });
        success += 1;
      } catch (err) {
        failed += 1;
        console.error(`assign failed for ${user.username}: ${String(err)}`);
      }
    }
  }

  const workers = [];
  const workerCount = Math.max(1, USER_ASSIGN_CONCURRENCY);
  for (let i = 0; i < workerCount; i += 1) {
    workers.push(worker());
  }
  await Promise.all(workers);

  return { success, failed };
}

async function main() {
  console.log(`[start] base=${BASE_URL}`);
  const token = await login();
  console.log("[ok] admin login");

  const menuTree = await request("/api/system/menus/tree", { token });
  const menuIds = flattenMenuIds(menuTree);
  if (menuIds.length === 0) throw new Error("no menus found");
  console.log(`[ok] menu count=${menuIds.length}`);

  const roleResult = await ensureTargetRoles(token, menuIds);
  console.log(
    `[ok] roles ensured: target=${TARGET_ROLE_COUNT}, created=${roleResult.created}, permissionsUpdated=${roleResult.permissionPatched}`
  );

  const users = await listSeedUsers(token);
  console.log(`[ok] users matched prefix "${USER_PREFIX}": count=${users.length}`);
  if (users.length === 0) {
    throw new Error("no users found for assignment");
  }

  const roleIds = roleResult.roles.map((r) => r.id);
  const assignResult = await assignRolesToUsers(token, users, roleIds);
  console.log(
    `[done] users role reassigned: success=${assignResult.success}, failed=${assignResult.failed}, super-admin removed by full replace`
  );
}

main().catch((err) => {
  console.error(`[fatal] ${String(err)}`);
  process.exitCode = 1;
});
