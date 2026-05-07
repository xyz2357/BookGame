import { test, expect } from '@playwright/test';

test.describe('Game Over - HP Depletion', () => {
  test('shows game over ending when HP reaches zero', async ({ page }) => {
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

    // Main corridor: try starter_handbook on rusty door (will fail)
    await expect(page.getByRole('heading', { name: '主走廊' })).toBeVisible();
    await page.getByRole('button', { name: '选一本书来应对' }).click();

    // First failure: HP 3 -> 2
    await page.locator('.book-card').filter({ hasText: '图书馆员手册' }).click();
    await page.getByRole('button', { name: '使用《图书馆员手册》' }).click();
    await expect(page.getByText('门依然紧闭')).toBeVisible();
    await expect(page.locator('.hp-bar')).toContainText('❤ ❤ ♡');
    await page.getByRole('button', { name: '换一本书试试' }).click();

    // Second failure: HP 2 -> 1
    await page.locator('.book-card').filter({ hasText: '图书馆员手册' }).click();
    await page.getByRole('button', { name: '使用《图书馆员手册》' }).click();
    await expect(page.getByText('门依然紧闭')).toBeVisible();
    await expect(page.locator('.hp-bar')).toContainText('❤ ♡ ♡');
    await page.getByRole('button', { name: '换一本书试试' }).click();

    // Third failure: HP 1 -> 0 = Game Over
    await page.locator('.book-card').filter({ hasText: '图书馆员手册' }).click();
    await page.getByRole('button', { name: '使用《图书馆员手册》' }).click();

    // Should now see game over ending
    await expect(page.getByRole('heading', { name: '结局：迷失' })).toBeVisible();
    await expect(page.getByText('你的意识越来越模糊')).toBeVisible();
  });
});
