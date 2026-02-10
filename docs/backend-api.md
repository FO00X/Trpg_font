# 前端对接文档（FastAPI 后端实现参考）

本文档描述 TRPG 前端当前使用的数据格式与期望的 HTTP / WebSocket 接口，供 FastAPI 后端实现时对接使用。  
前端项目：Vue 3 + Vite，请求通过 Vite 代理 `/api` 到后端（开发时 `http://localhost:3000`）。

---

## 后端实现状态（TRPG_back）

当前 FastAPI 后端已按本文档实现以下部分，供前端联调与部署参考。

| 模块 | 状态 | 说明 |
|------|------|------|
| **认证** | ✅ 已实现 | `POST /api/auth/login`、`GET /api/auth/me`；401 全局统一返回 `{ ok: false, message: "未登录或登录已过期" }` |
| **角色卡** | ✅ 已实现 | `GET/POST/PUT/DELETE /api/characters`，结构与文档第三节一致；当前为内存存储，按用户分桶 |
| **大厅** | ✅ 已实现 | `GET /api/game-rooms`（keyword、status、module 查询）、`GET /api/game-rooms/modules`、`GET /api/game-rooms/tags`、`GET/POST /api/game-rooms`、`POST /api/game-rooms/:id/apply`；当前为内存存储 |
| **Socket** | ✅ 已实现 | 使用 **python-socketio**，与 FastAPI 共端口，需通过 **ASGI** 启动：`uvicorn app.main:asgi_app --reload --port 3000`。事件：**join**（客户端发 `{ channelId }` 进入频道）、**message**（客户端发消息，服务端按 channelId 广播） |
| **频道/子频道 REST** | ✅ 已实现 | `GET /api/channels` → `{ ok, channels, modules }`（含 subChannels、userAccess） |
| **历史消息** | ✅ 已实现 | `GET /api/channels/:channelId/messages?limit=50&before=msgId` → `{ ok, messages }`；Socket 收到的 message 会写入历史供拉取 |

**前端联调要点**

- 后端启动：在 `TRPG_back` 目录执行 `uvicorn app.main:asgi_app --reload --port 3000`（必须用 `asgi_app` 才能同时提供 HTTP 与 Socket）。
- Socket 同域：前端设置 `VITE_SOCKET_URL=http://localhost:3000` 即可与后端同域连接（开发时 Vite 代理只代理 `/api`，Socket 需直连 3000 或通过同一 host 访问）。

---

## 一、通用约定

### 1.1 Base URL 与 CORS

- **接口前缀**：所有 HTTP 接口建议统一为 `/api`（例如 `POST /api/auth/login`）。
- **CORS**：后端需允许前端域名（开发时为 `http://localhost:8089`，生产时为你的前端域名）跨域访问，并视需要支持 `credentials: true`（若使用 Cookie）。

### 1.2 鉴权

- 登录成功后，前端将 `token` 存入 localStorage（key：`foxtrpg-auth`），并与 `user.username` 一起保存。
- **需要鉴权的接口**：请求头中携带：
  ```http
  Authorization: Bearer <token>
  ```
- 若 token 无效或过期，建议返回 `401`，响应体建议：`{ "ok": false, "message": "未登录或登录已过期" }`。

### 1.3 统一响应结构

- **成功**：HTTP 2xx，业务成功时建议 body 含 `"ok": true`，以及具体数据字段。
- **业务失败**：可返回 4xx，body 建议：`{ "ok": false, "message": "错误说明" }`。
- 前端对 `ok` 和 `message` 会做统一处理（如登录页展示 `message`）。

---

## 二、认证接口

### 2.1 登录（已对接）

| 项目 | 说明 |
|------|------|
| **URL** | `POST /api/auth/login` |
| **请求头** | `Content-Type: application/json` |
| **请求体** | `{ "username": "string", "password": "string" }` |
| **成功响应** | HTTP 200，Body：`{ "ok": true, "token": "string", "user": { "username": "string" } }` |
| **失败响应** | HTTP 401，Body：`{ "ok": false, "message": "用户名或密码错误" }`（或其他提示） |

- 前端调用位置：`src/stores/auth.js` 的 `login()`。
- 前端仅在 `res.ok && data?.ok && data?.token && data?.user` 时视为登录成功，并写入 localStorage。

### 2.2 获取当前用户（可选）

| 项目 | 说明 |
|------|------|
| **URL** | `GET /api/auth/me` |
| **请求头** | `Authorization: Bearer <token>` |
| **成功响应** | HTTP 200，Body：`{ "ok": true, "user": { "username": "string" } }` |
| **失败响应** | HTTP 401，Body：`{ "ok": false, "message": "未登录或登录已过期" }` |

