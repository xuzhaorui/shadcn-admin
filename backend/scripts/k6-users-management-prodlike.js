import http from "k6/http";
import { check, sleep } from "k6";
import { SharedArray } from "k6/data";

const BASE_URL = __ENV.BASE_URL || "http://127.0.0.1:8081";

const ADMIN_USERNAME = __ENV.ADMIN_USERNAME || "admin@example.com";
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || "Admin@123";

const SEED_USER_COUNT = Number(__ENV.SEED_USER_COUNT || "1000");
const TEST_USER_PREFIX = __ENV.TEST_USER_PREFIX || "k6_user_";
const TEST_USER_DOMAIN = __ENV.TEST_USER_DOMAIN || "example.com";
const TEST_USER_PASSWORD = __ENV.TEST_USER_PASSWORD || "K6@123456";
const FORCE_RESET_PASSWORD = __ENV.FORCE_RESET_PASSWORD !== "0";

const TEMP_USER_PREFIX = __ENV.TEMP_USER_PREFIX || "k6_temp_";

const THINK_MIN = Number(__ENV.THINK_MIN || "1");
const THINK_MAX = Number(__ENV.THINK_MAX || "3");
const ACTIONS_PER_ITER = Number(__ENV.ACTIONS_PER_ITER || "2");

const STEP_COUNT = Number(__ENV.STEP_COUNT || "10");
const MAX_VUS = Number(__ENV.MAX_VUS || "100");
const STEP_DURATION = __ENV.STEP_DURATION || "1m";
const GRACEFUL_RAMP_DOWN = __ENV.GRACEFUL_RAMP_DOWN || "30s";

