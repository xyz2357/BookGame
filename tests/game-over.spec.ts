import { test, expect } from '@playwright/test';

test.describe('Game Over - HP Depletion', () => {
  test('shows game over ending when HP reaches zero at harsh event', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '开始游戏' }).click();

    // Navigate: entrance → front_room → main_corridor → shelf_a → back_corridor
    await expect(page.getByText('你深吸一口气')).toBeVisible();
    await page.getByRole('button', { name: '继续' }).click();
    await page.getByRole('button', { name: '走下石阶' }).click();

    await expect(page.getByText('如果你看到这个')).toBeVisible();
    await page.getByRole('button', { name: '继续' }).click();
    await page.getByRole('button', { name: '走向主走廊' }).click();

    await page.getByRole('button', { name: '走向书架A区' }).click();
    await expect(page.getByText('道林·格雷的画像')).toBeVisible();
    await page.getByRole('button', { name: '继续' }).click();
    await page.getByRole('button', { name: '穿过书架间的缝隙' }).click();

    // At back_corridor: fail at e12_collapse 3 times
    await expect(page.getByRole('heading', { name: '后廊' })).toBeVisible();
    await page.getByRole('button', { name: /应对坍塌/ }).click();

    // First failure: HP 3 → 2
    await page.locator('.book-card').filter({ hasText: '图书馆员手册' }).click();
    await page.getByRole('button', { name: '使用《图书馆员手册》' }).click();
    await expect(page.getByText('蜡烛熄灭了一根')).toBeVisible();
    await expect(page.locator('.candle.lit')).toHaveCount(2);
    await expect(page.locator('.candle.spent')).toHaveCount(1);
    await page.getByRole('button', { name: '换一本书试试' }).click();

    // Second failure: HP 2 → 1
    await page.locator('.book-card').filter({ hasText: '图书馆员手册' }).click();
    await page.getByRole('button', { name: '使用《图书馆员手册》' }).click();
    await expect(page.getByText('蜡烛熄灭了一根')).toBeVisible();
    await expect(page.locator('.candle.lit')).toHaveCount(1);
    await expect(page.locator('.candle.spent')).toHaveCount(2);
    await page.getByRole('button', { name: '换一本书试试' }).click();

    // Third failure: HP 1 → 0 = Game Over
    await page.locator('.book-card').filter({ hasText: '图书馆员手册' }).click();
    await page.getByRole('button', { name: '使用《图书馆员手册》' }).click();

    // Game over ending
    await expect(page.getByRole('heading', { name: '结局：迷失' })).toBeVisible();
    await expect(page.getByText('你的意识越来越模糊')).toBeVisible();
  });
});
