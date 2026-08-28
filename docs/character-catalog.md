# 角色目录数据模型

## 目标

新版角色目录用于承载600个以上角色及其多重阵营、组织经历、活动地点和跨作品登场信息。`characters` 是游戏运行时的唯一角色主实体，不再建立 `players` 兼容表。

维基资料只用于世界观事实和索引；游戏难度、剧透范围及玩家认知度由项目单独维护。

## 核心关系

```text
characters
├─ character_aliases
├─ character_sides ───────── sides
├─ character_organizations ─ organizations
├─ character_locations ───── locations
├─ character_appearances ─── works
├─ character_game_profiles
└─ character_references ──── catalog_sources
```

所有阵营、组织和地点均为多对多关系，并允许记录关系类型、主要关系、起止篇章和审核状态。

## 来源优先级

`catalog_sources` 预置以下来源，但不会自动复制网页正文或图片：

1. `toaru-official`：官方资料，最高优先级。
2. `toaru-huijiwiki`：灰机魔禁维基，作为中文分类和索引参考，文本许可记录为 CC-BY-NC-SA。
3. `toaru-fandom`：Fandom 社区维基，标记 CC-BY-SA。
4. `legacy-seed`：保留的来源类型标识，不参与当前直接目录种子。

每个外部事实应通过 `character_references` 保留页面地址、适用字段、可信度和最后核验时间。不要复制不明确许可的长篇介绍或图片。

## 审核状态

- `needs_review`：未经新模型核验，不能视为可靠设定。
- `community_sourced`：已按社区维基页面整理并保留链接，但尚未提升为官方核验。
- `verified`：已由指定来源核对。
- `disputed`：不同来源存在冲突。
- `unknown`：资料不足。

`server/src/db/seeds/players.json` 只维护可玩清单：角色名、难度以及可选的启用状态。阵营、地区、组织、性别和首次登场等资料全部来自规范目录。`syncCharacterCatalog.ts` 直接写入 `characters`、关系表、`character_game_profiles` 和 `character_difficulties`。

性别采用四态：`male`（男）、`female`（女）、`none`（角色设定明确无性别）和 `unknown`（原作没有确认或资料不足）；“无性别”不能与“未知”合并。

`server/src/db/seeds/characterCatalog.json` 是人工整理的社区来源补充层。目前覆盖题库的 158 名角色，补充日文名、英文名、别名、多重阵营、组织、地点、首次登场和页面来源。它不会复制维基正文或图片。首次登场等仍不确定的字段必须在值中明确标注“待复核”，不能伪装成精确事实。

能力资料不属于当前可玩目录，也不参与同步。`abilities` 与 `character_abilities` 表已从新数据库结构删除；新角色不录入 `abilities` 字段。

游戏中的“身份”由审核目录的阵营关系、组织任职、研究计划、家族关系和特殊身份生成。运行时身份结构包含 `name`（显示名称）、`kind`（身份来源类型）、`entity`（具体组织、计划或家族）、`role`（在该实体中的角色）和 `group`（受控相近分组）。完全相同由 `kind + entity + role` 判断，不依赖显示文字；黄色只由受控 `group` 判断。组织黄色反馈只使用标准化的直接层级：任一组织完全相同为绿色；两个组织为直接父子关系，或具有同一个非空 `parent_id` 时为黄色。`无所属` 不作为组织关系写入或参与黄色判断。

`shared/src/characterClassificationData.json` 是在线服务版和静态版共享的分类配置，统一维护组织直接上级、身份专用组织类型、关系显示名称、阵营身份和组织身份分组。`@toaru-character-guess/shared` 同时提供目录分类和可见反馈比较规则；服务端、静态版与静态目录生成器都直接引用该包，不在各端维护重复实现。

研究计划、研究机构、研究小组及家族身份的相近分组必须带具体实体名称。只有同一研究计划或同一家族中的不同身份可以显示黄色；不同计划、不同家族以及“研究人员”和“人工生命”等宽泛类型不能仅因大类接近而显示黄色。

## 游戏难度

`character_game_profiles` 将世界观资料与游戏策略分离：

- `is_enabled`：是否进入题库。
- `content_scope`：动画、旧约、新约、创约、外传等内容范围。
- `spoiler_level`：剧透等级。
- `editorial_prominence`：编辑初始知名度判断。
- `recognition_score`：根据真实游戏数据计算的认知分。
- `sample_size`：认知分的样本量。

`character_difficulties` 决定当前三档题库。后续可根据认知分和玩家选择的作品范围生成题库，而不是按能力强弱划分。

## 猜测相近分类

运行时从规范化目录读取首次出场作品。活动地区完全相同为绿色、同一大洲为黄色。组织反馈比较全部所属关系：任一组织相同为绿色；两个组织为直接父子关系或具有同一个非空直接上级时为黄色；`无所属` 不参与关系判断。身份反馈在全部身份中依次选择完全相同、同一精确身份组或无关项，并分别显示绿、黄、灰。玩家缓存从 `character_sides` 读取角色的全部阵营关系；主阵营不同但双方阵营集合存在交集时显示黄色。首次登场年份相差不超过 3 年为黄色，作品名称本身只判断完全一致。

## 当前运行方式

运行数据库迁移或 `initDb()` 后：

1. 建立规范化目录表和难度关系。
2. 从两份种子直接同步 158 名可玩角色。
3. `playerCache.ts` 从规范关系组装游戏 DTO。
4. 单人、多人、每日挑战和历史表直接保存 `characters.id`。
5. 管理后台角色编辑及外部角色写入接口暂时返回 `410 CHARACTER_EDITING_DISABLED`；原编辑 UI、服务和路由实现保留，待改造成规范化目录写入后再解除入口限制。
