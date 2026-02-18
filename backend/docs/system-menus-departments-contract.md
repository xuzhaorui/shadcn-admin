# Menus + Departments Frontend Contract

This file is the second integration contract for frontend-backend alignment.

## 1. Menus tree

- `GET /api/system/menus/tree`
- response `data`:

```json
[
  {
    "id": "m-root",
    "parentId": "0",
    "type": "directory",
    "name": "System",
    "code": "system-root",
    "path": "/system",
    "icon": "settings",
    "sort": 0,
    "visible": "show",
    "status": "enabled",
    "children": [
      {
        "id": "m-user",
        "parentId": "m-root",
        "type": "menu",
        "name": "Users",
        "code": "system-users",
        "path": "/system/users",
        "icon": "user",
        "sort": 0,
        "visible": "show",
        "status": "enabled",
        "children": []
      }
    ]
  }
]
```

## 2. Menu create/update

- create: `POST /api/system/menus`
- update: `PUT /api/system/menus/{id}`
- request body:

```json
{
  "parentId": "m-root",
  "type": "menu",
  "name": "Users",
  "code": "system-users",
  "path": "/system/users",
  "icon": "user",
  "sort": 10,
  "visible": "show",
  "status": "enabled"
}
```

## 3. Menu reorder

- `POST /api/system/menus/reorder`
- request body:

```json
{
  "parentId": "m-root",
  "orderedIds": ["m-user", "m-role", "m-menu"]
}
```

## 4. Departments tree

- `GET /api/system/departments/tree`
- response `data`:

```json
[
  {
    "id": "d-root",
    "parentId": "0",
    "name": "Headquarters",
    "code": "hq",
    "sort": 0,
    "status": "enabled",
    "children": [
      {
        "id": "d-rd",
        "parentId": "d-root",
        "name": "R&D",
        "code": "rd",
        "sort": 0,
        "status": "enabled",
        "children": []
      }
    ]
  }
]
```

## 5. Department create/update/reorder/status

- create: `POST /api/system/departments`
- update: `PUT /api/system/departments/{id}`
- reorder: `POST /api/system/departments/reorder`
- status: `PATCH /api/system/departments/{id}/status`

request body samples:

```json
{
  "parentId": "d-root",
  "name": "R&D",
  "code": "rd",
  "sort": 10,
  "status": "enabled"
}
```

```json
{
  "parentId": "d-root",
  "orderedIds": ["d-rd", "d-ops"]
}
```

```json
{
  "status": "disabled"
}
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
