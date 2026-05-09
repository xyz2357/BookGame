import { test, Page } from '@playwright/test';
import * as fs from 'fs';

const DIR = 'playthrough-screenshots/deep';
let stepNum = 0;

function nextStep(label: string) {
  stepNum++;
  return `${String(stepNum).padStart(2, '0')}-${label}`;
}

async function captureState(page: Page, label: string) {
  const step = nextStep(label);
  const texts = await page.locator('.game-layout, .main-menu, .ending-view, .inventory-overlay').allInnerTexts();
  const buttons = await page.locator('button:visible').allInnerTexts();
  await page.screenshot({ path: `${DIR}/${step}.png`, fullPage: true });
  const log = `\n=== ${step} ===\nTEXT:\n${texts.join('\n---\n')}\nBUTTONS: [${buttons.join('] [')}]\n`;
  fs.appendFileSync(`${DIR}/game-log.txt`, log, 'utf8');
  return { texts, buttons, step };
}

async function clearAutoEvents(page: Page, label: string) {
  let cleared = 0;
  while (true) {
    const continueBtn = page.getByRole('button', { name: '继续', exact: true });
    const isVisible = await continueBtn.isVisible({ timeout: 600 }).catch(() => false);
    if (!isVisible) break;
    const isEnabled = await continueBtn.isEnabled().catch(() => false);
    if (!isEnabled) break;
    await captureState(page, `${label}-auto${cleared}`);
    await continueBtn.click();
    await page.waitForTimeout(500);
    cleared++;
  }
  return cleared;
}

async function nav(page: Page, name: string | RegExp, label: string) {
  const btn = page.getByRole('button', { name });
  if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(600);
    await clearAutoEvents(page, label);
    await captureState(page, label);
    return true;
  }
  return false;
}

async function useBook(page: Page, bookTitle: string, label: string): Promise<'success' | 'fail' | 'none'> {
  const actionInv = page.locator('.btn-action:has-text("翻开背包")');
  if (await actionInv.isVisible({ timeout: 600 }).catch(() => false)) {
    await actionInv.click();
  } else {
    await page.locator('.game-header__btn:has-text("背包")').click();
  }
  await page.waitForTimeout(400);

  const books = page.locator('.book-card');
  const count = await books.count();
  let found = false;
  for (let i = 0; i < count; i++) {
    const text = await books.nth(i).innerText();
    if (text.includes(bookTitle)) {
      await books.nth(i).click();
      found = true;
      break;
    }
  }
  if (!found && count > 0) {
    await books.first().click();
  }
  await page.waitForTimeout(200);

  const useBtn = page.locator('button:has-text("使用")').first();
  if (await useBtn.isVisible({ timeout: 600 }).catch(() => false)) {
    await useBtn.click();
    await page.waitForTimeout(600);
    await captureState(page, `${label}-result`);

    const continueBtn = page.getByRole('button', { name: '继续' });
    const retryBtn = page.getByRole('button', { name: /换一本书试试/ });
    if (await continueBtn.isVisible({ timeout: 800 }).catch(() => false)) {
      await continueBtn.click();
      await page.waitForTimeout(400);
      return 'success';
    }
    if (await retryBtn.isVisible({ timeout: 800 }).catch(() => false)) {
      await retryBtn.click();
      await page.waitForTimeout(400);
      return 'fail';
    }
    return 'success';
  }
  return 'none';
}

async function tryEvent(page: Page, label: string): Promise<boolean> {
  const btn = page.locator('.btn-event').first();
  if (await btn.isVisible({ timeout: 1200 }).catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(500);
    await captureState(page, label);
    return true;
  }
  return false;
}

