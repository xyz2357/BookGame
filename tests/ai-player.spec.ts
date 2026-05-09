/**
 * AI Player — 让 LLM 自动玩《底层书库》
 *
 * 用法 (PowerShell):
 *   $env:ANTHROPIC_API_KEY="sk-..."; npx playwright test ai-player --timeout 600000
 *
 * 用法 (Bash):
 *   ANTHROPIC_API_KEY=sk-... npx playwright test ai-player --timeout 600000
 *
 * 输出:
 *   playthrough-screenshots/ai/ai-game-log.txt  — 逐回合决策日志
 *   playthrough-screenshots/ai/turn-*.png       — 关键截图
 *   playthrough-screenshots/ai/ending.png       — 结局截图
 *
 * 换 LLM: 修改 askLLM() 函数，换成 OpenAI / 本地模型等。
 */
import { test, Page } from '@playwright/test';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';

const DIR = 'playthrough-screenshots/ai';
const LOG_FILE = `${DIR}/ai-game-log.txt`;
const MAX_TURNS = 80;

// ─── LLM 接口 ───────────────────────────────────────────────

const client = new Anthropic();

const SYSTEM_PROMPT = `你是一个正在玩文字冒险游戏《底层书库》的玩家。

## 游戏机制
- 你在一座图书馆的地下书库中探索，目标是找到失踪的同事"林"
- 每个房间有场景描述、可触发的事件（橙色按钮）、和导航按钮（去其他房间）
- 事件分两种：自动事件（只有"继续"按钮）和挑战事件（需要你选一本书来应对）
- 挑战事件时，你要打开背包选一本书使用。每本书有标签（tags），事件需要特定标签的书才能成功
- 成功后点"继续"，失败后点"换一本书试试"可以重试
- 你有生命值（HP），显示为蜡烛图标🕯️。harsh 事件失败会扣 HP

## 书籍标签匹配策略
- 仔细阅读事件描述，推理它需要什么类型的书
- 与"揭露真相、觉醒"相关 → 选《狂人日记》《画皮》
- 与"规则、整理、知识"相关 → 选《图书馆员手册》《山海经》
- 与"镜子、画像、双面"相关 → 选《道林·格雷的画像》
- 与"家庭、儿童、东方"相关 → 选《促织》《小王子》《变形记》
- 与"循环、记忆、古老"相关 → 选《百年孤独》《山海经》
- 与"恐惧、共鸣、崩塌"相关 → 选《厄舍府的崩塌》《变形记》
- 林的纸条和无名之书是关键剧情道具，留给关键时刻

## 探索策略
- 先做完当前房间的所有事件，再移动到下一个房间
- 优先探索新区域，不要反复回已经清空事件的房间
- 如果有被锁住的通道（灰色/disabled 按钮），先去其他地方解锁条件
- 目标是到达"最深处"找到林

## 重要
- 对老管理员要"质疑"（用揭露类的书），不要信任他，否则游戏会提前结束
- 在禁区用《林的纸条》或《狂人日记》对付无名之书
- 最终对林使用《无名之书》可达到真结局`;

interface GameState {
  screenText: string;
  buttons: { text: string; type: string; enabled: boolean; index: number }[];
  bookCount: number;
  hp: number;
  turn: number;
}

async function askLLM(state: GameState, history: string[]): Promise<string> {
  const recentHistory = history.slice(-10).join('\n');

  const userMsg = `## 当前游戏状态（第 ${state.turn} 回合）

画面文字：
${state.screenText}

可用按钮：
${state.buttons.map(b => `  [${b.index}] ${b.text} (${b.type}${b.enabled ? '' : ', disabled'})`).join('\n')}

背包书籍数: ${state.bookCount}
HP 蜡烛数: ${state.hp}

最近行动记录：
${recentHistory || '（刚开始）'}

---
请选择要点击的按钮编号。只回复一个数字，不要解释。如果你认为需要在背包中选一本特定的书，回复格式: 按钮编号|书名（如: 3|画皮）`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 100,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMsg }],
  });

  const text = (response.content[0] as { type: 'text'; text: string }).text.trim();
  return text;
}

// ─── 游戏状态读取 ─────────────────────────────────────────

