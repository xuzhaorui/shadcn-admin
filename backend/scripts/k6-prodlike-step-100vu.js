import http from "k6/http";
import { check, sleep } from "k6";
import { SharedArray } from "k6/data";

const BASE_URL = __ENV.BASE_URL || "http://127.0.0.1:8081";
const ADMIN_USERNAME = __ENV.ADMIN_USERNAME || "admin@example.com";
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || "Admin@123";

const TEST_USER_PREFIX = __ENV.TEST_USER_PREFIX || "k6_user_";
const TEST_USER_DOMAIN = __ENV.TEST_USER_DOMAIN || "example.com";
const TEST_USER_PASSWORD = __ENV.TEST_USER_PASSWORD || "K6@123456";
const SEED_USER_COUNT = Number(__ENV.SEED_USER_COUNT || "1000");

const THINK_MIN = Number(__ENV.THINK_MIN || "1");
const THINK_MAX = Number(__ENV.THINK_MAX || "3");
const ACTIONS_PER_ITER = Number(__ENV.ACTIONS_PER_ITER || "2");

const STEP_COUNT = Number(__ENV.STEP_COUNT || "10");
const MAX_VUS = Number(__ENV.MAX_VUS || "100");
const STEP_DURATION = __ENV.STEP_DURATION || "1m";
const GRACEFUL_RAMP_DOWN = __ENV.GRACEFUL_RAMP_DOWN || "30s";

const users = new SharedArray("k6-users", () => {
  const list = [];
  for (let i = 1; i <= SEED_USER_COUNT; i += 1) {
    const idx = String(i).padStart(4, "0");
    const username = `${TEST_USER_PREFIX}${idx}@${TEST_USER_DOMAIN}`;
    list.push({
      username,
      password: TEST_USER_PASSWORD,
      realName: `K6 User ${idx}`,
      email: username,
      phone: `1880000${idx}`,
    });
  }
  return list;
});

function buildStages() {
  const stages = [];
  for (let i = 1; i <= STEP_COUNT; i += 1) {
    stages.push({
      duration: STEP_DURATION,
      target: Math.round((i * MAX_VUS) / STEP_COUNT),
    });
  }
  return stages;
}

export const options = {
  scenarios: {
    prod_like_step: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: buildStages(),
      gracefulRampDown: GRACEFUL_RAMP_DOWN,
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
    checks: ["rate>0.99"],
  },
};

function parseJson(res) {
  try {
    return JSON.parse(res.body);
  } catch (_err) {
    return null;
  }
}

function authHeaders(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
}

function pickOne(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSleep() {
  const sec = THINK_MIN + Math.random() * Math.max(THINK_MAX - THINK_MIN, 0);
  sleep(sec);
}

function pickAction() {
  const r = Math.random();
  if (r < 0.7) {
    return "GET_QUERY";
  }
  if (r < 0.9) {
    return "POST_WRITE";
  }
  return "PUT_UPDATE";
}

function loginAndGetToken(username, password) {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ username, password }),
    { headers: { "Content-Type": "application/json" }, tags: { endpoint: "auth_login" } }
  );
  const body = parseJson(res);
  const ok = check(res, {
    "login http 200": (r) => r.status === 200,
    "login code 200": () => !!body && body.code === 200,
    "login token exists": () => !!body && !!body.data && !!body.data.accessToken,
  });
  if (!ok) {
    return "";
  }
  return String(body.data.accessToken);
}

function ensureOk(res, label) {
  const body = parseJson(res);
  check(res, {
    [`${label} http 200`]: (r) => r.status === 200,
    [`${label} code 200`]: () => !!body && body.code === 200,
  });
  return body;
}

function getFirstEnabledDepartmentId(adminToken) {
  const res = http.get(`${BASE_URL}/api/system/departments/tree`, authHeaders(adminToken));
  const body = ensureOk(res, "seed_dept_tree");
  if (!body || !body.data || !Array.isArray(body.data)) {
    throw new Error("failed to read departments tree");
  }

  const stack = [...body.data];
  while (stack.length > 0) {
    const node = stack.shift();
    if (node && node.status === "enabled" && node.id) {
      return String(node.id);
    }
    if (node && Array.isArray(node.children) && node.children.length > 0) {
      stack.push(...node.children);
    }
  }
  throw new Error("no enabled department found");
}

function getAdminRoleId(adminToken) {
  const url = `${BASE_URL}/api/system/roles/list?page=1&pageSize=200&keyword=admin`;
  const res = http.get(url, authHeaders(adminToken));
  const body = ensureOk(res, "seed_roles_list");
  const roles = body && body.data && Array.isArray(body.data.list) ? body.data.list : [];
  if (roles.length === 0) {
    throw new Error("no roles found for keyword=admin");
  }
  const exact = roles.find((r) => String(r.code).toLowerCase() === "admin");
  return String((exact || roles[0]).id);
}

function listExistingUsersByPrefix(adminToken) {
  const map = new Map();
  const pageSize = 200;
  let page = 1;

  while (true) {
    const keyword = encodeURIComponent(TEST_USER_PREFIX);
    const url = `${BASE_URL}/api/system/users/list?page=${page}&pageSize=${pageSize}&keyword=${keyword}`;
    const res = http.get(url, authHeaders(adminToken));
    const body = ensureOk(res, "seed_users_list");
    const list = body && body.data && Array.isArray(body.data.list) ? body.data.list : [];

    for (const u of list) {
      if (u && typeof u.username === "string" && u.username.startsWith(TEST_USER_PREFIX)) {
        map.set(u.username, u);
      }
    }

    if (list.length < pageSize) {
      break;
    }
    page += 1;
  }

  return map;
}

