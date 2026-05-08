# 数据格式 Schema

所有内容用 JSON 描述，本文件定义所有 JSON 的格式标准。AI 写代码时直接按这个 schema 实现。

## books.json

```json
{
  "books": [
    {
      "id": "metamorphosis",
      "title": "变形记",
      "author": "卡夫卡",
      "quote": "我必须消失",
      "tags": ["异化", "甲虫", "家庭", "恐惧", "身体"],
      "description": "格里高尔一觉醒来，发现自己变成了一只巨大的甲虫。"
    },
    {
      "id": "starter_handbook",
      "title": "图书馆员手册",
      "author": "（佚名）",
      "quote": "整理是一种祈祷",
      "tags": ["规则", "整理", "基础", "知识"],
      "description": "新人入职时领取的册子，封面磨损，看起来已经传过很多人。"
    }
  ]
}
```

### 字段说明

| 字段 | 必填 | 类型 | 说明 |
|---|---|---|---|
| `id` | ✓ | string | 全局唯一，蛇形命名 |
| `title` | ✓ | string | 显示名 |
| `author` | ✓ | string | 作者，虚构作品填"（佚名）" |
| `quote` | ✓ | string | 台词，建议 4-15 字 |
| `tags` | ✓ | array of string | 3-5 个 tag |
| `description` | ✓ | string | 简介，1-2 句 |
| `image` | 可选 | string | 书卡封面图，放在 `public/images/books/`。AssetImage 自动 fallback: webp → png → svg |

## events.json

```json
{
  "events": [
    {
      "id": "rusty_door",
      "node_id": "main_corridor",
      "description": "一扇生锈的铁门挡住了去路。门把手上有薄薄一层尘，看起来很久没人开过。",
      "prompt": "选一本书来应对",
      "solutions": [
        {
          "type": "book_match",
          "required_book_id": "metamorphosis",
          "outcome": {
            "text": "你想象自己是一只甲虫——足够小，足够薄。当你回过神，你已经在门的另一边了。",
            "effects": [
              {"type": "mark_book", "book_id": "metamorphosis", "state": "glowing"},
              {"type": "set_flag", "key": "passed_rusty_door", "value": true}
            ],
            "next_node": "back_corridor"
          }
        },
        {
          "type": "tag_match",
          "required_tags": ["力量", "毁灭"],
          "outcome": {
            "text": "你撞开了门。门倒下时砸起一片灰尘，你呛得咳嗽。",
            "effects": [
              {"type": "set_flag", "key": "passed_rusty_door", "value": true}
            ],
            "next_node": "back_corridor"
          }
        },
        {
          "type": "tag_match",
          "required_tags": ["开锁", "智慧"],
          "outcome": {
            "text": "你研究了一下锁芯。这种老式锁并不复杂，几分钟后门安静地开了。",
            "effects": [
              {"type": "set_flag", "key": "passed_rusty_door", "value": true}
            ],
            "next_node": "back_corridor"
          }
        }
      ],
      "default_outcome": {
        "text": "这本书在这里似乎用不上。门依然紧闭。",
        "effects": [],
        "next_node": null
      }
    }
  ]
}
```

### 字段说明

| 字段 | 必填 | 类型 | 说明 |
|---|---|---|---|
| `id` | ✓ | string | |
| `node_id` | ✓ | string | 这个事件所在的节点 |
| `description` | ✓ | string | 玩家进入事件时看到的描述 |
| `prompt` | ✓ | string | 行动提示，通常是"选一本书来应对"或类似 |
| `solutions` | ✓ | array | 各种解法，按数组顺序匹配 |
| `default_outcome` | ✓ | Outcome | 没有任何匹配时的默认结果 |
| `harsh` | 可选 | boolean | 为 `true` 时，用错书会扣 HP；默认 `false`，用错书仅显示 miss 面板，不扣血 |

### Solution 字段

| 字段 | 必填 | 类型 | 说明 |
|---|---|---|---|
| `type` | ✓ | "book_match" \| "tag_match" | 匹配类型 |
| `required_book_id` | book_match 时必填 | string | 指定的书 |
| `required_tags` | tag_match 时必填 | array of string | 任意一个 tag 命中即可（OR 关系）|
| `match_mode` | 可选 | "any" \| "all" | tag 匹配模式，默认 "any" |
| `outcome` | ✓ | Outcome | |

### Outcome 字段

| 字段 | 必填 | 类型 | 说明 |
|---|---|---|---|
| `text` | ✓ | string | 显示给玩家的结果文本（兜底，当 book_text 无匹配时使用） |
| `book_text` | 可选 | Record<string, string> | Per-book 风味文字。key 为 book_id，value 为该书专属的结果文本。匹配时自动覆盖 `text` |
| `effects` | ✓ | array of Effect | 状态改变 |
| `next_node` | 可选 | string \| null | 解决后跳转到哪个节点。为 null 表示留在当前节点 |

### Effect 类型清单

```json
// 获得一本书
{"type": "gain_book", "book_id": "metamorphosis"}

// 永久失去一本书
{"type": "lose_book", "book_id": "metamorphosis"}

// 改变书的状态
{"type": "mark_book", "book_id": "metamorphosis", "state": "glowing"}
// state 可以是: normal / worn / glowing / consumed

// 设置剧情 flag
{"type": "set_flag", "key": "met_lin", "value": true}

// 解锁/锁定节点
{"type": "unlock_node", "node_id": "secret_room"}
{"type": "lock_node", "node_id": "front_room"}

// 把一本书变成另一本（剧情用）
{"type": "transform_book", "from_id": "lin_letter", "to_id": "lin_book"}

// 记录关键选择（用于结局判定）
{"type": "record_choice", "choice_id": "mirror_choice", "option_id": "reach_in"}

// 标记超级匹配已触发
{"type": "trigger_super_match", "match_id": "metamorphosis_beetle"}
```

