import { test, expect } from '@playwright/test';

test.describe('Golden Path - Best Ending', () => {
  test('completes the game and reaches ending_read (读完)', async ({ page }) => {
    await page.goto('/');

    // Main Menu
    await expect(page.getByRole('heading', { name: '底层书库' })).toBeVisible();
    await page.getByRole('button', { name: '开始游戏' }).click();

    // Entrance: auto event e01_dust
    await expect(page.getByText('你深吸一口气')).toBeVisible();
    await page.getByRole('button', { name: '继续' }).click();
    await page.getByRole('button', { name: '走下石阶' }).click();

    // Front room: auto event e02_lin_desk (gain lin_letter)
    await expect(page.getByText('如果你看到这个')).toBeVisible();
    await page.getByRole('button', { name: '继续' }).click();
    await page.getByRole('button', { name: '走向主走廊' }).click();

    // Main corridor: skip e05, go to shelf_a
    await expect(page.getByRole('heading', { name: '主走廊' })).toBeVisible();
    await page.getByRole('button', { name: '走向书架A区' }).click();

    // Shelf A: auto event e07 (gain dorian_gray)
    await expect(page.getByText('道林·格雷的画像')).toBeVisible();
    await page.getByRole('button', { name: '继续' }).click();
    await page.getByRole('button', { name: '穿过书架间的缝隙' }).click();

    // Back corridor: solve e12_collapse with metamorphosis (tag match on 恐惧)
    await expect(page.getByRole('heading', { name: '后廊' })).toBeVisible();
    await page.getByRole('button', { name: /应对坍塌/ }).click();
    await page.locator('.book-card').filter({ hasText: '变形记' }).click();
    await page.getByRole('button', { name: '使用《变形记》' }).click();
    await expect(page.getByText('不够优雅，但管用')).toBeVisible();
    await page.getByRole('button', { name: '继续' }).click();

    // Navigate through collapse to forbidden_entry
    await page.getByRole('button', { name: '穿过坍塌处' }).click();

    // Forbidden entry: solve e14 with lin_letter (tag match on 警告)
    await expect(page.getByRole('heading', { name: '禁区入口' })).toBeVisible();
    await page.getByRole('button', { name: /应对这本异常的书/ }).click();
    await page.locator('.book-card').filter({ hasText: '林的纸条' }).click();
    await page.getByRole('button', { name: '使用《林的纸条》' }).click();
    await expect(page.getByText('用文字做一面盾')).toBeVisible();
    await page.getByRole('button', { name: '继续' }).click();

    // Navigate to deepest
    await page.getByRole('button', { name: '继续深入' }).click();

    // Deepest: solve e15 with the_book_that_reads_you (super match → read ending)
    await expect(page.getByRole('heading', { name: '最深处' })).toBeVisible();
    await page.getByRole('button', { name: /选一本书递给林/ }).click();
    await page.locator('.book-card').filter({ hasText: '无名之书' }).click();
    await page.getByRole('button', { name: '使用《无名之书》' }).click();
    await expect(page.getByText('它在记录')).toBeVisible();
    await page.getByRole('button', { name: '继续' }).click();

    // Ending: read ending (best)
    await expect(page.getByRole('heading', { name: '结局：读完' })).toBeVisible();
    await expect(page.getByText('整座底层书库轻轻消失了')).toBeVisible();

    // Return to menu
    await page.getByRole('button', { name: '返回主菜单' }).click();
    await expect(page.getByRole('heading', { name: '底层书库' })).toBeVisible();
  });
});
