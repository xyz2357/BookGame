import { test, expect } from '@playwright/test';

test.describe('Tag Match Path - Alternate Playthrough', () => {
  test('completes the game using tag matches and reaches silence ending', async ({ page }) => {
    await page.goto('/');

    // Start game
    await page.getByRole('button', { name: '开始游戏' }).click();

    // Entrance: handle intro event (use any book - handbook has matching tags)
    await expect(page.getByRole('heading', { name: '入口' })).toBeVisible();
    await page.getByRole('button', { name: /任意翻一本书/ }).click();
    await page.locator('.book-card').filter({ hasText: '图书馆员手册' }).click();
    await page.getByRole('button', { name: '使用《图书馆员手册》' }).click();
    await expect(page.getByText('保持冷静')).toBeVisible();
    await page.getByRole('button', { name: '继续' }).click();

    // Move to front room
    await page.getByRole('button', { name: '走下石阶' }).click();

    // Front room: auto-event with note
    await expect(page.getByText('如果你看到这个')).toBeVisible();
    await page.getByRole('button', { name: '继续' }).click();

    // Move to main corridor
    await page.getByRole('button', { name: '走向主走廊' }).click();

    // Main corridor: use painted_skin on rusty door (tag match via "揭露"/"鬼怪")
    await expect(page.getByRole('heading', { name: '主走廊' })).toBeVisible();
    await page.getByRole('button', { name: '选一本书来应对' }).click();

    await expect(page.getByText('选择一本书')).toBeVisible();
    await page.locator('.book-card').filter({ hasText: '画皮' }).click();
    await page.getByRole('button', { name: '使用《画皮》' }).click();

    // Tag match success text
    await expect(page.getByText('贴在门上')).toBeVisible();
    await page.getByRole('button', { name: '继续' }).click();

    // Now at deepest
    await expect(page.getByRole('heading', { name: '最深处' })).toBeVisible();

    // Final event: use starter_handbook (tag match via "规则"/"基础")
    await page.getByRole('button', { name: '选一本书递给她' }).click();

    await expect(page.getByText('选择一本书')).toBeVisible();
    await page.locator('.book-card').filter({ hasText: '图书馆员手册' }).click();
    await page.getByRole('button', { name: '使用《图书馆员手册》' }).click();

    // Tag match outcome: Lin reads the handbook and walks away
    await expect(page.getByText('保持冷静')).toBeVisible();
    await page.getByRole('button', { name: '继续' }).click();

    // Ending view: silence ending
    await expect(page.getByRole('heading', { name: '结局：沉默' })).toBeVisible();
  });
});
