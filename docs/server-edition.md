# 在线服务版（完整服务器版）

[返回项目首页](../README.md) · [单机版指南](static-edition.md) · [Docker 生产部署](../deploy/README.md)

在线服务版由 React 客户端、Express/Socket.IO 服务端、数据库和可选 Redis 组成。它保留完整单人流程，并增加账号、多人、排行榜、回放和管理功能。

## 适用场景

- 在自己的服务器上提供多人游戏
- 保存账号、战绩、排行榜和公告
- 使用房间、随机匹配、观战与断线重连
- 运行管理后台和多人对局状态

如果只想直接游玩单人模式，不需要部署本版本，可以使用[静态单机版](https://uccpr.github.io/ToaruCharacterGuess/)。

## 快速开始

环境要求：Node.js 26 或更新版本、pnpm。SQLite 开箱即用，无需额外安装数据库；Redis 在本地单实例模式下可以缺省，服务端会使用有界内存降级路径。Rust 工具链仅在重新编译 PoW WASM 时需要，默认使用仓库内置的预编译产物。

```powershell
pnpm install
Copy-Item .env.example .env          # 可选，未创建时使用开发默认值
pnpm dev
```

- 客户端开发地址：<http://localhost:5173/>
- 服务端地址：<http://localhost:3000/>

公开注册的账号默认都是普通用户。创建或重置管理员：

```powershell
$env:ADMIN_USERNAME = 'admin'
$env:ADMIN_PASSWORD = '至少12位强密码'
pnpm create-admin
```

## 运行时行为

- Redis 默认连接 `redis://127.0.0.1:6379`；生产环境必须设置 `REDIS_REQUIRED=true`，避免故障时降级为只适合单实例的内存模式。
- 生产环境强制要求 PostgreSQL、至少 32 字节的随机 `JWT_SECRET` 和 `REDIS_REQUIRED=true`。
- 访客显示 ID 使用 HMAC-SHA256 派生；可用 `GUEST_ID_SALT` 配置独立盐，未配置时复用 `JWT_SECRET`。
- 单人进行中的对局保存在 Redis，1800 秒（30 分钟）无有效操作后自动过期。猜中、次数耗尽或查看答案后才写入数据库；主动离开或重新开始只清理临时状态，不产生历史战绩。

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 同时启动前后端开发服务 |
| `pnpm build` | 构建 PoW WASM、前端和后端 |
| `pnpm start` | 以生产模式启动服务端并托管 `client/dist` |
| `pnpm test` | 运行前后端测试 |
| `pnpm migrate` | 初始化或升级数据库结构 |
| `pnpm seed` | 从规范化目录同步角色与关系数据 |
| `pnpm create-admin` | 显式创建或重置管理员 |
| `pnpm loadtest` | 运行 HTTP 缓存接口与多人建房负载测试 |

## 使用 PostgreSQL

修改仓库根目录的 `.env`：

```dotenv
DB_CLIENT=pg
DB_URL=postgres://user:pass@localhost:5432/csgofriberg
```

## Redis 用途

- HTTP 与 Socket.IO 分布式限流
- HttpOnly Cookie 会话、实时角色校验和匿名身份签名绑定
- `/api/players/list` 版本化缓存、ETag 与跨实例失效通知
- 排行榜、公告等热点查询缓存
- 多人房间快照、身份索引、分布式房间锁和匹配队列
- 回合超时、断线判负和房间清理的可恢复调度
- Socket.IO Redis Adapter 跨实例广播
- Redis Stream 多人战绩持久化重试

## 本地生产模式

```powershell
pnpm build
powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1
```

访问 <http://localhost:3000/>。

## Docker 生产部署

生产环境使用 PostgreSQL 专用的精简 Docker 镜像（distroless 运行时，不包含 Rust、pnpm、TypeScript、Vite、源码、测试或 SQLite 驱动）。GitHub Actions 自动执行测试、前后端编译和 `linux/amd64` 镜像构建，并将镜像发布到 [`ghcr.io/uccpr/toarucharacterguess`](https://github.com/UCCPR/ToaruCharacterGuess/pkgs/container/toarucharacterguess)。

完整的 Docker Compose、数据库迁移、管理员创建、更新和回滚流程见 [Docker 生产部署指南](../deploy/README.md)。

管理员按需外部作弊分析的 Bearer 鉴权与 JSON 展示契约见[外部作弊分析 API](cheat-analysis-api.md)。

## 与单机版的关系

两个版本共享角色目录、比较规则、客户端 UI 和多语言资源。单机版以浏览器本地逻辑替代 HTTP/Socket.IO 游戏服务；在线服务版则由服务器保存对局并协调多人状态。
