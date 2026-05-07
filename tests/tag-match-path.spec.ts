import { test, expect } from '@playwright/test';

test.describe('Tag Match Path - Peace Ending', () => {
  test('trusts the librarian and reaches ending_peace (安宁)', async ({ page }) => {
    await page.goto('/');

    // Start game
    await page.getByRole('button', { name: '开始游戏' }).click();

    // Entrance: auto e01
    await expect(page.getByText('你深吸一口气')).toBeVisible();
    await page.getByRole('button', { name: '继续' }).click();
    await page.getByRole('button', { name: '走下石阶' }).click();

    // Front room: auto e02 (gain lin_letter)
    await expect(page.getByText('如果你看到这个')).toBeVisible();
    await page.getByRole('button', { name: '继续' }).click();

    // Go to admin office instead of corridor
    await page.getByRole('button', { name: '走向管理员办公室' }).click();

    // Admin office: e03 with handbook → trust path → next_node epilogue → peace ending
    await expect(page.getByRole('heading', { name: '管理员办公室' })).toBeVisible();
    await page.getByRole('button', { name: /翻开一本书/ }).click();

    await page.locator('.book-card').filter({ hasText: '图书馆员手册' }).click();
    await page.getByRole('button', { name: '使用《图书馆员手册》' }).click();

    // Trust outcome: librarian approves, sends to epilogue
    await expect(page.getByText('好孩子')).toBeVisible();
    await page.getByRole('button', { name: '继续' }).click();

    // Ending: peace ending
    await expect(page.getByRole('heading', { name: '结局：安宁' })).toBeVisible();
    await expect(page.getByText('很远的地方翻书')).toBeVisible();
  });
});
