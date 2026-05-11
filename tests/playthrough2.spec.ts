import { test, Page } from '@playwright/test';
import * as fs from 'fs';

const DIR = 'playthrough-screenshots/run2';

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

async function openInventoryAndUseBook(page: Page, bookName: string | RegExp, step: string): Promise<boolean> {
  const invBtn = page.locator('.btn-action:has-text("翻开背包")');
  if (await invBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await invBtn.click();
  } else {
    await page.locator('.game-header__btn:has-text("背包")').click();
  }
  await page.waitForTimeout(400);

  const bookCard = page.locator(`.book-card:has-text("${typeof bookName === 'string' ? bookName : ''}")`);
  if (typeof bookName !== 'string') {
    const allBooks = page.locator('.book-card');
    const count = await allBooks.count();
    for (let i = 0; i < count; i++) {
      const text = await allBooks.nth(i).innerText();
      if (bookName.test(text)) {
        await allBooks.nth(i).click();
        break;
      }
    }
  } else {
    if (await bookCard.first().isVisible({ timeout: 1000 }).catch(() => false)) {
      await bookCard.first().click();
    } else {
      // fallback: click first book
      await page.locator('.book-card').first().click();
    }
  }
  await page.waitForTimeout(200);
  await captureState(page, `${step}-selected`);

  const useBtn = page.locator('button:has-text("使用")').first();
  if (await useBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await useBtn.click();
    await page.waitForTimeout(500);
    await captureState(page, `${step}-result`);
    return true;
  }
  return false;
}

async function handleEventWithBook(page: Page, bookName: string | RegExp, step: string) {
  const used = await openInventoryAndUseBook(page, bookName, step);
  if (used) {
    // check if success or fail
    const continueBtn = page.getByRole('button', { name: '继续' });
    const retryBtn = page.getByRole('button', { name: /试试其他/ });
    if (await continueBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await continueBtn.click();
      await page.waitForTimeout(400);
      return 'success';
    } else if (await retryBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await retryBtn.click();
      await page.waitForTimeout(400);
      return 'fail';
    }
  }
  return 'none';
}

async function tryEvent(page: Page, step: string): Promise<boolean> {
  const eventBtn = page.locator('.btn-event').first();
  if (await eventBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await eventBtn.click();
    await page.waitForTimeout(500);
    await captureState(page, step);
    return true;
  }
  return false;
}