test('deep playthrough - true ending path', async ({ page }) => {
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(`${DIR}/game-log.txt`,
    `=== DEEP PLAYTHROUGH ${new Date().toISOString()} ===\n`, 'utf8');

  await page.goto('/');
  await page.waitForTimeout(500);
  await captureState(page, 'menu');

  // START
  await page.getByRole('button', { name: '开始游戏' }).click();
  await page.waitForTimeout(600);
  await clearAutoEvents(page, 'entrance');
  await captureState(page, 'entrance');

  // FRONT ROOM → lin_letter
  await nav(page, /走下石阶/, 'front-room');

  // ADMIN OFFICE → e03 old librarian → 画皮 (doubt path)
  await nav(page, /走向管理员办公室/, 'admin-office');
  if (await tryEvent(page, 'e03-librarian')) {
    await useBook(page, '画皮', 'e03');
    await captureState(page, 'after-e03');
  }

  // ARCHIVE ROOM → 山海经 (auto) + personnel files
  await nav(page, /走向档案室/, 'archive');
  if (await tryEvent(page, 'archive-personnel')) {
    let r = await useBook(page, '狂人日记', 'personnel');
    if (r === 'fail') await useBook(page, '画皮', 'personnel2');
    await captureState(page, 'after-personnel');
  }

  // → admin → main corridor
  await nav(page, /回到管理员办公室/, 'back-admin');
  await nav(page, /前往主走廊/, 'main-corridor');

  // e05 whispering → 图书馆员手册 (整理 tag)
  if (await tryEvent(page, 'e05-whisper')) {
    let r = await useBook(page, '图书馆员手册', 'e05');
    if (r === 'fail') await useBook(page, '山海经', 'e05b');
    await captureState(page, 'after-e05');
  }

  // READING ROOM → 小王子 (auto) + phantom reader + desk book
  await nav(page, /走向阅览室/, 'reading-room');
  if (await tryEvent(page, 'phantom-reader')) {
    await useBook(page, '小王子', 'phantom');
    await captureState(page, 'after-phantom');
  }
  if (await tryEvent(page, 'desk-book')) {
    let r = await useBook(page, '山海经', 'desk');
    if (r === 'fail') r = await useBook(page, '百年孤独', 'desk2');
    await captureState(page, 'after-desk');
  }

  // → MAIN CORRIDOR → SHELF A → dorian_gray (auto) + misplaced
  await nav(page, /回到主走廊/, 'back-main1');
  await nav(page, /走向书架A区/, 'shelf-a');
  if (await tryEvent(page, 'misplaced')) {
    let r = await useBook(page, '图书馆员手册', 'misplaced');
    if (r === 'fail') r = await useBook(page, '山海经', 'misplaced2');
    await captureState(page, 'after-misplaced');
  }

  // → BACK CORRIDOR (via shelf gap)
  await nav(page, /穿过书架间的缝隙/, 'back-corridor');
  // → MAIN CORRIDOR
  await nav(page, /回到主走廊/, 'back-main2');

  // MIRROR HALL → 道林·格雷 (镜子/画像 tags)
  await nav(page, /走向镜厅/, 'mirror-hall');
  if (await tryEvent(page, 'mirror-event')) {
    await useBook(page, '道林', 'mirror');
    await captureState(page, 'after-mirror');
  }

  // MIRROR WORLD → 道林·格雷 on mirror_lin (super match!)
  if (await nav(page, /走进镜中/, 'mirror-world')) {
    if (await tryEvent(page, 'mirror-lin')) {
      await useBook(page, '道林', 'mirror-lin');
      await captureState(page, 'after-mirror-lin');
    }
  }

  // → SHELF B (from mirror world exit) → 促织 (auto) + crying child
  await nav(page, /从镜中走出/, 'from-mirror');
  if (!await page.getByRole('button', { name: /书架B/ }).isVisible({ timeout: 500 }).catch(() => false)) {
    // we should already be in shelf_b after exiting mirror
    await captureState(page, 'shelf-b');
  }
  if (await tryEvent(page, 'crying-child')) {
    let r = await useBook(page, '促织', 'crying');
    if (r === 'fail') r = await useBook(page, '小王子', 'crying2');
    await captureState(page, 'after-crying');
  }

  // → BACK CORRIDOR (via shelf gap) → collapse + darkness
  await nav(page, /穿过书架间的缝隙/, 'back-corridor2');
  if (await tryEvent(page, 'collapse')) {
    let r = await useBook(page, '厄舍府', 'collapse');
    if (r === 'fail') r = await useBook(page, '变形记', 'collapse2');
    await captureState(page, 'after-collapse');
  }
  if (await tryEvent(page, 'darkness')) {
    let r = await useBook(page, '画皮', 'darkness');
    if (r === 'fail') r = await useBook(page, '山海经', 'darkness2');
    await captureState(page, 'after-darkness');
  }

  // FORBIDDEN ENTRY → get the_book_that_reads_you
  if (await nav(page, /穿过坍塌处/, 'forbidden')) {
    if (await tryEvent(page, 'forbidden-book')) {
      let r = await useBook(page, '林的纸条', 'forbidden');
      if (r === 'fail') r = await useBook(page, '狂人日记', 'forbidden2');
      await captureState(page, 'after-forbidden');
    }
  }

  // DEEPEST → FINAL with Lin
  if (await nav(page, /继续深入/, 'deepest')) {
    if (await tryEvent(page, 'final-lin')) {
      await useBook(page, '无名之书', 'final');
      await captureState(page, 'after-final');
    }
  }

  // Ending
  await page.waitForTimeout(1000);
  await captureState(page, 'ending');

  console.log('\n=== DEEP PLAYTHROUGH COMPLETE ===');
});