const users = new SharedArray("k6-seed-users", () => {
  const list = [];
  for (let i = 1; i <= SEED_USER_COUNT; i += 1) {
    const idx = String(i).padStart(4, "0");
    const username = `${TEST_USER_PREFIX}${idx}@${TEST_USER_DOMAIN}`;
    list.push({
      username,
      password: TEST_USER_PASSWORD,
      realName: `K6 User ${idx}`,
      email: username,
      phone: `188${String(i).padStart(8, "0")}`.slice(0, 11),
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
  setupTimeout: __ENV.SETUP_TIMEOUT || "20m",
  scenarios: {
    users_management_prod_like: {
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

function pickOne(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min, max) {
  if (max <= min) {
    return min;
  }
  return min + Math.random() * (max - min);
}

function thinkTime() {
  sleep(randomBetween(THINK_MIN, THINK_MAX));
}

function authParams(token, endpoint, withJson = false) {
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  if (withJson) {
    headers["Content-Type"] = "application/json";
  }
  return {
    headers,
    tags: { endpoint },
  };
}

function checkHttp200(res, label) {
  check(res, {
    [`${label} http 200`]: (r) => r.status === 200,
  });
}

function requireApi200(res, label) {
  checkHttp200(res, label);
  const body = parseJson(res);
  if (!body || body.code !== 200) {
    throw new Error(`${label} failed, http=${res.status}, body=${res.body}`);
  }
  return body.data;
}

function loginAndGetToken(username, password) {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ username, password }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { endpoint: "auth_login" },
    }
  );

  checkHttp200(res, "auth_login");
  const body = parseJson(res);
  const token =
    body &&
    body.code === 200 &&
    body.data &&
    typeof body.data.accessToken === "string" &&
    body.data.accessToken
      ? String(body.data.accessToken)
      : "";

  check(res, {
    "auth_login token exists": () => !!token,
  });

  return token;
}

function getFirstEnabledDepartmentId(adminToken) {
  const res = http.get(
    `${BASE_URL}/api/system/departments/tree`,
    authParams(adminToken, "seed_departments_tree")
  );
  const data = requireApi200(res, "seed_departments_tree");
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("no department found");
  }

  const queue = data.slice();
  let fallbackId = "";

  while (queue.length > 0) {
    const node = queue.shift();
    if (!node) {
      continue;
    }

    if (!fallbackId && node.id) {
      fallbackId = String(node.id);
    }

    const status = String(node.status || "").toLowerCase();
    if ((status === "enabled" || status === "") && node.id) {
      return String(node.id);
    }

    if (Array.isArray(node.children) && node.children.length > 0) {
      queue.push(...node.children);
    }
  }

  if (!fallbackId) {
    throw new Error("no usable department id found");
  }
  return fallbackId;
}

function getAdminRoleId(adminToken) {
  const res = http.get(
    `${BASE_URL}/api/system/roles/list?page=1&pageSize=200&keyword=admin`,
    authParams(adminToken, "seed_roles_list")
  );
  const data = requireApi200(res, "seed_roles_list");
  const list = data && Array.isArray(data.list) ? data.list : [];
  if (list.length === 0) {
    throw new Error("no role found for keyword=admin");
  }

  const exact = list.find((role) => String(role.code || "").toLowerCase() === "admin");
  const target = exact || list[0];
  return String(target.id);
}

function listExistingSeedUsers(adminToken) {
  const pageSize = 200;
  const keyword = encodeURIComponent(TEST_USER_PREFIX);
  const result = new Map();

  for (let page = 1; ; page += 1) {
    const url = `${BASE_URL}/api/system/users/list?page=${page}&pageSize=${pageSize}&keyword=${keyword}`;
    const res = http.get(url, authParams(adminToken, "seed_users_list"));
    const data = requireApi200(res, "seed_users_list");
    const list = data && Array.isArray(data.list) ? data.list : [];

    for (const item of list) {
      if (!item || typeof item.username !== "string") {
        continue;
      }
      if (item.username.startsWith(TEST_USER_PREFIX)) {
        result.set(item.username, item);
      }
    }

    if (list.length < pageSize) {
      break;
    }
  }

  return result;
}

function createUser(adminToken, user, departmentId, endpointTag = "seed_user_create") {
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
    authParams(adminToken, endpointTag, true)
  );
  checkHttp200(res, endpointTag);

  const body = parseJson(res);
  if (!body || body.code !== 200 || !body.data || !body.data.id) {
    return "";
  }
  return String(body.data.id);
}

function updateUserEnabled(adminToken, userId, user, departmentId) {
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
    authParams(adminToken, "seed_user_update", true)
  );
  requireApi200(res, "seed_user_update");
}

function assignRoles(adminToken, userId, roleIds, endpointTag = "seed_user_roles") {
  const res = http.post(
    `${BASE_URL}/api/system/users/${userId}/roles`,
    JSON.stringify({ roleIds }),
    authParams(adminToken, endpointTag, true)
  );
  requireApi200(res, endpointTag);
}

function resetPassword(adminToken, userId, newPassword, endpointTag = "seed_user_reset_password") {
  const res = http.post(
    `${BASE_URL}/api/system/users/${userId}/reset-password`,
    JSON.stringify({ newPassword }),
    authParams(adminToken, endpointTag, true)
  );
  requireApi200(res, endpointTag);
}

function genTempUser(data) {
  const nonce = `${Date.now()}_${__VU}_${__ITER}_${Math.floor(Math.random() * 1000000)}`;
  const username = `${TEMP_USER_PREFIX}${nonce}@${TEST_USER_DOMAIN}`;
  return {
    username,
    password: TEST_USER_PASSWORD,
    realName: `K6 Temp ${nonce}`,
    email: username,
    phone: `177${String(Math.floor(Math.random() * 100000000)).padStart(8, "0")}`,
    departmentId: data.departmentId,
  };
}

export function setup() {
  const adminToken = loginAndGetToken(ADMIN_USERNAME, ADMIN_PASSWORD);
  if (!adminToken) {
    throw new Error("admin login failed in setup()");
  }

  const departmentId = getFirstEnabledDepartmentId(adminToken);
  const adminRoleId = getAdminRoleId(adminToken);
  const existingByUsername = listExistingSeedUsers(adminToken);

  let created = 0;
  let updated = 0;
  let rolePatched = 0;
  let passwordReset = 0;

  const runtimeUsers = [];

  for (const user of users) {
    const existed = existingByUsername.get(user.username);
    let userId = existed && existed.id ? String(existed.id) : "";

    if (!userId) {
      userId = createUser(adminToken, user, departmentId);
      if (!userId) {
        throw new Error(`failed to create seed user: ${user.username}`);
      }
      created += 1;
      assignRoles(adminToken, userId, [adminRoleId], "seed_user_roles_create");
      rolePatched += 1;
      runtimeUsers.push({ ...user, id: userId, departmentId });
      continue;
    }

    const currentStatus = String(existed.status || "").toLowerCase();
    const currentDept = String(existed.departmentId || "");
    if (currentStatus !== "enabled" || currentDept !== String(departmentId)) {
      updateUserEnabled(adminToken, userId, user, departmentId);
      updated += 1;
    }

    const roleIds = Array.isArray(existed.roleIds) ? existed.roleIds.map(String) : [];
    if (!roleIds.includes(String(adminRoleId))) {
      assignRoles(adminToken, userId, [adminRoleId], "seed_user_roles_patch");
      rolePatched += 1;
    }

    if (FORCE_RESET_PASSWORD) {
      resetPassword(adminToken, userId, TEST_USER_PASSWORD, "seed_user_reset_password_patch");
      passwordReset += 1;
    }

    runtimeUsers.push({ ...user, id: userId, departmentId });
  }

  console.log(
    `seed users done: target=${users.length}, created=${created}, updated=${updated}, rolePatched=${rolePatched}, passwordReset=${passwordReset}`
  );

  return {
    adminRoleId: String(adminRoleId),
    departmentId: String(departmentId),
    runtimeUsers,
  };
}

function runGetList(token) {
  const keyword = encodeURIComponent(TEST_USER_PREFIX);
  const url = `${BASE_URL}/api/system/users/list?page=1&pageSize=20&status=enabled&keyword=${keyword}`;
  const res = http.get(url, authParams(token, "users_get_list"));
  checkHttp200(res, "users_get_list");
  thinkTime();
}

function runGetDetail(token, data) {
  const target = pickOne(data.runtimeUsers);
  const res = http.get(`${BASE_URL}/api/system/users/${target.id}`, authParams(token, "users_get_detail"));
  checkHttp200(res, "users_get_detail");
  thinkTime();
}

function runGetAvailableForRole(token, data) {
  const url = `${BASE_URL}/api/system/users/available-for-role?roleId=${encodeURIComponent(data.adminRoleId)}&page=1&pageSize=20`;
  const res = http.get(url, authParams(token, "users_get_available_for_role"));
  checkHttp200(res, "users_get_available_for_role");
  thinkTime();
}

function runGetExport(token) {
  const res = http.get(`${BASE_URL}/api/system/users/export`, authParams(token, "users_get_export"));
  checkHttp200(res, "users_get_export");
  thinkTime();
}

function runPostAssignRoles(token, data) {
  const target = pickOne(data.runtimeUsers);
  const res = http.post(
    `${BASE_URL}/api/system/users/${target.id}/roles`,
    JSON.stringify({ roleIds: [data.adminRoleId] }),
    authParams(token, "users_post_assign_roles", true)
  );
  checkHttp200(res, "users_post_assign_roles");
  thinkTime();
}

function runPostResetPassword(token, data) {
  const target = pickOne(data.runtimeUsers);
  const res = http.post(
    `${BASE_URL}/api/system/users/${target.id}/reset-password`,
    JSON.stringify({ newPassword: TEST_USER_PASSWORD }),
    authParams(token, "users_post_reset_password", true)
  );
  checkHttp200(res, "users_post_reset_password");
  thinkTime();
}

function runPostCreateAndDelete(token, data) {
  const tempUser = genTempUser(data);
  const tempId = createUser(token, tempUser, tempUser.departmentId, "users_post_create");
  if (!tempId) {
    return;
  }
  thinkTime();

  const delRes = http.del(
    `${BASE_URL}/api/system/users/${tempId}`,
    null,
    authParams(token, "users_delete_single")
  );
  checkHttp200(delRes, "users_delete_single");
  thinkTime();
}

function runDeleteBatchByCreate(token, data) {
  const t1 = genTempUser(data);
  const t2 = genTempUser(data);

  const id1 = createUser(token, t1, t1.departmentId, "users_post_create_for_batch");
  if (!id1) {
    return;
  }
  thinkTime();

  const id2 = createUser(token, t2, t2.departmentId, "users_post_create_for_batch");
  if (!id2) {
    return;
  }
  thinkTime();

  const batchRes = http.request(
    "DELETE",
    `${BASE_URL}/api/system/users/batch`,
    JSON.stringify({ ids: [id1, id2] }),
    authParams(token, "users_delete_batch", true)
  );
  checkHttp200(batchRes, "users_delete_batch");
  thinkTime();
}

function runPutUpdate(token, data) {
  const target = pickOne(data.runtimeUsers);
  const payload = {
    username: target.username,
    realName: target.realName,
    email: target.email,
    phone: `176${String(Math.floor(Math.random() * 100000000)).padStart(8, "0")}`,
    departmentId: target.departmentId || data.departmentId,
    status: "enabled",
  };
  const res = http.put(
    `${BASE_URL}/api/system/users/${target.id}`,
    JSON.stringify(payload),
    authParams(token, "users_put_update", true)
  );
  checkHttp200(res, "users_put_update");
  thinkTime();
}

function runPatchStatus(token, data) {
  const target = pickOne(data.runtimeUsers);
  const res = http.patch(
    `${BASE_URL}/api/system/users/${target.id}/status`,
    JSON.stringify({ status: "enabled" }),
    authParams(token, "users_patch_status", true)
  );
  checkHttp200(res, "users_patch_status");
  thinkTime();
}

function runQueryAction(token, data) {
  const r = Math.random();
  if (r < 0.5) {
    runGetList(token);
    return;
  }
  if (r < 0.75) {
    runGetDetail(token, data);
    return;
  }
  if (r < 0.9) {
    runGetAvailableForRole(token, data);
    return;
  }
  runGetExport(token);
}

function runWriteAction(token, data) {
  const r = Math.random();
  if (r < 0.35) {
    runPostAssignRoles(token, data);
    return;
  }
  if (r < 0.6) {
    runPostResetPassword(token, data);
    return;
  }
  if (r < 0.85) {
    runPostCreateAndDelete(token, data);
    return;
  }
  runDeleteBatchByCreate(token, data);
}

function runUpdateAction(token, data) {
  const r = Math.random();
  if (r < 0.7) {
    runPutUpdate(token, data);
    return;
  }
  runPatchStatus(token, data);
}

function pickActionCategory() {
  const r = Math.random();
  if (r < 0.7) {
    return "query";
  }
  if (r < 0.9) {
    return "write";
  }
  return "update";
}

export default function (data) {
  if (!data || !Array.isArray(data.runtimeUsers) || data.runtimeUsers.length === 0) {
    sleep(1);
    return;
  }

  const actor = pickOne(users);
  const token = loginAndGetToken(actor.username, actor.password);
  if (!token) {
    sleep(1);
    return;
  }
  thinkTime();

  for (let i = 0; i < ACTIONS_PER_ITER; i += 1) {
    const category = pickActionCategory();
    if (category === "query") {
      runQueryAction(token, data);
    } else if (category === "write") {
      runWriteAction(token, data);
    } else {
      runUpdateAction(token, data);
    }
  }
}