test('deep playthrough - doubt path', async ({ page }) => {
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(`${DIR}/game-log.txt`, `=== PLAYTHROUGH 2 (DOUBT PATH) ${new Date().toISOString()} ===\n`, 'utf8');

  await page.goto('/');
  await page.waitForTimeout(500);

  // Start
  await clickButton(page, /开始游戏/);
  await captureState(page, '01-entrance');

  // e01 auto event
  await page.waitForTimeout(1000);
  await tryClickButton(page, /继续/);
  await captureState(page, '02-after-e01');

  // Go to front_room
  await clickButton(page, /走下石阶/);
  await page.waitForTimeout(1000);
  await captureState(page, '03-front-room');

  // e02 auto - get lin's letter
  await tryClickButton(page, /继续/);
  await captureState(page, '04-after-e02');

  // Go to admin_office
  await clickButton(page, /走向管理员办公室/);
  await captureState(page, '05-admin-office');

  // e03 old librarian - use lin_letter to trigger DOUBT path
  if (await tryEvent(page, '06-e03-event')) {
    await handleEventWithBook(page, /林的纸条/, '07-e03');
    await captureState(page, '08-after-e03');
  }

  // Now we should still be in admin_office (doubt path doesn't redirect to epilogue)
  // Go to main_corridor
  if (await tryClickButton(page, /前往主走廊/)) {
    await captureState(page, '09-main-corridor');
  } else if (await tryClickButton(page, /走向主走廊/)) {
    await captureState(page, '09-main-corridor');
  }

  // e05 whispering event
  if (await tryEvent(page, '10-e05-whispering')) {
    await handleEventWithBook(page, /林的纸条/, '11-e05');
    await captureState(page, '12-after-e05');
  }

  // Go to shelf_a
  if (await tryClickButton(page, /走向书架A区/)) {
    await captureState(page, '13-shelf-a');
  }

  // shelf_a has e07_find_book_a (auto) and e06_misplaced
  await page.waitForTimeout(500);
  if (await tryEvent(page, '14-shelf-a-event1')) {
    // auto event - just continue
    if (await tryClickButton(page, /继续/)) {
      await captureState(page, '15-after-shelf-a-e1');
    } else {
      // it's a challenge event
      await handleEventWithBook(page, /林的纸条/, '15-shelf-a-e1');
      await captureState(page, '16-after-shelf-a-e1');
    }
  }

  // second event
  if (await tryEvent(page, '17-shelf-a-event2')) {
    if (await tryClickButton(page, /继续/)) {
      await captureState(page, '18-after-shelf-a-e2');
    } else {
      await handleEventWithBook(page, /画皮/, '18-shelf-a-e2');
      await captureState(page, '19-after-shelf-a-e2');
    }
  }

  // Go through shelf gap to back_corridor
  if (await tryClickButton(page, /穿过书架间的缝隙/)) {
    await captureState(page, '20-back-corridor');
  }

  // back_corridor has e12_collapse and e13_darkness
  if (await tryEvent(page, '21-back-event1')) {
    if (await tryClickButton(page, /继续/)) {
      await captureState(page, '22-after-back-e1');
    } else {
      await handleEventWithBook(page, /变形记/, '22-back-e1');
      await captureState(page, '23-after-back-e1');
    }
  }

  if (await tryEvent(page, '24-back-event2')) {
    if (await tryClickButton(page, /继续/)) {
      await captureState(page, '25-after-back-e2');
    } else {
      await handleEventWithBook(page, /画皮/, '25-back-e2');
      await captureState(page, '26-after-back-e2');
    }
  }

  // Try to go to forbidden_entry (needs cleared_collapse flag)
  if (await tryClickButton(page, /穿过坍塌处/)) {
    await captureState(page, '27-forbidden-entry');

    if (await tryEvent(page, '28-forbidden-event')) {
      await handleEventWithBook(page, /林的纸条/, '29-forbidden-e');
      await captureState(page, '30-after-forbidden');
    }

    if (await tryClickButton(page, /继续深入/)) {
      await captureState(page, '31-deepest');

      if (await tryEvent(page, '32-final-event')) {
        await handleEventWithBook(page, /林的纸条/, '33-final');
        await captureState(page, '34-after-final');
      }
    }
  }

  // Go back and explore other areas
  if (await tryClickButton(page, /回到主走廊/)) {
    await captureState(page, '35-back-to-corridor');
  }

  // reading room
  if (await tryClickButton(page, /走向阅览室/)) {
    await captureState(page, '36-reading-room');

    // reading room events
    if (await tryEvent(page, '37-reading-e1')) {
      if (await tryClickButton(page, /继续/)) {
        await captureState(page, '38-after-reading-e1');
      } else {
        await handleEventWithBook(page, /画皮/, '38-reading-e1');
        await captureState(page, '39-after-reading-e1');
      }
    }

    if (await tryEvent(page, '40-reading-e2')) {
      if (await tryClickButton(page, /继续/)) {
        await captureState(page, '41-after-reading-e2');
      } else {
        await handleEventWithBook(page, /变形记/, '41-reading-e2');
        await captureState(page, '42-after-reading-e2');
      }
    }

    if (await tryEvent(page, '43-reading-e3')) {
      if (await tryClickButton(page, /继续/)) {
        await captureState(page, '44-after-reading-e3');
      } else {
        await handleEventWithBook(page, /林的纸条/, '44-reading-e3');
        await captureState(page, '45-after-reading-e3');
      }
    }
  }

  // mirror hall
  if (await tryClickButton(page, /回到主走廊/)) {
    await captureState(page, '46-back-corridor2');
  }
  if (await tryClickButton(page, /走向镜厅/)) {
    await captureState(page, '47-mirror-hall');

    if (await tryEvent(page, '48-mirror-event')) {
      await handleEventWithBook(page, /画皮/, '49-mirror-e');
      await captureState(page, '50-after-mirror');
    }

    // try mirror world
    if (await tryClickButton(page, /走进镜中/)) {
      await captureState(page, '51-mirror-world');

      if (await tryEvent(page, '52-mirror-lin')) {
        await handleEventWithBook(page, /林的纸条/, '53-mirror-lin');
        await captureState(page, '54-after-mirror-lin');
      }
    }
  }

  // shelf_b
  if (await tryClickButton(page, /回到主走廊/)) {
    await captureState(page, '55-back3');
  } else if (await tryClickButton(page, /从镜中走出/)) {
    await captureState(page, '55-from-mirror');
  }
  if (await tryClickButton(page, /走向书架B区/)) {
    await captureState(page, '56-shelf-b');

    if (await tryEvent(page, '57-shelf-b-e1')) {
      if (await tryClickButton(page, /继续/)) {
        await captureState(page, '58-after-shelf-b-e1');
      } else {
        await handleEventWithBook(page, /变形记/, '58-shelf-b-e1');
        await captureState(page, '59-after-shelf-b-e1');
      }
    }

    if (await tryEvent(page, '60-shelf-b-e2')) {
      if (await tryClickButton(page, /继续/)) {
        await captureState(page, '61-after-shelf-b-e2');
      } else {
        await handleEventWithBook(page, /画皮/, '61-shelf-b-e2');
        await captureState(page, '62-after-shelf-b-e2');
      }
    }
  }

  // archive room via admin office
  if (await tryClickButton(page, /回到主走廊/)) {
    await captureState(page, '63-back4');
  }

  // Final state
  await captureState(page, '99-final');

  console.log('\n=== PLAYTHROUGH 2 COMPLETE ===');
  console.log(`Screenshots saved to ${DIR}/`);
});
