import { test, Page } from '@playwright/test';
import * as fs from 'fs';

const DIR = 'playthrough-screenshots';

async function captureState(page: Page, step: string) {
  const texts = await page.locator('.game-layout, .main-menu, .ending-view, .inventory-overlay').allInnerTexts();
  const buttons = await page.locator('button:visible').allInnerTexts();
  const screenshot = `${DIR}/${step}.png`;
  await page.screenshot({ path: screenshot, fullPage: true });

  const log = `\n=== ${step} ===\n` +
    `TEXT:\n${texts.join('\n---\n')}\n` +
    `BUTTONS: [${buttons.join('] [')}]\n`;
  fs.appendFileSync(`${DIR}/game-log.txt`, log, 'utf8');
  return { texts, buttons };
}

async function clickButton(page: Page, name: string | RegExp) {
  await page.getByRole('button', { name }).click();
  await page.waitForTimeout(400);
}

async function tryClickButton(page: Page, name: string | RegExp): Promise<boolean> {
  const btn = page.getByRole('button', { name });
  if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(400);
    return true;
  }
  return false;
}

async function useBookFromInventory(page: Page, bookIndex: number, step: string) {
  const invBtn = page.locator('.btn-action:has-text("翻开背包")');
  if (await invBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await invBtn.click();
  } else {
    await page.locator('.game-header__btn:has-text("背包")').click();
  }
  await page.waitForTimeout(300);
  await captureState(page, `${step}-inventory`);

  const books = page.locator('.book-card');
  const count = await books.count();
  if (count === 0) {
    await captureState(page, `${step}-no-books`);
    const closeBtn = page.locator('.inventory-close, .inventory-overlay__close');
    if (await closeBtn.isVisible()) await closeBtn.click();
    return false;
  }

  const idx = Math.min(bookIndex, count - 1);
  await books.nth(idx).click();
  await page.waitForTimeout(200);
  await captureState(page, `${step}-book-selected`);

  const useBtn = page.locator('.inventory-use-btn, button:has-text("使用")');
  if (await useBtn.first().isVisible({ timeout: 1000 }).catch(() => false)) {
    await useBtn.first().click();
    await page.waitForTimeout(500);
    await captureState(page, `${step}-result`);
    return true;
  }
  return false;
}

