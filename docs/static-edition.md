# 单机版（浏览器静态版）

[返回项目首页](../README.md) · [在线服务版指南](server-edition.md)

单机版是发布在 GitHub Pages 上的纯前端版本，不需要 Node.js、数据库、Redis 或账号服务器。

## 立即游玩

<https://uccpr.github.io/ToaruCharacterGuess/>

## 包含的功能

- 每日挑战和自由挑战
- 入门版、简单版、完整版三档角色池
- 最多 8 次猜测，以及阵营、组织、地区、性别、身份和首次登场反馈
- 中文、英文、日文界面与角色分类值
- Light / BLAST 主题和原客户端的按钮、弹窗、输入联想等交互
- 当前浏览器中的对局进度保存

## 不包含的功能

单机版不会连接中央服务器，因此不提供账号同步、多人房间、排行榜、跨设备战绩、公告管理或管理后台。需要这些功能时，请使用[在线服务版](server-edition.md)。

## 本地运行

环境要求：Node.js 26 或更新版本、pnpm。

```powershell
pnpm install
pnpm --filter static-site dev
```

开发地址通常为 <http://localhost:5173/>。

## 构建 GitHub Pages 版本

```powershell
$env:GITHUB_PAGES='true'
pnpm --filter static-site build
```

构建结果位于 `static/dist/`。不要直接编辑该目录；角色目录或客户端组件发生变化后，应重新构建。

推送到 `main` 后，`.github/workflows/deploy-pages.yml` 会构建并发布 GitHub Pages。

## 数据与存档

- 角色数据由 `server/src/db/seeds/players.json` 和 `server/src/db/seeds/characterCatalog.json` 在构建时生成。
- 对局进度只保存在当前浏览器的 `localStorage` 中。
- 清理网站数据、更换浏览器或更换设备不会同步原有进度。