## nodes.json

```json
{
  "nodes": [
    {
      "id": "entrance",
      "name": "入口",
      "description": "你站在底层书库的入口。一段石阶向下延伸，下面光线昏黄。",
      "events": [],
      "connections": [
        {
          "target": "front_room",
          "label": "走下石阶",
          "requirement": "none"
        }
      ]
    },
    {
      "id": "main_corridor",
      "name": "主走廊",
      "description": "两侧是高耸的书架。空气中漂浮着纸屑和尘。某个方向传来轻微的水声。",
      "events": ["rusty_door", "whispering_shelf"],
      "connections": [
        {
          "target": "back_corridor",
          "label": "穿过铁门",
          "requirement": "flag",
          "requirement_value": "passed_rusty_door"
        },
        {
          "target": "shelf_a",
          "label": "走向 A 区书架",
          "requirement": "none"
        },
        {
          "target": "mirror_hall",
          "label": "通向镜厅",
          "requirement": "none"
        }
      ]
    }
  ]
}
```

### 字段说明

| 字段 | 必填 | 类型 | 说明 |
|---|---|---|---|
| `id` | ✓ | string | |
| `name` | ✓ | string | UI 显示名 |
| `description` | ✓ | string | 进入时的场景描述（支持 `**高亮**` 标记） |
| `image` | 可选 | string | 场景插图，放在 `public/images/nodes/`。AssetImage 自动 fallback: webp → png → svg |
| `events` | ✓ | array of event_id | 节点上的事件 |
| `connections` | ✓ | array of Connection | 出去的路径 |

### Connection 字段

| 字段 | 必填 | 类型 | 说明 |
|---|---|---|---|
| `target` | ✓ | node_id | 目标节点 |
| `label` | ✓ | string | UI 显示的路径名 |
| `requirement` | ✓ | "none" \| "tag" \| "flag" \| "book" | 解锁条件类型 |
| `requirement_value` | requirement != none 时必填 | string \| array | 视类型而定 |

### Requirement 类型

- `none`：始终可走
- `tag`：背包里有任一带这个 tag 的书；`requirement_value` 是 string 或 array
- `flag`：某个 flag 为真；`requirement_value` 是 flag 的 key
- `book`：背包里必须有这本书；`requirement_value` 是 book_id

## endings.json

```json
{
  "endings": [
    {
      "id": "ending_A_peaceful",
      "name": "结局A：安宁",
      "conditions": [
        {"type": "key_choice", "choice_id": "trust_old_librarian", "value": "trust"}
      ],
      "text": "你回到地面，把工牌交还。前辈说得对——林只是离开了。\n\n那天晚上，你在公寓里听到一种微弱的声音，像是远处书页翻动……你打开窗，外面只有风。\n\n你以为故事就这样结束了。",
      "priority": 10
    },
    {
      "id": "ending_D_hidden",
      "name": "结局D：读完",
      "conditions": [
        {"type": "super_match_triggered", "match_id": "read_the_book_that_reads_you"}
      ],
      "text": "（隐藏结局文本）",
      "priority": 100
    }
  ]
}
```

### 结局判定规则

- 遍历所有结局，按 `priority` 从高到低排序
- 第一个满足所有 `conditions` 的结局即为玩家的结局
- 必须有一个"兜底"结局（条件为空数组 + 最低 priority），保证一定能匹配

### Condition 类型

```json
// 关键选择
{"type": "key_choice", "choice_id": "xxx", "value": "yyy"}

// flag 状态
{"type": "flag", "key": "xxx", "value": true}

// 拥有/失去某本书
{"type": "has_book", "book_id": "xxx"}
{"type": "lost_book", "book_id": "xxx"}

// 触发了某个超级匹配
{"type": "super_match_triggered", "match_id": "xxx"}

// 访问过某节点
{"type": "visited_node", "node_id": "xxx"}
```

## strings.json（UI 文本）

```json
{
  "ui": {
    "main_menu": {
      "title": "底层书库",
      "start": "开始",
      "continue": "继续",
      "quit": "退出"
    },
    "inventory": {
      "title": "你的书",
      "empty": "你的背包是空的。",
      "back": "返回"
    },
    "event": {
      "select_book": "选一本书来应对",
      "use_book": "使用《{title}》",
      "no_book_chosen": "你还没选书。",
      "continue": "继续"
    },
    "ending": {
      "to_be_continued": "（待续）",
      "back_to_menu": "返回主菜单"
    }
  }
}
```

把所有 UI 文本集中放在这里便于：
- 后期本地化（翻译成英文等）
- 全局调整文风
- 不污染代码

## 命名规范

- ID 都用蛇形小写（snake_case）：`rusty_door`、`metamorphosis`、`mirror_choice`
- ID 应该有语义，不要 `event_001` 这种
- 文件名也用蛇形小写

## 数据完整性检查（建议做的工具）

写一个简单脚本，启动游戏前自动检查：
- 所有 event 引用的 book_id 都存在
- 所有 connection 的 target 节点都存在
- 所有 next_node 引用的节点都存在
- 所有结局的 condition 引用的 flag/choice/match 都至少在某处被设置过

这个脚本可以让 AI 帮你写，5 分钟搞定，能省后期大量调试时间。
