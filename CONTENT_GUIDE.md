# 底层书库 — 内容创作指南

本文档供 AI 或人类作者使用，用于编写新的剧情节点、事件、书籍和结局。

---

## 一、世界观概要

底层书库是一座图书馆地下的异常空间。主角是新入职的图书馆员，来调查前任员工"林"的失踪。在书库中，书不只是书——它们能回应现实、改变环境、与灵魂共鸣。玩家通过在正确的场景使用正确的书来推进剧情。

**基调**：安静的恐怖，文学性，克制的情感。不是jump scare，是在书架间越走越深时后背发凉的感觉。

**叙事声音**：第二人称现在时（"你走进走廊"），短句为主，偶尔长句制造节奏感。用 `**双星号**` 标记每段最重要的 1-2 处关键信息（会渲染为金色高亮）。

---

## 二、数据结构速查

### 书籍 (books.json)

```jsonc
{
  "id": "唯一标识符_snake_case",
  "title": "中文书名",
  "author": "作者",
  "quote": "一句话引言（出现在书卡上）",
  "tags": ["标签1", "标签2"],  // 决定这本书能解决哪些事件
  "description": "1-2句描述",
  "image": "filename.svg"       // 可选，放在 public/images/books/
}
```

### 节点 (nodes.json)

```jsonc
{
  "id": "node_id",
  "name": "显示名称",
  "description": "场景描述（支持 \\n 换行，支持 **高亮**）",
  "image": "filename.svg",      // 放在 public/images/nodes/，可复用已有图
  "events": ["event_id_1"],     // 进入此节点时可触发的事件
  "connections": [               // 从此节点可前往的地方
    {
      "target": "other_node_id",
      "label": "按钮文字",
      "requirement": "none"      // 或 "flag"
      // "requirement_value": "flag_name"  // requirement 不为 none 时必填
    }
  ]
}
```

### 事件 (events.json)

```jsonc
{
  "id": "e01_example",
  "node_id": "所属节点id",
  "description": "事件描述（玩家看到的叙事文字）",
  "prompt": "选书时的提示语",     // 为空则是自动事件
  "harsh": false,                // true = 选错书会扣HP（蜡烛熄灭）
  "solutions": [                 // 按顺序匹配，先匹配先生效
    {
      "type": "book_match",      // 精确匹配某本书
      "required_book_id": "dorian_gray",
      "outcome": { "text": "...", "effects": [...], "next_node": null }
    },
    {
      "type": "tag_match",       // 匹配书的标签
      "required_tags": ["恐惧", "觉醒"],  // 默认 any 模式（命中任一即可）
      // "match_mode": "all",    // 可选：要求全部命中
      "outcome": { "text": "...", "effects": [...], "next_node": null }
    }
  ],
  "default_outcome": {           // 所有 solution 都不匹配时
    "text": "失败文字",
    "effects": [],
    "next_node": null
  }
}
```

### Per-book 风味文字 (book_text)

任何 outcome（包括 tag_match 的 outcome 和 default_outcome）都可以添加 `book_text` 字段，为不同书籍提供专属描述：

```jsonc
{
  "type": "tag_match",
  "required_tags": ["恐惧"],
  "outcome": {
    "text": "通用成功文字（当没有匹配的 book_text 时使用）",
    "book_text": {
      "metamorphosis": "变形记特有的解谜描写——甲虫的意象与场景呼应...",
      "usher": "厄舍府特有的解谜描写——崩塌与衰朽的共鸣..."
    },
    "effects": [...],
    "next_node": null
  }
}
```

**自动事件** vs **手动事件**：
- `solutions` 为空数组 `[]` → 自动事件，进入节点时自动触发，使用 `default_outcome`
- `solutions` 非空 → 手动事件，显示 prompt，玩家从背包选书

---

## 三、现有书籍及标签速查表