function createUser(adminToken, user, departmentId) {
  const payload = {
    username: user.username,
    realName: user.realName,
    email: user.email,
    phone: user.phone,
    departmentId,
    status: "enabled",
    password: user.password,
  };
  const res = http.post(
    `${BASE_URL}/api/system/users`,
    JSON.stringify(payload),
    authHeaders(adminToken)
  );
  const body = ensureOk(res, "seed_user_create");
  const id = body && body.data ? body.data.id : "";
  if (!id) {
    throw new Error(`failed to create user ${user.username}`);
  }
  return String(id);
}

function updateUserToEnabled(adminToken, userId, user, departmentId) {
  const payload = {
    username: user.username,
    realName: user.realName,
    email: user.email,
    phone: user.phone,
    departmentId,
    status: "enabled",
  };
  const res = http.put(
    `${BASE_URL}/api/system/users/${userId}`,
    JSON.stringify(payload),
    authHeaders(adminToken)
  );
  ensureOk(res, "seed_user_update");
}

function assignAdminRole(adminToken, userId, adminRoleId) {
  const res = http.post(
    `${BASE_URL}/api/system/users/${userId}/roles`,
    JSON.stringify({ roleIds: [adminRoleId] }),
    authHeaders(adminToken)
  );
  ensureOk(res, "seed_user_assign_role");
}

export function setup() {
  const adminToken = loginAndGetToken(ADMIN_USERNAME, ADMIN_PASSWORD);
  if (!adminToken) {
    throw new Error("admin login failed in setup()");
  }

  const departmentId = getFirstEnabledDepartmentId(adminToken);
  const adminRoleId = getAdminRoleId(adminToken);
  const existingByUsername = listExistingUsersByPrefix(adminToken);

  let created = 0;
  let updated = 0;
  let rolePatched = 0;
  const runtimeUsers = [];

  for (const user of users) {
    const existed = existingByUsername.get(user.username);
    let userId = existed ? String(existed.id) : "";

    if (!userId) {
      userId = createUser(adminToken, user, departmentId);
      created += 1;
      assignAdminRole(adminToken, userId, adminRoleId);
      rolePatched += 1;
      runtimeUsers.push({ ...user, id: userId, departmentId });
      continue;
    }

    const status = String(existed.status || "");
    const deptId = String(existed.departmentId || "");
    if (status !== "enabled" || deptId !== String(departmentId)) {
      updateUserToEnabled(adminToken, userId, user, departmentId);
      updated += 1;
    }

    const roleIds = Array.isArray(existed.roleIds) ? existed.roleIds.map(String) : [];
    if (!roleIds.includes(String(adminRoleId))) {
      assignAdminRole(adminToken, userId, adminRoleId);
      rolePatched += 1;
    }

    runtimeUsers.push({ ...user, id: userId, departmentId });
  }

  console.log(
    `seed summary: target=${users.length}, created=${created}, updated=${updated}, role_patched=${rolePatched}`
  );

  return {
    adminRoleId: String(adminRoleId),
    departmentId: String(departmentId),
    runtimeUsers,
  };
}

function runGetQuery(token) {
  const keyword = encodeURIComponent(TEST_USER_PREFIX);
  const url = `${BASE_URL}/api/system/users/list?page=1&pageSize=20&status=enabled&keyword=${keyword}`;
  const res = http.get(url, { ...authHeaders(token), tags: { endpoint: "users_get_list" } });
  ensureOk(res, "get_users_list");
}

function runPostWrite(token, data) {
  const target = pickOne(data.runtimeUsers);
  const url = `${BASE_URL}/api/system/users/${target.id}/roles`;
  const body = JSON.stringify({ roleIds: [data.adminRoleId] });
  const res = http.post(url, body, { ...authHeaders(token), tags: { endpoint: "users_post_roles" } });
  ensureOk(res, "post_assign_roles");
}

function runPutUpdate(token, data) {
  const target = pickOne(data.runtimeUsers);
  const phoneSuffix = String(Math.floor(Math.random() * 100000)).padStart(5, "0");
  const payload = {
    username: target.username,
    realName: target.realName,
    email: target.email,
    phone: `177${phoneSuffix}${String(__VU).padStart(3, "0")}`.slice(0, 11),
    departmentId: target.departmentId || data.departmentId,
    status: "enabled",
  };
  const url = `${BASE_URL}/api/system/users/${target.id}`;
  const res = http.put(url, JSON.stringify(payload), {
    ...authHeaders(token),
    tags: { endpoint: "users_put_update" },
  });
  ensureOk(res, "put_update_user");
}

export default function (data) {
  const actor = pickOne(users);
  const token = loginAndGetToken(actor.username, actor.password);
  if (!token) {
    sleep(1);
    return;
  }

  randomSleep();

  for (let i = 0; i < ACTIONS_PER_ITER; i += 1) {
    const action = pickAction();
    if (action === "GET_QUERY") {
      runGetQuery(token);
    } else if (action === "POST_WRITE") {
      runPostWrite(token, data);
    } else {
      runPutUpdate(token, data);
    }
    randomSleep();
  }
}