async function readGameState(page: Page, turn: number): Promise<GameState> {
  const screenText = await page.locator('.game-layout, .main-menu, .ending-view, .inventory-overlay')
    .allInnerTexts()
    .then(t => t.join('\n').slice(0, 2000));

  const btnLocators = page.locator('button:visible');
  const count = await btnLocators.count();
  const buttons: GameState['buttons'] = [];
  for (let i = 0; i < count; i++) {
    const el = btnLocators.nth(i);
    const text = (await el.innerText()).trim();
    const enabled = await el.isEnabled();
    const classList = await el.getAttribute('class') || '';
    let type = 'other';
    if (classList.includes('btn-event')) type = 'event';
    else if (classList.includes('btn-nav')) type = 'nav';
    else if (classList.includes('btn-action')) type = 'action';
    else if (classList.includes('book-card') || text.includes('使用')) type = 'inventory';
    else if (classList.includes('game-header')) type = 'header';
    else if (text === '继续' || text.includes('换一本书')) type = 'action';
    buttons.push({ text, type, enabled, index: i });
  }

  const hpCandles = await page.locator('.hp-candle').count().catch(() => 0);
  const bookBadge = await page.locator('.game-header__btn:has-text("背包")').innerText().catch(() => '');
  const bookMatch = bookBadge.match(/\((\d+)\)/);
  const bookCount = bookMatch ? parseInt(bookMatch[1]) : 0;

  return { screenText, buttons, bookCount, hp: hpCandles, turn };
}

// ─── 动作执行 ──────────────────────────────────────────────

async function executeAction(page: Page, state: GameState, llmResponse: string): Promise<string> {
  const parts = llmResponse.split('|');
  const btnIndex = parseInt(parts[0]);
  const bookHint = parts[1]?.trim();

  if (isNaN(btnIndex) || btnIndex < 0 || btnIndex >= state.buttons.length) {
    return `无效按钮编号: ${llmResponse}`;
  }

  const target = state.buttons[btnIndex];
  if (!target.enabled) {
    return `按钮已禁用: ${target.text}`;
  }

  // click the button
  const btns = page.locator('button:visible');
  await btns.nth(btnIndex).click();
  await page.waitForTimeout(500);

  let actionDesc = `点击 [${target.text}]`;

  // if we're now in inventory and have a book hint, find and use it
  if (bookHint) {
    await page.waitForTimeout(300);
    const books = page.locator('.book-card');
    const bookCount = await books.count();
    let clicked = false;
    for (let i = 0; i < bookCount; i++) {
      const text = await books.nth(i).innerText();
      if (text.includes(bookHint)) {
        await books.nth(i).click();
        await page.waitForTimeout(200);
        clicked = true;
        break;
      }
    }
    if (!clicked && bookCount > 0) {
      await books.first().click();
      await page.waitForTimeout(200);
    }

    // click use button
    const useBtn = page.locator('button:has-text("使用")').first();
    if (await useBtn.isVisible({ timeout: 800 }).catch(() => false)) {
      await useBtn.click();
      await page.waitForTimeout(500);
      actionDesc += ` → 使用《${bookHint}》`;
    }
  }

  return actionDesc;
}

// ─── 主循环 ───────────────────────────────────────────────

function log(msg: string) {
  const line = `[${new Date().toISOString().slice(11, 19)}] ${msg}\n`;
  fs.appendFileSync(LOG_FILE, line, 'utf8');
  console.log(line.trim());
}

test('AI plays the game', async ({ page }) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    test.skip(true, 'Set ANTHROPIC_API_KEY to run this test');
    return;
  }

  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(LOG_FILE, `=== AI PLAYTHROUGH ${new Date().toISOString()} ===\n\n`, 'utf8');

  await page.goto('/');
  await page.waitForTimeout(1000);

  const history: string[] = [];
  let turn = 0;
  let gameOver = false;

  while (turn < MAX_TURNS && !gameOver) {
    turn++;
    const state = await readGameState(page, turn);

    // screenshot every 5 turns or at key moments
    if (turn % 5 === 1 || turn <= 3) {
      await page.screenshot({
        path: `${DIR}/turn-${String(turn).padStart(3, '0')}.png`,
        fullPage: true,
      });
    }

    // check for game over
    if (state.screenText.includes('结局')) {
      await page.screenshot({ path: `${DIR}/ending.png`, fullPage: true });
      log(`🏁 游戏结束！\n${state.screenText.slice(0, 500)}`);
      gameOver = true;
      break;
    }

    // log state
    log(`--- 第 ${turn} 回合 ---`);
    log(`画面: ${state.screenText.slice(0, 150).replace(/\n/g, ' ')}...`);
    log(`按钮: ${state.buttons.filter(b => b.type !== 'header').map(b => b.text).join(' | ')}`);
    log(`背包: ${state.bookCount} 本, HP: ${state.hp}`);

    // ask LLM
    let llmChoice: string;
    try {
      llmChoice = await askLLM(state, history);
    } catch (e: any) {
      log(`LLM 错误: ${e.message}`);
      break;
    }
    log(`AI 决策: ${llmChoice}`);

    // execute
    const result = await executeAction(page, state, llmChoice);
    log(`执行: ${result}`);
    history.push(`回合${turn}: ${result}`);

    await page.waitForTimeout(300);
  }

  if (!gameOver) {
    await page.screenshot({ path: `${DIR}/final.png`, fullPage: true });
    log(`达到最大回合数 ${MAX_TURNS}，游戏未结束。`);
  }

  log(`\n=== 总计 ${turn} 回合 ===`);
});
