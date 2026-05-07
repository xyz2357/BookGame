import { test, expect } from '@playwright/test';

test.describe('Failure and Retry', () => {
  test('shows HP loss on harsh failure and allows retry with different book', async ({ page }) => {
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

    // At back_corridor: verify harsh indicator on collapse event
    await expect(page.getByRole('heading', { name: '后廊' })).toBeVisible();
    await expect(page.locator('.btn-event--harsh')).toBeVisible();

    // Try e12_collapse with handbook (no matching tags → harsh failure)
    await page.getByRole('button', { name: /应对坍塌/ }).click();
    await page.locator('.book-card').filter({ hasText: '图书馆员手册' }).click();
    await page.getByRole('button', { name: '使用《图书馆员手册》' }).click();

    // Verify failure: HP loss message, 2 lit + 1 spent candles
    await expect(page.getByText('蜡烛熄灭了一根')).toBeVisible();
    await expect(page.getByText('纹丝不动')).toBeVisible();
    await expect(page.locator('.candle.lit')).toHaveCount(2);
    await expect(page.locator('.candle.spent')).toHaveCount(1);
    await expect(page.getByRole('button', { name: '换一本书试试' })).toBeVisible();

    // Retry with metamorphosis (tag match on 恐惧/身体)
    await page.getByRole('button', { name: '换一本书试试' }).click();
    await page.locator('.book-card').filter({ hasText: '变形记' }).click();
    await page.getByRole('button', { name: '使用《变形记》' }).click();

    // Success this time
    await expect(page.getByText('不够优雅，但管用')).toBeVisible();
    await page.getByRole('button', { name: '继续' }).click();

    // Back at node view, collapse route now open
    await expect(page.getByRole('heading', { name: '后廊' })).toBeVisible();
    await expect(page.getByRole('button', { name: '穿过坍塌处' })).toBeEnabled();
  });
});