| ID | 书名 | 标签 | 获取方式 |
|---|---|---|---|
| `starter_handbook` | 图书馆员手册 | 规则, 整理, 基础, 知识 | 初始持有 |
| `metamorphosis` | 变形记 | 异化, 甲虫, 家庭, 恐惧, 身体 | 初始持有 |
| `painted_skin` | 画皮 | 鬼怪, 伪装, 揭露, 东方, 女性 | 初始持有 |
| `lin_letter` | 林的纸条 | 警告, 谜题, 剧情 | e02_lin_desk（前厅自动） |
| `dorian_gray` | 道林·格雷的画像 | 美, 画像, 堕落, 虚荣, 镜子 | e07_find_book_a（书架A自动） |
| `madman_diary` | 狂人日记 | 觉醒, 恐惧, 揭露, 现代, 孩子 | e06_misplaced（书架A解谜） |
| `crooked_field` | 促织 | 化身, 家庭, 儿童, 卑微, 东方 | e09_find_book_b（书架B自动） |
| `usher` | 厄舍府的崩塌 | 共鸣, 崩塌, 恐惧, 双生, 衰朽 | e11_mirror_lin（镜中世界） |
| `the_book_that_reads_you` | 无名之书 | 异常, 剧情, 镜子, 揭露 | e14_reading_book（禁区解谜） |
| `little_prince` | 小王子 | 纯真, 离别, 星星, 儿童 | e17_forgotten_shelf（阅览室） |
| `shanhai_jing` | 山海经 | 古老, 怪物, 东方, 知识 | e19_sealed_cabinet（档案室） |
| `solitude` | 百年孤独 | 孤独, 记忆, 循环, 家庭 | e18_reading_puzzle（阅览室解谜） |

### 标签分布统计

按出现频率排序，方便设计新事件时选择合适的 required_tags：

| 标签 | 出现在哪些书上 |
|---|---|
| 恐惧 | metamorphosis, usher, madman_diary |
| 揭露 | painted_skin, madman_diary, the_book_that_reads_you |
| 家庭 | metamorphosis, crooked_field, solitude |
| 东方 | painted_skin, crooked_field, shanhai_jing |
| 儿童 | crooked_field, little_prince |
| 知识 | starter_handbook, shanhai_jing |
| 镜子 | dorian_gray, the_book_that_reads_you |
| 规则/整理/基础/知识 | starter_handbook（独占） |
| 异化 | metamorphosis（独占） |
| 伪装 | painted_skin（独占） |
| 觉醒 | madman_diary（独占） |
| 双生 | usher（独占） |
| 警告/谜题/剧情 | lin_letter（独占或少见） |

**设计原则**：required_tags 应让 2-3 本书能匹配（太宽则无挑战，太窄则卡关）。用 `book_match` 仅当你想奖励特定书的"完美匹配"。

---

## 四、效果系统 (Effects)

每个 outcome 的 `effects` 数组可包含以下效果：

| 效果类型 | 参数 | 说明 |
|---|---|---|
| `gain_book` | `book_id` | 获得一本书（结果面板会自动显示获书卡片） |
| `lose_book` | `book_id` | 失去一本书 |
| `mark_book` | `book_id`, `state` | 改变书的状态：`normal` → `worn` / `glowing` / `consumed` |
| `transform_book` | `from_id`, `to_id` | 将一本书变成另一本 |
| `set_flag` | `key`, `value` | 设置全局标记（用于门锁、分支判断） |
| `record_choice` | `choice_id`, `option_id` | 记录关键抉择（用于结局判定） |
| `trigger_super_match` | `match_id` | 触发超级匹配标记（用于结局判定） |
| `unlock_node` | `node_id` | 解锁某节点（内部转为 set_flag） |
| `lock_node` | `node_id` | 锁定某节点 |

---

## 五、现有 Flag 和 Choice 依赖链

### Flags（影响通行和剧情分支）

| Flag | 设置位置 | 用途 |
|---|---|---|
| `got_lin_letter` | e02 | 标记已读林的纸条 |
| `doubted_librarian` | e03 质疑线 | — |
| `heard_whispers` | e05 低语线 | — |
| `comforted_child` | e08 安抚孩子 | — |
| `mirror_reached_in` | e10 进入镜面 | **解锁 mirror_hall → mirror_world 通道** |
| `found_names_wall` | e13 黑暗房间 | — |
| `cleared_collapse` | e12 清理坍塌 | **解锁 back_corridor → forbidden_entry 通道** |
| `dealt_with_book` | e14 应对无名书 | **解锁 forbidden_entry → deepest 通道** |
| `found_lin` | e15 找到林 | **触发"真相"结局** |

### Key Choices（影响结局）

| choice_id | 可选值 | 说明 |
|---|---|---|
| `trust_old_librarian` | `trust` / `doubt` | 是否信任老管理员 |
| `mirror_choice` | `reach_in` / `step_back` | 是否进入镜中 |
| `final_choice` | `read_the_book` / `give_letter` / `comfort` / `give_handbook` | 递给林哪本书 |

### Super Matches（最佳匹配标记）

| match_id | 触发条件 | 用于 |
|---|---|---|
| `sm_crooked_child` | 促织 × 哭泣的孩子 | — |
| `sm_dorian_mirror` | 道林·格雷 × 镜中林 | — |
| `sm_usher_collapse` | 厄舍府 × 坍塌 | — |
| `sm_read_the_book` | 无名之书 × 最终事件 | **"读完"结局（最高优先级）** |

