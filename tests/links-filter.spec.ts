import { test, expect } from '@playwright/test';

test.describe('🔍 Links Filtering Functionality', () => {
  
  // ============================================================================
  // TEST SETUP
  // ============================================================================
  
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB to ensure clean test state
    await page.goto('http://localhost:5173');
    await page.evaluate(() => {
      indexedDB.deleteDatabase('SmartResearchDB');
    });
  });

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================
  
  const addTestLink = async (page: any, url: string, priority: string, status: string) => {
    await page.click('text=Add Link');
    await page.fill('input[label="URL"]', url);
    await page.selectOption('select[label="Priority"]', priority);
    await page.selectOption('select[label="Status"]', status);
    await page.click('button:text("Save Link")');
    await page.waitForSelector('text=' + url);
  };

  const getLinkRows = (page: any) => page.locator('div[role="row"]');

  // ============================================================================
  // FILTER FUNCTIONALITY TESTS
  // ============================================================================
  
  test('✅ should filter links by status and priority correctly', async ({ page }) => {
    // Arrange - Navigate to links page
    await page.goto('http://localhost:5173/links');

    // Arrange - Add test links with different combinations
    await addTestLink(page, 'https://a.com', 'low', 'active');
    await addTestLink(page, 'https://b.com', 'high', 'archived');
    await addTestLink(page, 'https://c.com', 'high', 'active');

    // Assert - Verify all links are initially visible
    const rows = getLinkRows(page);
    await expect(rows).toHaveCount(3);

    // Act & Assert - Filter by status "Active"
    await page.selectOption('select:has-text("All Status")', 'active');
    await expect(rows).toHaveCount(2);

    // Act & Assert - Filter by priority "High" (should show only high priority active links)
    await page.selectOption('select:has-text("All Priority")', 'high');
    await expect(rows).toHaveCount(1);

    // Act & Assert - Clear status filter (should show all high priority links)
    await page.selectOption('select:has-text("Active")', '');
    await expect(rows).toHaveCount(2);

    // Act & Assert - Clear priority filter (should show all links)
    await page.selectOption('select:has-text("high")', '');
    await expect(rows).toHaveCount(3);
  });
}); 