test('full game playthrough', async ({ page }) => {
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(`${DIR}/game-log.txt`, `=== PLAYTHROUGH START ${new Date().toISOString()} ===\n`, 'utf8');

  // Main menu
  await page.goto('/');
  await page.waitForTimeout(500);
  await captureState(page, '01-main-menu');

  // Start game
  await clickButton(page, /开始游戏/);
  await captureState(page, '02-entrance');

  // entrance has auto event e01_dust
  await page.getByText('你深吸一口气').waitFor({ timeout: 5000 }).catch(() => {});
  await captureState(page, '03-e01-dust');

  // Continue past the auto event
  if (await tryClickButton(page, /继续/)) {
    await captureState(page, '04-after-e01');
  }

  // Go to front_room
  await clickButton(page, /走下石阶/);
  await captureState(page, '05-front-room');

  // front_room auto event e02_lin_desk
  await page.getByText('如果你看到这个').waitFor({ timeout: 5000 }).catch(() => {});
  await captureState(page, '06-e02-lin-desk');

  if (await tryClickButton(page, /继续/)) {
    await captureState(page, '07-after-e02');
  }

  // Go to admin_office (has e03_old_librarian with character portrait)
  await clickButton(page, /走向管理员办公室/);
  await captureState(page, '08-admin-office');

  // Try to trigger the e03 event
  const eventBtn = page.locator('.btn-event').first();
  if (await eventBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await eventBtn.click();
    await page.waitForTimeout(500);
    await captureState(page, '09-e03-librarian');

    // Try using a book (we should have lin_letter)
    const used = await useBookFromInventory(page, 0, '10-e03');
    if (used) {
      // Continue after result
      if (await tryClickButton(page, /继续|试试其他/)) {
        await captureState(page, '11-after-e03');
      }
    }
  }

  // Navigate to main_corridor
  if (await tryClickButton(page, /前往主走廊|走向主走廊/)) {
    await captureState(page, '12-main-corridor');
  }

  // Handle e05_whispering if auto
  await page.waitForTimeout(500);
  await captureState(page, '13-corridor-state');

  // Try the whispering event if there's an event button
  const corridorEvent = page.locator('.btn-event').first();
  if (await corridorEvent.isVisible({ timeout: 2000 }).catch(() => false)) {
    await corridorEvent.click();
    await page.waitForTimeout(500);
    await captureState(page, '14-e05-whispering');

    const used = await useBookFromInventory(page, 0, '15-e05');
    if (used) {
      if (await tryClickButton(page, /继续|试试其他/)) {
        await captureState(page, '16-after-e05');
      }
    }
  }

  // Go to shelf_a
  if (await tryClickButton(page, /走向书架A区/)) {
    await captureState(page, '17-shelf-a');
  }

  // shelf_a events
  await page.waitForTimeout(500);
  const shelfEvent = page.locator('.btn-event').first();
  if (await shelfEvent.isVisible({ timeout: 2000 }).catch(() => false)) {
    await shelfEvent.click();
    await page.waitForTimeout(500);
    await captureState(page, '18-shelf-a-event');

    if (await tryClickButton(page, /继续/)) {
      await captureState(page, '19-after-shelf-a-event');
    }
  }

  // Try second event on shelf_a if present
  const shelfEvent2 = page.locator('.btn-event').first();
  if (await shelfEvent2.isVisible({ timeout: 1000 }).catch(() => false)) {
    await shelfEvent2.click();
    await page.waitForTimeout(500);
    await captureState(page, '20-shelf-a-event2');

    const used = await useBookFromInventory(page, 0, '21-shelf-a-e2');
    if (used) {
      if (await tryClickButton(page, /继续|试试其他/)) {
        await captureState(page, '22-after-shelf-a-e2');
      }
    }
  }

  // Go to back_corridor via shelf gap
  if (await tryClickButton(page, /穿过书架间的缝隙/)) {
    await captureState(page, '23-back-corridor');
  }

  // back_corridor events
  await page.waitForTimeout(500);
  const backEvent = page.locator('.btn-event').first();
  if (await backEvent.isVisible({ timeout: 2000 }).catch(() => false)) {
    await backEvent.click();
    await page.waitForTimeout(500);
    await captureState(page, '24-back-event');

    const used = await useBookFromInventory(page, 0, '25-back-e');
    if (used) {
      if (await tryClickButton(page, /继续|试试其他/)) {
        await captureState(page, '26-after-back-e');
      }
    }
  }

  // Try second back event
  const backEvent2 = page.locator('.btn-event').first();
  if (await backEvent2.isVisible({ timeout: 1000 }).catch(() => false)) {
    await backEvent2.click();
    await page.waitForTimeout(500);
    await captureState(page, '27-back-event2');

    const used = await useBookFromInventory(page, 0, '28-back-e2');
    if (used) {
      if (await tryClickButton(page, /继续|试试其他/)) {
        await captureState(page, '29-after-back-e2');
      }
    }
  }

  // Go back to main corridor
  if (await tryClickButton(page, /回到主走廊/)) {
    await captureState(page, '30-main-corridor-return');
  }

  // Try reading room
  if (await tryClickButton(page, /走向阅览室/)) {
    await captureState(page, '31-reading-room');
  }

  // reading room events
  await page.waitForTimeout(500);
  const readEvent = page.locator('.btn-event').first();
  if (await readEvent.isVisible({ timeout: 2000 }).catch(() => false)) {
    await readEvent.click();
    await page.waitForTimeout(500);
    await captureState(page, '32-reading-event');

    if (await tryClickButton(page, /继续/)) {
      await captureState(page, '33-after-reading-event');
    }
  }

  // Try second reading room event
  const readEvent2 = page.locator('.btn-event').first();
  if (await readEvent2.isVisible({ timeout: 1000 }).catch(() => false)) {
    await readEvent2.click();
    await page.waitForTimeout(500);
    await captureState(page, '34-reading-event2');

    const used = await useBookFromInventory(page, 0, '35-reading-e2');
    if (used) {
      if (await tryClickButton(page, /继续|试试其他/)) {
        await captureState(page, '36-after-reading-e2');
      }
    }
  }

  // Go to mirror hall via main corridor
  if (await tryClickButton(page, /回到主走廊/)) {
    await captureState(page, '37-back-main');
  }
  if (await tryClickButton(page, /走向镜厅/)) {
    await captureState(page, '38-mirror-hall');
  }

  // mirror hall event
  await page.waitForTimeout(500);
  const mirrorEvent = page.locator('.btn-event').first();
  if (await mirrorEvent.isVisible({ timeout: 2000 }).catch(() => false)) {
    await mirrorEvent.click();
    await page.waitForTimeout(500);
    await captureState(page, '39-mirror-event');

    const used = await useBookFromInventory(page, 0, '40-mirror-e');
    if (used) {
      if (await tryClickButton(page, /继续|试试其他/)) {
        await captureState(page, '41-after-mirror');
      }
    }
  }

  // Try shelf_b via main corridor
  if (await tryClickButton(page, /回到主走廊/)) {
    await captureState(page, '42-back-main2');
  }
  if (await tryClickButton(page, /走向书架B区/)) {
    await captureState(page, '43-shelf-b');
  }

  // shelf_b events (crying child)
  await page.waitForTimeout(500);
  const shelfBEvent = page.locator('.btn-event').first();
  if (await shelfBEvent.isVisible({ timeout: 2000 }).catch(() => false)) {
    await shelfBEvent.click();
    await page.waitForTimeout(500);
    await captureState(page, '44-shelf-b-event');

    if (await tryClickButton(page, /继续/)) {
      await captureState(page, '45-after-shelf-b-event');
    }
  }

  const shelfBEvent2 = page.locator('.btn-event').first();
  if (await shelfBEvent2.isVisible({ timeout: 1000 }).catch(() => false)) {
    await shelfBEvent2.click();
    await page.waitForTimeout(500);
    await captureState(page, '46-shelf-b-event2');

    const used = await useBookFromInventory(page, 0, '47-shelf-b-e2');
    if (used) {
      if (await tryClickButton(page, /继续|试试其他/)) {
        await captureState(page, '48-after-shelf-b-e2');
      }
    }
  }

  // Final state - capture everything
  await captureState(page, '99-final-state');

  console.log('\n=== PLAYTHROUGH COMPLETE ===');
  console.log(`Screenshots saved to ${DIR}/`);
  console.log(`Game log saved to ${DIR}/game-log.txt`);
});