---

## 三、角色卡接口

（结构见原文档第三节：COC 7th 角色表、GET/POST/PUT/DELETE `/api/characters`。）

---

## 四、大厅（跑团房间）接口

（房间数据结构、模组/标签、GET/POST `/api/game-rooms`、`POST /api/game-rooms/:id/apply` 见原文档第四节。）

---

## 五、聊天与实时通讯（Socket）

### 5.1 Socket 连接

- 前端使用 **socket.io-client** 连接 `VITE_SOCKET_URL`。

### 5.2 事件约定

- **客户端 → 服务端**：事件名 `message`，Payload 含 `id`, `channelId`, `userId`, `userName`, `content`, `time`, `type`, `speakerRole`, `speakerNpcId`, `speakerNpcName` 等。
- **服务端 → 客户端**：事件名 `message`，同结构；前端按 `channelId` 归入频道。

### 5.3 频道与子频道 REST（已实现）

- **频道列表**：`GET /api/channels` → `{ "ok": true, "channels": [...], "modules": [...] }`
  - `channels`：大厅等公共频道；`modules`：模组及下属子频道。
- **模组/子频道结构**（与前端 `modules` 一致）：
  ```json
  {
    "id": "wangdie",
    "name": "亡蝶葬仪",
    "icon": "mdi:butterfly",
    "ownerId": "userId",
    "subChannels": [
      {
        "id": "wangdie-1",
        "name": "调查组",
        "userAccess": { "userId": "none|readonly|full" }
      }
    ]
  }
  ```
- **历史消息**：`GET /api/channels/:channelId/messages?limit=50&before=msgId` → `{ "ok": true, "messages": [...] }`，单条消息结构与 Socket `message` 一致。

---

## 六、前端调用位置速查

| 功能 | 前端文件 | 说明 |
|------|----------|------|
| 登录 | `src/stores/auth.js` | `fetch('/api/auth/login', ...)` |
| 角色卡 | `src/stores/characters.js` | 改为 API 时在此处替换为 `fetch` |
| 大厅 | `src/stores/gameRooms.js`、`GameRoomsView.vue`、`GameRoomCreateView.vue` | 改为 API 时在 store 或页面中请求 |
| Socket & 频道 | `src/services/socket.js`、`src/stores/chat.js` | `VITE_SOCKET_URL` 存在则连真实 Socket；`emit('message', msg)` |
| 好友 & 私聊 | `src/views/FriendsView.vue`、`src/stores/chat.js` | 好友点击后通过 `openDirectMessage(friend)` 跳转 `/chat` |

---

## 七、后续扩展接口（好友 / 私聊 / 用户资料等）

本节是对**后续需要补充的接口**的设计草案，方便后端在现有基础上逐步扩展。当前前端中已有对应的占位逻辑或本地 Mock。

> 约定：以下接口均默认带前缀 `/api`。

### 7.1 好友与私聊（Direct Message）

#### 7.1.1 获取好友列表

- **URL**：`GET /api/friends`
- **鉴权**：需要
- **Query 参数（可选）**：
  - `keyword: string` — 按昵称搜索
  - `status: string` — `online` / `offline` / `all`
- **成功响应**：

  ```json
  {
    "ok": true,
    "friends": [
      {
        "id": "u1",
        "name": "熊猫",
        "status": "online",
        "lastMsg": "最近一条私聊内容",
        "lastMsgTime": "2024-01-01T12:00:00Z",
        "unreadCount": 2,
        "avatar": null
      }
    ]
  }
  ```

前端使用位置：`FriendsView.vue`（当前为本地 mock，后续可替换为该接口）。

#### 7.1.2 私聊频道列表（可选）

- **URL**：`GET /api/direct-channels`
- **鉴权**：需要
- **响应**：

  ```json
  {
    "ok": true,
    "channels": [
      {
        "id": "dm:u1",
        "peerId": "u1",
        "peerName": "熊猫",
        "peerAvatar": null,
        "lastMsg": "最近一条消息",
        "lastMsgTime": "2024-01-01T12:00:00Z",
        "unreadCount": 1
      }
    ]
  }
  ```

前端可用该数据初始化 `chat.directChannels`，并在 `Sidebar.vue` 的“私聊”分组中展示。

#### 7.1.3 私聊历史消息

复用现有历史消息接口：

