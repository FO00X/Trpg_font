## 项目简介

前端大厅 / 角色卡管理 / 聊天界面，基于 **Vue 3 + Vite + TailwindCSS**。  
后端使用 **Supabase**（认证、数据库、Realtime），前端可部署在 **Vercel**。

## 开发环境

- **依赖安装**
  - `npm install`

- **环境变量**
  - 复制 `.env.example` 为 `.env`，填入 Supabase 项目的 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_ANON_KEY`（Supabase Dashboard → Settings → API）。

- **Supabase 数据库**
  - 在 Supabase 项目内打开 **SQL Editor**，执行 `supabase/migrations/001_initial.sql` 中的 SQL，创建表结构并启用 RLS、Realtime。

- **前端启动**
  - `npm run dev` 或 `npm run dev:client`
  - 前端地址：`http://localhost:8089`

- **登录与注册**
  - 使用 Supabase 邮箱+密码：在 Supabase Dashboard → Authentication → Users 中可手动添加用户，或在前端登录页使用「注册」入口（若已实现）进行注册。

## 生产部署

- **前端部署到 Vercel**
  - 将本仓库连接至 Vercel，在项目设置中配置环境变量 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`。
  - 构建命令：`npm run build`，输出目录：`dist`。`vercel.json` 已配置 SPA 回退到 `index.html`。

- **后端**
  - 无需单独部署后端，Supabase 提供认证、数据库与 Realtime，全部由前端直连。

## 功能与数据流

- **认证**：Supabase Auth（邮箱+密码），用户资料存于 `profiles` 表。
- **角色卡**：`characters` 表，按 `user_id` RLS；前端通过 Supabase 客户端读写。
- **大厅房间**：`game_rooms`、`game_room_applications`、`game_room_module_options`、`game_room_tag_options`。
- **聊天**：`channels`、`modules`、`messages` 表；新消息通过 Supabase Realtime 订阅实时推送。若大厅里只能看到自己发的消息，请到 **Supabase Dashboard → Database → Replication**，确认 `messages` 表已加入 `supabase_realtime` 发布；同时前端每 8 秒会轮询拉取当前频道消息作为后备。
- **好友与私聊**：`friend_requests` 表（pending/accepted/rejected）；私聊使用 `messages.channel_id = dm:uuid1:uuid2`（两人共用同一 channel），支持历史与实时消息。

## 项目结构（前端）

- `src/`
  - `main.js` / `App.vue` — 应用入口
  - `lib/supabase.js` — Supabase 客户端
  - `router/` — 路由与鉴权（基于 Supabase Session）
  - `views/` — 各页面（登录、大厅、角色卡、聊天等）
  - `components/` — 复用 UI 与弹窗
  - `stores/` — 状态（auth、characters、gameRooms、chat 等，直连 Supabase）
  - `data/` — 规则书等静态数据

- `supabase/migrations/001_initial.sql` — 初始表结构与 RLS、Realtime、触发器
- `supabase/migrations/002_friends.sql` — 好友请求表（加好友、同意/拒绝）
- `supabase/migrations/004_room_application_status.sql` — 房间申请状态（pending/accepted），房主或已通过用户招募中显示「进入房间」