---

## 六、结局系统

结局按 `priority` 降序检查，第一个满足所有 `conditions` 的结局生效。

| 优先级 | 结局 | 条件 |
|---|---|---|
| 100 | 读完 | `sm_read_the_book` 被触发 |
| 50 | 回忆 | `found_personnel_pattern` + `found_lin` |
| 30 | 真相 | `found_lin` = true |
| 20 | 替代 | `final_choice` = `give_handbook` |
| 10 | 安宁 | `trust_old_librarian` = `trust` |
| 0 | 未完 | 无条件（兜底） |

---

## 七、HP 系统

- 初始 HP = 3（显示为 3 根蜡烛）
- 仅 `harsh: true` 的事件在选错书（匹配到 default_outcome）时扣 1 HP
- HP = 0 → 游戏结束，存档删除，返回主菜单
- 目前 harsh 事件：e12（坍塌）、e14（无名之书）、e15（最终事件）

---

## 八、地图拓扑

```
entrance → front_room → admin_office
                       → main_corridor → shelf_a ──→ back_corridor → forbidden_entry → deepest → (epilogue)
                                       → shelf_b ──↗
                                       → mirror_hall → mirror_world
                                       → reading_room
                       → archive_room
```

门锁：
- mirror_hall → mirror_world：需要 `mirror_reached_in`
- back_corridor → forbidden_entry：需要 `cleared_collapse`
- forbidden_entry → deepest：需要 `dealt_with_book`

---

## 九、写作注意事项

1. **每个事件至少应有 2 个 solution**：一个 tag_match（较宽泛），一个 book_match 或更精确的 tag_match。保证多数玩家有办法通过，但完美匹配有额外奖励。

2. **default_outcome 不应推进剧情**：它是"选错了"的反馈，不应 set_flag 或 gain_book。只给一段叙事文字，让玩家换本书再试。

3. **自动事件用于环境叙事和自动获书**：不需要玩家选择的剧情推进（如捡起地上的书）。

4. **harsh 慎用**：只在叙事上"危险"的场景使用（面对异常存在、最终对决等），不要在普通探索中扣 HP。

5. **Flag 命名约定**：snake_case，动词_名词格式（如 `cleared_collapse`、`found_lin`）。

6. **文本高亮**：用 `**双星号**` 标记关键信息。每段最多 1-2 处。标记线索、人物、转折，不标记普通描述。

7. **Per-book 风味文字**：对 tag_match 类型的 solution，尽量在 outcome 中添加 `book_text`，为能命中该 tag 的每本书写一段专属文字。这让不同书解同一个谜时体验不同，大幅提升重玩价值。`text` 字段作为兜底，`book_text` 中的 key 是 book_id。

8. **next_node 使用**：大多数 outcome 的 next_node 为 null（留在当前节点）。只在叙事上需要强制跳转时使用（如 e03 信任老管理员直接去 epilogue）。

9. **ID 约定**：
   - 节点：描述性 snake_case（`mirror_hall`, `back_corridor`）
   - 事件：`e{序号}_{描述}`（`e05_whispering`）
   - 书：描述性 snake_case（`dorian_gray`, `lin_letter`）
   - Flag：`动词_名词`（`cleared_collapse`）

---

## 十、添加新内容的检查清单

### 添加新书
- [ ] 在 books.json 添加条目
- [ ] tags 不要与已有书完全重复，也不要完全独特到没有事件能用
- [ ] 确认至少有 1 个现有或新建事件的 required_tags 包含这本书的某个 tag
- [ ] 安排获取方式（哪个事件的 effect 给予这本书）

### 添加新节点
- [ ] 在 nodes.json 添加条目
- [ ] 确认有至少一个其他节点的 connections 指向它
- [ ] 如果需要门锁，确认对应 flag 有设置的地方
- [ ] 分配或复用一张 image

### 添加新事件
- [ ] 在 events.json 添加条目
- [ ] 将事件 id 添加到对应节点的 events 数组
- [ ] 检查 required_tags 是否有 2-3 本书能匹配
- [ ] default_outcome 不推进剧情
- [ ] 如果 harsh=true，确认叙事上合理

### 添加新结局
- [ ] 在 endings.json 添加条目
- [ ] 设定合理的 priority（避免被更高优先级结局覆盖）
- [ ] 确认 conditions 中引用的 flag/choice/match 在游戏流程中可达
