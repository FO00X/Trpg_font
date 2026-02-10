## 项目简介

前端大厅 / 角色卡管理界面，基于 **Vue 3 + Vite + TailwindCSS**。  
后端（登录、业务接口）已拆分为 **独立 FastAPI 项目 `TRPG_back`**，本仓库只负责前端 UI。

## 开发环境

- **依赖安装**
  - `npm install`

- **前端启动**
  - 推荐命令：`npm run dev:client`
  - 前端地址：`http://localhost:8089`
  - 开发代理：`/api` 会被 Vite 代理到 `http://localhost:3000`（见 `vite.config.js`）

- **后端启动（独立仓库）**
  - 在 `TRPG_back` 目录：`pip install -r requirements.txt` 后执行  
    `uvicorn app.main:asgi_app --reload --port 3000`  
    （必须用 **asgi_app**，才能同时提供 HTTP 与 Socket.IO）
  - 后端监听 `http://127.0.0.1:3000`，提供 `/api/...` 及 Socket
  - 若需前端连真实 Socket（聊天），在前端项目根目录创建或修改 `.env`，增加：  
    `VITE_SOCKET_URL=http://localhost:3000`  
    然后重启 `npm run dev:client`

## 生产部署

- **前端构建**
  - `npm run build`
  - 将生成的 `dist/` 目录上传到你的静态空间或绑定的前端域名（如 `https://xxx.com`）

- **后端部署**
  - 将 FastAPI 项目部署到 Render 或其他平台，假设地址为 `https://trpg-api.example.com`
  - 前端请求 `/api/...` 时的真实接口地址，可以通过：
    - 在前端服务器做反向代理 `/api` → 后端
    - 或在前端代码中将 `fetch('/api/xxx')` 改为完整后端域名（视你最终架构而定）

- **Socket（可选）**
  - `src/services/socket.js` 支持：
    - 设置环境变量 `VITE_SOCKET_URL` 连接真实 Socket 服务；
    - 未设置时使用前端内置 Mock，实现本地演示。

## 前端与后端接口

后端（TRPG_back）已实现：**认证**、**角色卡 CRUD**、**大厅房间列表/创建/申请加入**、**Socket 实时聊天**（join + message）。  
前端当前仍部分使用 localStorage / Mock；要完全对接后端，需把 `src/stores/characters.js`、`src/stores/gameRooms.js` 等改为请求上述 API。完整接口约定与实现状态见 **`docs/backend-api.md`**。

- **基础约定**
  - 所有接口前缀：`/api`
  - 返回统一结构（示例）：`{ ok: boolean, message?: string, ... }`

### 1. 登录接口

- **URL**：`POST /api/auth/login`
- **请求体（JSON）**：
  - `username: string` — 账号（前端必填且去除首尾空格）
  - `password: string` — 密码（前端必填且去除首尾空格）
- **前端调用位置**：
  - `src/stores/auth.js` 中：
    - `fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })`
- **期望成功响应（HTTP 200）**：
  - 示例：
    ```json
    {
      "ok": true,
      "token": "<jwt-or-any-string>",
      "user": {
        "username": "alice"
      }
    }
    ```
  - 前端行为：
    - 保存 `user.username` 与 `token` 到 `localStorage`（key：`foxtrpg-auth`）
    - 标记为已登录，路由守卫放行

- **期望失败响应**：
  - 账号或密码错误：
    - HTTP 状态码：`401`
    - 响应示例：
      ```json
      { "ok": false, "message": "用户名或密码错误" }
      ```
    - 前端会在登录页下方显示 `message`
  - 其他错误（服务器异常等）：
    - 建议返回：
      ```json
      { "ok": false, "message": "登录失败，请稍后重试" }
      ```
    - 或者由前端兜底文案代替

> 说明：前端目前**没有**调用 `/api/auth/me` 或刷新 token 的逻辑，登录后只依赖 `localStorage` 中是否有 `username`+`token` 来判断是否已登录。

### 2. 实时通讯 Socket（可选对接）

前端已有 Socket 封装，默认使用 Mock；如果你后端也实现了实时聊天 / 房间通知，可以按需对接。

- **配置**
  - 环境变量：`VITE_SOCKET_URL`
  - `src/services/socket.js` 中：
    - 若设置了 `VITE_SOCKET_URL`，将通过 `socket.io-client` 连接该地址；
    - 未设置时，则使用本地 Mock。

- **事件约定（建议，仅供你后端参考，实际实现可以调整）**
  - `message`：聊天室消息
    - payload 示例：
      ```json
      {
        "id": "msg-1",
        "channelId": "general",
        "userId": "u1",
        "content": "hello",
        "createdAt": "2024-01-01T12:00:00Z"
      }
      ```
  - 其他如频道列表、在线用户等逻辑，前端当前主要在本地实现，你可以逐步替换为真实接口。

## 前端尚未对接后端的部分

后端已提供角色卡、大厅、Socket 等接口（见 `docs/backend-api.md`）。前端目前仍使用：

- `src/stores/characters.js`：角色卡为 localStorage，可改为调用 `GET/POST/PUT/DELETE /api/characters`
- `src/stores/gameRooms.js`：大厅房间为 Mock，可改为调用 `GET /api/game-rooms`、`POST /api/game-rooms` 等
- `src/stores/chat.js`：频道与消息为本地/Mock，Socket 已支持；若设置 `VITE_SOCKET_URL` 则连后端实时消息

对接时可在 store 内将读写改为 `fetch('/api/...')`，或新增 `src/services/api.js` 统一封装请求。

## 项目结构（前端部分）

- `src/`
  - `main.js` / `App.vue` — 应用入口
  - `router/` — 路由配置（登录、大厅、角色卡等）
  - `views/` — 各页面组件（`LoginView`、`GameRoomsView`「大厅」、`CharacterSheetView` 等）
  - `components/` — 复用 UI 组件和弹窗
  - `stores/` — 业务状态（登录、聊天、角色卡、大厅）
  - `services/socket.js` — Socket 封装（Mock + 实服）
  - `data/` — 规则书相关静态数据（技能、武器、职业等）

