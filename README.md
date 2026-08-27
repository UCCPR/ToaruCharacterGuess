<div align="center">

# 某角色的身份推理

**《魔法禁书目录》非官方角色猜测游戏 —— 可直接游玩的静态单机版 + 可自行部署的在线服务版**

> 本项目是非官方同人作品，与原作者、出版社、动画制作方及其他版权方无关。

[![CI and Docker](https://github.com/UCCPR/ToaruCharacterGuess/actions/workflows/docker.yml/badge.svg)](https://github.com/UCCPR/ToaruCharacterGuess/actions/workflows/docker.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)
[![Node.js ≥ 26](https://img.shields.io/badge/node-%E2%89%A526-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![pnpm workspaces](https://img.shields.io/badge/pnpm-workspaces-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![ghcr.io](https://img.shields.io/badge/ghcr.io-ToaruCharacterGuess-2496ED?logo=docker&logoColor=white)](https://github.com/UCCPR/ToaruCharacterGuess/pkgs/container/toarucharacterguess)

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React 18](https://img.shields.io/badge/React_18-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?logo=socketdotio&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-FF4438?logo=redis&logoColor=white)

[选择版本](#选择版本) · [玩法](#玩法) · [功能特性](#功能特性) · [在线服务器指南](docs/server-edition.md) · [角色数据](#角色数据) · [贡献](#贡献)

</div>

---

## 选择版本

|  | **单机版（浏览器静态版）** | **在线服务版（完整服务器版）** |
| --- | --- | --- |
| 适合 | 立即游玩、每日挑战、无需安装或账号 | 自行部署、多人房间、账号、排行榜与管理功能 |
| 数据保存 | 当前浏览器的本地存储 | SQLite/PostgreSQL；多人状态可使用 Redis |
| 是否需要服务器 | 不需要 | 需要 Node.js 服务；生产环境需要 PostgreSQL 与 Redis |
| 入口 | **[立即进入单机版](https://uccpr.github.io/ToaruCharacterGuess/)** | **[查看在线服务版指南](docs/server-edition.md)** |
| 使用说明 | [单机版玩法、限制与本地构建](docs/static-edition.md) | [本地开发指南](docs/server-edition.md) · [Docker 生产部署](deploy/README.md) |

两个版本使用同一角色目录和猜测规则，但运行方式不同。GitHub Pages 上的单机版不会连接账号、排行榜或多人服务器；需要这些功能时，请部署在线服务版。

## 玩法

输入角色名，系统按 **阵营 / 所属组织 / 活动地区 / 性别 / 多重身份 / 首次出场作品 / 首次登场年份** 逐属性给出对比反馈：

- 🟩 **绿色** —— 该属性与答案完全一致
- 🟨 **黄色** —— 接近（阵营集合有交集、同大洲、同一直接上级组织、相关身份，或首次登场年份相差不超过 3 年）
- ↑↓ **箭头** —— 数值型属性提示答案更高或更低

8 次机会内猜出目标角色即获胜。

## 功能特性

### 两个版本共有

- 🎮 **单人模式** —— 入门版 / 简单版 / 完整版，进行中对局可断线续玩
- 🌏 **多语言** —— 简体中文 / English / 日本語，角色名称与分类值同步本地化
- 🎨 **双主题** —— Blast 暗色 / 日间浅色，首次访问跟随系统偏好

### 在线服务版专有

- 🌐 **多人联机** —— BO1/3/5/7 赛制、随机匹配、5 位房间码、观战;每小局限时 120 秒,断线即时通知、同身份可重连,30 秒未归判负
- 🔍 **查角色** —— 模糊搜索角色资料
- 📊 **统计与回放** / 🏆 **排行榜** / 📢 **公告**
- 👤 **无需登录** —— 所有模式对匿名访客开放,战绩按浏览器本地标识记账,登录后自动并入账号
- 🛡 **PoW 人机验证** —— 公开接口由 WASM 工作量证明保护(Rust 编译,仓库内置预编译产物)
- 🛠 **管理后台** —— 用户、对局举报、公告、资源版本和 API Token 管理；角色编辑在规范化目录迁移期间暂时停用

## 技术栈

| 层        | 技术                                                     |
| --------- | -------------------------------------------------------- |
| 前端      | React 18 + Vite + TypeScript + React Router + Zustand    |
| 后端      | Node.js + Express + TypeScript                           |
| 数据库    | 本地开发支持 SQLite；生产 Docker 镜像固定使用 PostgreSQL |
| 缓存/实时 | Redis + Socket.IO(Redis Adapter 跨实例广播)              |
| 认证      | JWT + bcrypt(HttpOnly Cookie,客户端不存明文令牌)          |
| 校验/测试 | Zod / Vitest                                             |
| 包管理    | pnpm workspaces                                          |

## 在线服务版部署

在线服务版的环境要求、本地开发、常用脚本、PostgreSQL、Redis 和 Docker 生产部署说明已集中到[在线服务器指南](docs/server-edition.md)。

## 角色数据

`server/src/db/seeds/players.json` 只保存角色名、难度和可选的启用状态；完整的阵营、组织、身份、地区、性别与首次登场资料维护在 `server/src/db/seeds/characterCatalog.json`。数据库直接以 `characters` 及其关系表作为游戏数据源，不再创建旧 `players` 投影。新增角色必须同时加入两份文件。

角色目录的字段定义、来源要求、组织层级、多重身份和新增流程见 [`docs/character-catalog.md`](docs/character-catalog.md)。每个整理后的角色都必须保留页面级来源；不确定的信息应标为 `待复核`，不得凭空补全。

角色新增、编辑、导入、删除和字段审核 API 在规范化目录迁移期间暂时停用，相关端点统一返回 `410 CHARACTER_EDITING_DISABLED`。当前请同时维护上述两份种子文件，然后运行目录测试、迁移和种子同步。管理后台中的角色编辑界面与服务实现仍被保留，待适配规范化目录写入后恢复。

## 项目结构

```
server/src
├── config.ts          # 环境配置
├── db/                # Knex 实例、建表、种子数据
├── middleware/        # 认证、Zod 校验、限流、PoW、错误处理
├── routes/            # auth / players / game / stats / leaderboard / announcements / admin
├── services/          # 游戏判定、角色缓存、房间状态、战绩队列等
└── socket/            # 多人房间系统
client/src
├── api/               # axios 封装、socket 单例、玩家列表缓存
├── store/             # auth / theme / guest 等轻量状态
├── i18n/              # 中 / 英 / 日 文案与错误码翻译
├── components/        # Page / GuessBoard / GuessInputBar / DataTable / admin/*
└── pages/             # Home / SingleGame / MultiLobby / MultiRoom / Stats / ...
```

## 贡献

- 🐛 [问题反馈 / 功能建议](https://github.com/UCCPR/ToaruCharacterGuess/issues/new/choose) —— 请使用对应的 Issue 模板
- 📚 角色资料纠错与新增也请在本仓库提交 Issue，并附上可核查的页面级来源
- 提交 PR 前请运行 `pnpm test` 与 `pnpm build`;所有用户可见文案需同步维护中/英/日三语(`client/src/i18n/resources.ts`)

## 许可证

本项目基于 [AGPL-3.0](LICENSE) 开源，并由 `shnlfriberg/csgofriberg`（AGPL-3.0）改造而来。

该来源链接只用于履行开源许可证要求，不表示上游作者参与、认可或维护本项目。本仓库不是 GitHub Fork，当前提交历史只保留本项目的实际提交者；上游作者不应被视为本仓库 Contributor。
