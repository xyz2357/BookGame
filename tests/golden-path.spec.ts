import { test, expect } from '@playwright/test';

test.describe('Golden Path - Super Match Playthrough', () => {
  test('completes the game with the best ending (truth)', async ({ page }) => {
    await page.goto('/');

    // Main Menu
    await expect(page.getByRole('heading', { name: '底层书库' })).toBeVisible();
    await page.getByRole('button', { name: '开始游戏' }).click();

    // Entrance node
    await expect(page.getByRole('heading', { name: '入口' })).toBeVisible();

    // Click the intro event button
    await page.getByRole('button', { name: /任意翻一本书/ }).click();

    // Event view: select and use starter handbook
    await expect(page.getByText('选择一本书')).toBeVisible();
    await page.locator('.book-card').filter({ hasText: '图书馆员手册' }).click();
    await page.getByRole('button', { name: '使用《图书馆员手册》' }).click();

    // Success: see outcome text about staying calm
    await expect(page.getByText('保持冷静')).toBeVisible();
    await page.getByRole('button', { name: '继续' }).click();

    // Back at entrance node view
    await expect(page.getByRole('heading', { name: '入口' })).toBeVisible();
    await page.getByRole('button', { name: '走下石阶' }).click();

    // Front room: auto-event triggers showing note text
    await expect(page.getByText('如果你看到这个')).toBeVisible();
    await page.getByRole('button', { name: '继续' }).click();

    // Now at front room with connection available
    await expect(page.getByRole('heading', { name: '前厅' })).toBeVisible();
    await page.getByRole('button', { name: '走向主走廊' }).click();

    // Main corridor
    await expect(page.getByRole('heading', { name: '主走廊' })).toBeVisible();
    await page.getByRole('button', { name: '选一本书来应对' }).click();

    // Event view: use metamorphosis (super match)
    await expect(page.getByText('选择一本书')).toBeVisible();
    await page.locator('.book-card').filter({ hasText: '变形记' }).click();
    await page.getByRole('button', { name: '使用《变形记》' }).click();

    // Super match success text
    await expect(page.getByText('想象自己是一只甲虫')).toBeVisible();
    await page.getByRole('button', { name: '继续' }).click();

    // Now at deepest
    await expect(page.getByRole('heading', { name: '最深处' })).toBeVisible();

    // Click the final event
    await page.getByRole('button', { name: '选一本书递给她' }).click();

    // Event view: use Lin's letter
    await expect(page.getByText('选择一本书')).toBeVisible();
    await page.locator('.book-card').filter({ hasText: '林的纸条' }).click();
    await page.getByRole('button', { name: '使用《林的纸条》' }).click();

    // Success text about best farewell
    await expect(page.getByText('最好的告别')).toBeVisible();
    await page.getByRole('button', { name: '继续' }).click();

    // Ending view: truth ending
    await expect(page.getByRole('heading', { name: '结局：真相' })).toBeVisible();
    await expect(page.getByText('没人知道她去了哪里')).toBeVisible();

    // Return to main menu
    await page.getByRole('button', { name: '返回主菜单' }).click();
    await expect(page.getByRole('heading', { name: '底层书库' })).toBeVisible();
  });
});
