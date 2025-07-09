import { test, expect } from '@playwright/test';

test.describe('Links filtering', () => {
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB via page evaluate
    await page.goto('http://localhost:5173');
    await page.evaluate(() => {
      indexedDB.deleteDatabase('SmartResearchDB');
    });
  });

  test('status and priority filters work', async ({ page }) => {
    await page.goto('http://localhost:5173/links');

    // helper to add a link
    const addLink = async (url: string, priority: string, status: string) => {
      await page.click('text=Add Link');
      await page.fill('input[label="URL"]', url);
      await page.selectOption('select[label="Priority"]', priority);
      await page.selectOption('select[label="Status"]', status);
      await page.click('button:text("Save Link")');
      await page.waitForSelector('text='+url);
    };

    await addLink('https://a.com', 'low', 'active');
    await addLink('https://b.com', 'high', 'archived');
    await addLink('https://c.com', 'high', 'active');

    const rows = () => page.locator('div[role="row"]');

    await expect(rows()).toHaveCount(3);

    // filter status Active
    await page.selectOption('select:has-text("All Status")', 'active');
    await expect(rows()).toHaveCount(2);

    // filter priority High
    await page.selectOption('select:has-text("All Priority")', 'high');
    await expect(rows()).toHaveCount(1);

    // clear status filter only high should remain? Clear by selecting all.
    await page.selectOption('select:has-text("Active")', '');
    await expect(rows()).toHaveCount(2);

    // clear priority
    await page.selectOption('select:has-text("high")', '');
    await expect(rows()).toHaveCount(3);
  });
}); 