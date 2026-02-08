# FOXTrpg

前后端一体的 TRPG 应用：Vue 3 前端 + Node 后端，登录由后端校验。

## 开发

1. 安装依赖：`npm install`
2. 复制环境变量（可选）：`cp .env.example .env`，按需修改
3. 同时启动前端与后端：`npm run dev`
   - 前端：<http://localhost:8089>（Vite）
   - 后端：<http://localhost:3000>（API）；前端通过 Vite 代理访问 `/api`

也可分别运行：

- `npm run dev:client` — 仅前端
- `npm run dev:server` — 仅后端

默认账号（见 `server/lib/users.js` 或环境变量 `FOXTRPG_USERS`）：`admin` / `123456`。

## 生产

### 方式一：同机部署（推荐）

1. 构建前端：`npm run build`
2. 启动服务（会托管 `dist` 并提供 `/api`）：`npm start`

需设置 `NODE_ENV=production`；建议配置 `PORT`、`JWT_SECRET`、`FOXTRPG_USERS`。  
域名指向这台机器时，访问 `https://你的域名` 即可，登录请求会走同域的 `/api/auth/login`。

若只把 **dist 目录** 上传到域名而未跑 Node，会出现 `/api` 404。请在同一台机跑 Node（见方式一），使 API 与页面同域。

## 项目结构

- `src/` — Vue 3 前端
- `server/` — Express 后端
  - `server/index.js` — 入口与静态托管
  - `server/routes/auth.js` — 登录、当前用户
  - `server/lib/users.js` — 用户校验（环境变量）
  - `server/middleware/auth.js` — JWT 签发与校验
