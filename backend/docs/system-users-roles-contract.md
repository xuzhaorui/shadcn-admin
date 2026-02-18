# Users + Roles Frontend Contract

This file is the first integration contract for frontend-backend alignment.

## 1. Auth

- `POST /api/auth/login`
- request:

```json
{
  "username": "admin",
  "password": "123456"
}
```

- response `data`:

```json
{
  "accessToken": "jwt-token",
  "tokenType": "Bearer",
  "expiresIn": 7200,
  "userId": "u-1",
  "username": "admin",
  "permissions": ["*"]
}
```

Frontend must send header: `Authorization: Bearer <accessToken>`.

## 2. Users list

- `GET /api/system/users/list?page=1&pageSize=20&keyword=&status=&departmentId=`
- response `data`:

```json
{
  "list": [
    {
      "id": "u-1",
      "username": "admin",
      "realName": "Admin",
      "email": "admin@example.com",
      "phone": "13800000000",
      "departmentId": "d-1",
      "roleIds": ["r-1"],
      "status": "enabled"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 20
}
```

## 3. User create/update

- create: `POST /api/system/users`
- update: `PUT /api/system/users/{id}`
- request body:

```json
{
  "username": "jane",
  "realName": "Jane",
  "email": "jane@example.com",
  "phone": "13811112222",
  "departmentId": "d-1",
  "roleIds": ["r-2"],
  "status": "enabled",
  "password": "123456"
}
```

## 4. Roles list

- `GET /api/system/roles/list?page=1&pageSize=20&keyword=&status=`
- response `data.list[i]`:

```json
{
  "id": "r-1",
  "code": "admin",
  "name": "Administrator",
  "status": "enabled",
  "dataScope": "all",
  "menuIds": ["m-1", "m-2"]
}
```

## 5. Roles permissions and users

- `GET /api/system/roles/{id}/permissions` -> `string[]`
- `POST /api/system/roles/{id}/permissions`
- body:

```json
{ "menuIds": ["m-1", "m-2"] }
```

- `GET /api/system/roles/{id}/users` -> `string[]` user ids
- `POST /api/system/roles/{id}/users`
- `DELETE /api/system/roles/{id}/users`
- body:

```json
{ "userIds": ["u-1", "u-2"] }
```

## 6. Unified response envelope

All endpoints return:

```json
{
  "code": 200,
  "message": "ok",
  "data": {}
}
```
