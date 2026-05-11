import { Page } from '@playwright/test';
import * as fs from 'fs';

export type Mode = 'visual' | 'text' | 'standard' | 'guided';

export interface WalkthroughStep {
  action: string;
  note: string;
}

// ─── Action Execution (shared across all modes) ─────────────

export async function doAction(page: Page, action: string) {
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
    const actionInv = page.locator('.btn-action:has-text("翻开背包")');
    if (await actionInv.isVisible({ timeout: 600 }).catch(() => false)) {
      await actionInv.click();
    } else {
      await page.locator('.game-header__btn:has-text("背包")').click();
    }
    await page.waitForTimeout(400);

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

    const useBtn = page.locator('button:has-text("使用")').first();
    if (await useBtn.isVisible({ timeout: 600 }).catch(() => false)) {
      await useBtn.click();
      await page.waitForTimeout(500);
    }
    return;
  }
}

// ─── State Capture (varies by mode) ─────────────────────────

async function getButtonList(page: Page): Promise<string[]> {
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
  return buttons;
}

export async function captureState(page: Page, mode: Mode, opts: {
  stepNum: number;
  walkthrough?: WalkthroughStep[];
  actionIndex?: number;
}): Promise<string> {
  const lines: string[] = [];
  const screenshotDir = 'ai_test/screenshots';
  fs.mkdirSync(screenshotDir, { recursive: true });

  if (mode === 'visual') {
    const path = `${screenshotDir}/step-${String(opts.stepNum).padStart(3, '0')}.png`;
    await page.screenshot({ path, fullPage: true });
    lines.push(`[截图] ${path}`);
    lines.push(`已执行 ${opts.stepNum} 步。`);
    return lines.join('\n');
  }

  if (mode === 'text') {
    const raw = await page.locator('body').innerText().then(t => t.trim());
    lines.push('═'.repeat(60));
    lines.push('当前画面:');
    lines.push('═'.repeat(60));
    lines.push(raw.slice(0, 2000) || '(空)');
    lines.push('═'.repeat(60));
    lines.push(`已执行 ${opts.stepNum} 步。`);
    return lines.join('\n');
  }

  // standard and guided share the base format
  const texts = await page.locator('body').innerText().then(t => t.trim());
  const buttons = await getButtonList(page);

  lines.push('═'.repeat(60));
  lines.push('当前画面:');
  lines.push('═'.repeat(60));
  lines.push(texts.slice(0, 1500) || '(空)');
  lines.push('');
  lines.push('─'.repeat(60));
  lines.push('可用按钮:');
  lines.push('─'.repeat(60));
  buttons.forEach(b => lines.push('  ' + b));

  if (mode === 'guided' && opts.walkthrough && opts.actionIndex != null) {
    const step = opts.walkthrough[opts.actionIndex];
    if (step) {
      lines.push('');
      lines.push('─'.repeat(60));
      lines.push('建议操作:');
      lines.push('─'.repeat(60));
      lines.push(`  → ${step.action}（${step.note}）`);
    } else {
      lines.push('');
      lines.push('─'.repeat(60));
      lines.push('建议操作:');
      lines.push('─'.repeat(60));
      lines.push('  （攻略已结束，自由探索）');
    }
  }

  lines.push('─'.repeat(60));
  lines.push(`已执行 ${opts.stepNum} 步。`);
  return lines.join('\n');
}
