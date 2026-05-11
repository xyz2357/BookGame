import { test } from '@playwright/test';

test('screenshot character portrait overlay', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '开始游戏' }).click();

  // entrance → auto e01
  await page.getByText('你深吸一口气').waitFor();
  await page.getByRole('button', { name: '继续' }).click();

  // go to front_room
  await page.getByRole('button', { name: '走下石阶' }).click();

  // front_room → auto e02
  await page.getByText('如果你看到这个').waitFor();
  await page.getByRole('button', { name: '继续' }).click();

  // go to admin_office (has e03 with old_librarian character)
  await page.getByRole('button', { name: '走向管理员办公室' }).click();

  // admin_office should show e03 event button
  await page.screenshot({ path: 'debug-screenshots/01-admin-office.png', fullPage: true });

  // enter e03 event (old_librarian portrait)
  const eventBtn = page.getByRole('button', { name: /办公室/ });
  if (await eventBtn.isVisible()) {
    await eventBtn.click();
  } else {
    // try any event button
    const anyEvent = page.locator('.btn-event').first();
    await anyEvent.click();
  }

  // wait for event view to render
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'debug-screenshots/02-event-with-portrait.png', fullPage: true });

  // also try selecting a book to see result
  await page.getByRole('button', { name: '翻开背包' }).click();
  await page.waitForTimeout(300);

  // pick any book
  const firstBook = page.locator('.book-card').first();
  await firstBook.click();
  await page.waitForTimeout(200);

  // use it
  const useBtn = page.locator('.inventory-use-btn');
  if (await useBtn.isVisible()) {
    await useBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'debug-screenshots/03-result-with-portrait.png', fullPage: true });
  }
});
