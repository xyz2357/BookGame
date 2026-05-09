/**
 * AI Interactive Driver — 回放动作列表，输出当前游戏状态
 *
 * 动作格式 (ai-actions.json):
 *   "click:按钮文字"   — 点击按钮（模糊匹配）
 *   "event"            — 点击第一个事件按钮
 *   "book:书名"        — 打开背包 → 选书 → 使用
 *   "wait"             — 只截图不操作
 */
import { test, Page } from '@playwright/test';
import * as fs from 'fs';

const ACTIONS_FILE = 'tests/ai-actions.json';
const SCREENSHOT = 'playthrough-screenshots/ai-live.png';

async function getState(page: Page) {
  const texts = await page.locator('body')
    .innerText().then(t => t.trim());

  const btnEls = page.locator('button:visible');
  const count = await btnEls.count();
  const buttons: string[] = [];
  for (let i = 0; i < count; i++) {
    const text = (await btnEls.nth(i).innerText()).trim();
    const enabled = await btnEls.nth(i).isEnabled();
    const cls = await btnEls.nth(i).getAttribute('class') || '';
    const tag = cls.includes('btn-event') ? '⚡' :
                cls.includes('btn-nav') ? '🚪' :
                cls.includes('btn-action') ? '▶' :
                cls.includes('game-header') ? '·' : '○';
    buttons.push(`${enabled ? tag : '🔒'} ${text}`);
  }
  return { texts, buttons };
}

async function doAction(page: Page, action: string) {
  if (action === 'wait') {
    await page.waitForTimeout(300);
    return;
  }

  if (action === 'event') {
    await page.locator('.btn-event').first().click();
    await page.waitForTimeout(500);
    return;
  }

  if (action.startsWith('click:')) {
    const target = action.slice(6);
    const btns = page.locator('button:visible');
    const count = await btns.count();
    for (let i = 0; i < count; i++) {
      const text = (await btns.nth(i).innerText()).trim();
      if (text.includes(target)) {
        const enabled = await btns.nth(i).isEnabled();
        if (enabled) {
          await btns.nth(i).click();
          await page.waitForTimeout(500);
          return;
        }
      }
    }
    console.log(`⚠ 未找到可点击按钮: "${target}"`);
    return;
  }

  if (action.startsWith('book:')) {
    const bookName = action.slice(5);
    // open inventory
    const actionInv = page.locator('.btn-action:has-text("翻开背包")');
    if (await actionInv.isVisible({ timeout: 600 }).catch(() => false)) {
      await actionInv.click();
    } else {
      await page.locator('.game-header__btn:has-text("背包")').click();
    }
    await page.waitForTimeout(400);

    // find book
    const books = page.locator('.book-card');
    const bookCount = await books.count();
    for (let i = 0; i < bookCount; i++) {
      const text = await books.nth(i).innerText();
      if (text.includes(bookName)) {
        await books.nth(i).click();
        break;
      }
    }
    await page.waitForTimeout(200);

    // use
    const useBtn = page.locator('button:has-text("使用")').first();
    if (await useBtn.isVisible({ timeout: 600 }).catch(() => false)) {
      await useBtn.click();
      await page.waitForTimeout(500);
    }
    return;
  }
}

test('AI interactive', async ({ page }) => {
  const actions: string[] = JSON.parse(fs.readFileSync(ACTIONS_FILE, 'utf8'));

  fs.mkdirSync('playthrough-screenshots', { recursive: true });
  await page.goto('/');
  await page.waitForTimeout(800);

  // replay all actions
  for (let i = 0; i < actions.length; i++) {
    console.log(`▸ [${i + 1}/${actions.length}] ${actions[i]}`);
    await doAction(page, actions[i]);
  }

  // capture current state
  const state = await getState(page);
  await page.screenshot({ path: SCREENSHOT, fullPage: true });

  console.log('\n' + '═'.repeat(60));
  console.log('📖 当前画面:');
  console.log('═'.repeat(60));
  console.log(state.texts.slice(0, 1500) || '(空)');
  console.log('\n' + '─'.repeat(60));
  console.log('🎮 可用按钮:');
  console.log('─'.repeat(60));
  state.buttons.forEach(b => console.log('  ' + b));
  console.log('─'.repeat(60));
  console.log(`\n已执行 ${actions.length} 步。截图: ${SCREENSHOT}`);
});
