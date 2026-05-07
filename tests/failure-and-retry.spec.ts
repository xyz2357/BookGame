import { test, expect } from '@playwright/test';

test.describe('Failure and Retry', () => {
  test('shows HP loss on failure and allows retry with different book', async ({ page }) => {
    await page.goto('/');

    // Start game
    await page.getByRole('button', { name: '开始游戏' }).click();

    // Entrance: handle intro event
    await expect(page.getByRole('heading', { name: '入口' })).toBeVisible();
    await page.getByRole('button', { name: /任意翻一本书/ }).click();
    await page.locator('.book-card').filter({ hasText: '图书馆员手册' }).click();
    await page.getByRole('button', { name: '使用《图书馆员手册》' }).click();
    await page.getByRole('button', { name: '继续' }).click();

    // Move to front room
    await page.getByRole('button', { name: '走下石阶' }).click();

    // Front room: auto-event
    await expect(page.getByText('如果你看到这个')).toBeVisible();
    await page.getByRole('button', { name: '继续' }).click();

    // Move to main corridor
    await page.getByRole('button', { name: '走向主走廊' }).click();

    // Main corridor: try starter_handbook on rusty door (no match - will fail)
    await expect(page.getByRole('heading', { name: '主走廊' })).toBeVisible();
    await page.getByRole('button', { name: '选一本书来应对' }).click();

    await expect(page.getByText('选择一本书')).toBeVisible();
    await page.locator('.book-card').filter({ hasText: '图书馆员手册' }).click();
    await page.getByRole('button', { name: '使用《图书馆员手册》' }).click();

    // Failure: verify failure text, HP loss indicator, and retry button
    await expect(page.getByText('门依然紧闭')).toBeVisible();
    await expect(page.locator('.hp-loss')).toBeVisible();
    await expect(page.getByRole('button', { name: '换一本书试试' })).toBeVisible();

    // Verify HP display shows 2 full hearts (lost 1 from 3)
    const hpBar = page.locator('.hp-bar');
    await expect(hpBar).toContainText('❤ ❤ ♡');

    // Click retry
    await page.getByRole('button', { name: '换一本书试试' }).click();

    // Back to book selection: use painted_skin this time (tag match)
    await expect(page.getByText('选择一本书')).toBeVisible();
    await page.locator('.book-card').filter({ hasText: '画皮' }).click();
    await page.getByRole('button', { name: '使用《画皮》' }).click();

    // Success this time
    await expect(page.getByText('贴在门上')).toBeVisible();
    await page.getByRole('button', { name: '继续' }).click();

    // Should be at deepest now
    await expect(page.getByRole('heading', { name: '最深处' })).toBeVisible();
  });
});