- **URL**：`GET /api/channels/{channelId}/messages?limit=50&before=msgId`
- **说明**：当 `channelId` 为 `dm:xxx` 时，后端识别为私聊消息，并按双方用户 ID 存储/过滤历史。

前端调用位置：`src/stores/chat.js` 中 `fetchMessages()` 与 `setChannel()`。

> 私聊的实时消息仍通过 Socket `message` 事件，`channelId` 使用 `dm:<peerId>` 或 `dm:<sorted(user1,user2)>`。

---

### 7.2 用户资料与在线状态

#### 7.2.1 获取当前用户资料（扩展）

在已存在的 `GET /api/auth/me` 上，建议丰富字段：

- **成功响应**：

  ```json
  {
    "ok": true,
    "user": {
      "id": "alice",
      "username": "alice",
      "nickname": "小狐狸",
      "avatar": null
    }
  }
  ```

前端使用位置：

- 登录后初始化：`src/stores/auth.js`
- 聊天/侧边栏：`src/stores/chat.js` 的 `currentUser`（目前在 `initSocket()` 中用 `auth.user.username` 覆盖）。

#### 7.2.2 修改当前用户资料（昵称）

对应侧边栏底部“修改昵称”弹窗（`Sidebar.vue` → `updateNickname`）。

- **URL**：`PUT /api/users/me/profile`
- **请求体**：

  ```json
  {
    "nickname": "新昵称",
    "avatar": null
  }
  ```

- **成功响应**：

  ```json
  {
    "ok": true,
    "user": {
      "id": "alice",
      "username": "alice",
      "nickname": "新昵称",
      "avatar": null
    }
  }
  ```

#### 7.2.3 在线用户列表（可选）

- **URL**：`GET /api/users/online`
- **成功响应**：

  ```json
  {
    "ok": true,
    "users": [
      { "id": "u1", "name": "熊猫", "status": "online", "avatar": null },
      { "id": "u2", "name": "田中", "status": "online", "avatar": null }
    ]
  }
  ```

前端使用位置：`src/stores/chat.js` 的 `onlineUsers`（当前为 mock），用于：

- 跑团频道右上角“当前玩家与角色”列表
- 子频道用户准入设置弹窗。

---

### 7.3 子频道访问控制 & 模组 NPC 管理

这些接口用于持久化前端中对子频道准入权限与 NPC 的配置。

#### 7.3.1 更新子频道用户权限

- **URL**：`PUT /api/channels/{subChannelId}/access`
- **鉴权**：需要；仅模组 owner/KP 可调用。
- **请求体**：

  ```json
  {
    "userAccess": {
      "alice": "full",
      "bob": "readonly",
      "charlie": "none"
    }
  }
  ```

- **响应**：

  ```json
  { "ok": true }
  ```

前端入口：`Sidebar.vue` 中“用户设置”弹窗 → `updateSubChannelAccess()`。

#### 7.3.2 为模组添加 / 更新 NPC

- **URL**：`POST /api/modules/{moduleId}/npcs`
- **鉴权**：需要；仅模组 owner/KP 可调用。
- **请求体**：

  ```json
  {
    "id": "npc-1",   // 可选，不传则后端生成
    "name": "店长"
  }
  ```

- **响应**：

  ```json
  {
    "ok": true,
    "npc": {
      "id": "npc-1",
      "name": "店长"
    }
  }
  ```

前端入口：`src/stores/chat.js` 中的 `addModuleNPC()`；当前仅在内存中维护。

#### 7.3.3 删除模组 NPC

- **URL**：`DELETE /api/modules/{moduleId}/npcs/{npcId}`
- **响应**：

  ```json
  { "ok": true }
  ```

前端入口：`src/stores/chat.js` 中的 `removeModuleNPC()`。

---

## 八、实现顺序建议

结合当前前端状态与接口依赖，推荐整体实现顺序：

1. 认证模块（`/api/auth/login`、`/api/auth/me`）  
2. 角色卡模块（`/api/characters`）  
3. 大厅 / 房间模块（`/api/game-rooms` 相关）  
4. Socket + 频道 / 历史消息 REST（`/api/channels`、`/api/channels/:id/messages`）  
5. 好友列表与私聊（`/api/friends`、`/api/direct-channels`）  
6. 用户资料与在线状态（`/api/users/me/profile`、`/api/users/online`）  
7. 子频道访问控制 & NPC 管理  
8. 通知 / 笔记等其余扩展功能（视产品需要选择性实现）

文档版本：与当前前端代码状态一致，若前端后续调整字段或接口，请同步更新本文档。
