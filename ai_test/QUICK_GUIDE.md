# AI 测试工具 — 快速上手

让 AI 自动玩《底层书库》并收集体验反馈的工具集。

## 这是什么？

一套基于 Playwright 的测试工具，可以让各种 AI（Claude、GPT、Gemini 等）自动玩我们的游戏，然后写体验报告。用来测试游戏在叙事清晰度、视觉设计、情感传达等方面的表现。

## 准备工作

```bash
npm install
npx playwright install chromium
```

## 两种玩法

### 1. 让 AI 一步一步玩（交互式）

适合让 Claude Code 之类的 AI 当"玩家"：AI 读游戏输出 → 决定操作 → 写入 JSON → 重新运行 → 读新状态……循环。

```bash
# 先清空动作列表
echo "[]" > ai_test/ai-actions.json

# 运行（每次都从头回放所有动作，显示当前状态）
npx playwright test ai-interactive --timeout 30000
```

操作格式写在 `ai-actions.json` 里：

```json
["click:开始游戏", "click:继续", "click:走下石阶", "event", "book:画皮"]
```

- `"click:按钮文字"` — 点击包含该文字的按钮
- `"event"` — 点击第一个事件按钮（橙色的那个）
- `"book:书名"` — 打开背包 → 选这本书 → 使用
- `"wait"` — 不操作，只看当前状态

### 2. 让 LLM 全自动玩（需要 API Key）

LLM 每回合自己读屏幕、自己决策、自己点击，跑完整局：

```powershell
# PowerShell
$env:ANTHROPIC_API_KEY="sk-ant-..."; npx playwright test ai-player --timeout 600000
```

```bash
# Bash / Linux / Mac
ANTHROPIC_API_KEY=sk-ant-... npx playwright test ai-player --timeout 600000
```

## 四种信息模式

控制 AI 能看到多少游戏信息。用环境变量 `AI_MODE` 切换：

| 模式 | AI 看到什么 | 用来测什么 |
|------|------------|-----------|
| `visual` | 只有截图 | 视觉设计是否清晰 |
| `text` | 原始页面文字 | 光靠读文字能否理解状态 |
| `standard` | 文字 + 分类按钮列表 | 叙事是否提供了足够的策略线索（**默认**） |
| `guided` | 全部 + 下一步建议 | 纯剧情体验，不测游戏性 |

```powershell
# PowerShell 示例
$env:AI_MODE="visual"; npx playwright test ai-interactive --timeout 30000
$env:AI_MODE="guided"; npx playwright test ai-interactive --timeout 30000
```

```bash
# Bash 示例
AI_MODE=visual npx playwright test ai-interactive --timeout 30000
AI_MODE=guided npx playwright test ai-interactive --timeout 30000
```

不设 `AI_MODE` 就是 `standard` 模式。

### 各模式输出示例

**visual** — 只给截图路径，AI 要自己看图：
```
[截图] ai_test/screenshots/step-005.png
已执行 5 步。
```

**text** — 只给原始文字，不区分按钮类型：
```
═══ 当前画面 ═══
✦ 底层书库
你站在走廊中央……
走向阅览室
走向书架A区
穿过坍塌处
═══════════════
```

**standard** — 分类标记按钮（默认）：
```
═══ 当前画面 ═══
你站在走廊中央……
─── 可用按钮 ───
  ⚡ 调查低语声          ← 事件
  🚪 走向阅览室          ← 导航
  🔒 穿过坍塌处          ← 锁定
```

**guided** — 带攻略建议：
```
─── 建议操作 ───
  → event（触发低语事件，用整理类的书）
```

## 盲测规则

让 AI 玩的关键是**不给它看源代码**——不能读 `src/` 下面的任何文件。只能从游戏输出推理。这样才能测出游戏的叙事和 UI 是否够清晰。

## 体验报告

AI 的体验报告存在 `ai_test_feedback/` 里，命名格式：

```
{ai名字}_{游戏版本}_{日期}.md
```

例如：`claude-opus_v1.0_2026-05-10.md`

现有报告可以直接读，了解之前的 AI 都怎么评价的。

## 文件说明

```
ai_test/
├── QUICK_GUIDE.md          ← 你在看的这个
├── README.md               ← 给 AI 看的详细指南
├── ai-actions.json         ← 操作列表（交互式的输入）
├── walkthrough.json        ← guided 模式的攻略数据
├── ai-interactive.spec.ts  ← 交互式回放测试
├── ai-player.spec.ts       ← 全自动 LLM 玩家
├── lib/
│   └── game-driver.ts      ← 共享代码（操作执行 + 状态获取）
├── screenshots/            ← visual 模式截图（gitignored）
└── ai_test_feedback/       ← AI 体验报告
```
