import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://127.0.0.1:8081";
const USERNAME = __ENV.USERNAME || "admin@example.com";
const PASSWORD = __ENV.PASSWORD || "Admin@123";
const STATIC_ACCESS_TOKEN = __ENV.ACCESS_TOKEN || "";
const THINK_TIME_MIN = Number(__ENV.THINK_TIME_MIN || "0.2");
const THINK_TIME_MAX = Number(__ENV.THINK_TIME_MAX || "1.0");

const appErrorRate = new Rate("app_error_rate");
const loginFailRate = new Rate("login_fail_rate");

export const options = {
  scenarios: {
    steady_users: {
      executor: "constant-vus",
      vus: Number(__ENV.VUS || "1000"),
      duration: __ENV.DURATION || "5m",
      gracefulStop: __ENV.GRACEFUL_STOP || "30s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1200", "p(99)<2500"],
    app_error_rate: ["rate<0.01"],
    login_fail_rate: ["rate==0"],
  },
  summaryTrendStats: ["avg", "min", "med", "p(90)", "p(95)", "p(99)", "max"],
};

let accessToken = STATIC_ACCESS_TOKEN;

function randomThinkTime() {
  if (THINK_TIME_MAX <= THINK_TIME_MIN) {
    return THINK_TIME_MIN;
  }
  return THINK_TIME_MIN + Math.random() * (THINK_TIME_MAX - THINK_TIME_MIN);
}

function jsonPath(res, path) {
  try {
    return res.json(path);
  } catch (_err) {
    return null;
  }
}

function login() {
  const payload = JSON.stringify({
    username: USERNAME,
    password: PASSWORD,
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
    tags: {
      endpoint: "auth_login",
    },
  };

  const res = http.post(`${BASE_URL}/api/auth/login`, payload, params);
  if (__ENV.DEBUG === "1") {
    console.log(`login body: ${res.body}`);
  }
  const appCode = Number(jsonPath(res, "code"));
  const token = jsonPath(res, "data.accessToken");
  const ok =
    check(res, {
      "login status is 200": (r) => r.status === 200,
      "login payload has token": () => appCode === 200 && !!token,
    }) && appCode === 200 && !!token;

  if (!ok) {
    loginFailRate.add(1);
    accessToken = "";
    return false;
  }

  loginFailRate.add(0);
  accessToken = String(token);
  return true;
}

function authParams(endpoint) {
  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    tags: {
      endpoint,
    },
  };
}

function callGet(url, endpoint) {
  const res = http.get(url, authParams(endpoint));
  const appCode = Number(jsonPath(res, "code"));
  const appMessage = jsonPath(res, "message");
  const isOk =
    res.status === 200 &&
    appCode === 200 &&
    appMessage === "ok";

  appErrorRate.add(isOk ? 0 : 1);
  check(res, {
    [`${endpoint} http 200`]: (r) => r.status === 200,
    [`${endpoint} app code 200`]: () => isOk,
  });
}

export default function () {
  if (!accessToken) {
    if (!login()) {
      sleep(1);
      return;
    }
  }

  const roll = Math.random();

  if (roll < 0.55) {
    callGet(`${BASE_URL}/api/auth/me`, "auth_me");
  } else if (roll < 0.8) {
    callGet(`${BASE_URL}/api/system/users/list?page=1&pageSize=20`, "users_list");
  } else if (roll < 0.92) {
    callGet(`${BASE_URL}/api/system/roles/list?page=1&pageSize=20`, "roles_list");
  } else {
    callGet(`${BASE_URL}/api/system/menus/tree`, "menus_tree");
  }

  sleep(randomThinkTime());
}
