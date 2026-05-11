/**
 * AI Interactive Driver — 回放动作列表，输出当前游戏状态
 *
 * 模式 (AI_MODE 环境变量):
 *   visual   — 只输出截图路径，AI 自己看图识别
 *   text     — 只输出原始页面文字
 *   standard — 文字 + 分类按钮列表（默认）
 *   guided   — 文字 + 按钮 + 下一步建议
 *
 * 动作格式 (ai-actions.json):
 *   "click:按钮文字"   — 点击按钮（模糊匹配）
 *   "event"            — 点击第一个事件按钮
 *   "book:书名"        — 打开背包 → 选书 → 使用
 *   "wait"             — 只截图不操作
 *
 * 用法:
 *   npx playwright test ai-interactive --timeout 30000
 *   AI_MODE=visual npx playwright test ai-interactive --timeout 30000
 *   AI_MODE=guided npx playwright test ai-interactive --timeout 30000
 */
import { test } from '@playwright/test';
import * as fs from 'fs';
import { doAction, captureState, Mode, WalkthroughStep } from './lib/game-driver';

const ACTIONS_FILE = 'ai_test/ai-actions.json';

test('AI interactive', async ({ page }) => {
  const mode = (process.env.AI_MODE || 'standard') as Mode;
  const actions: string[] = JSON.parse(fs.readFileSync(ACTIONS_FILE, 'utf8'));

  let walkthrough: WalkthroughStep[] | undefined;
  if (mode === 'guided') {
    walkthrough = JSON.parse(fs.readFileSync('ai_test/walkthrough.json', 'utf8'));
  }

  await page.goto('/');
  await page.waitForTimeout(800);

  for (let i = 0; i < actions.length; i++) {
    console.log(`▸ [${i + 1}/${actions.length}] ${actions[i]}`);
    await doAction(page, actions[i]);
  }

  const output = await captureState(page, mode, {
    stepNum: actions.length,
    walkthrough,
    actionIndex: actions.length,
  });
  console.log('\n' + output);
});
