import { test, expect } from '@playwright/test';

// Example: Integration test for the extension popup (replace with your actual extension URL)
test.describe('Extension Popup', () => {
  test('should render popup and show provider dropdown', async ({ page }) => {
    // This assumes you have a dev server running and popup.html is accessible
    await page.goto('http://localhost:5173/extension/popup.html');
    await expect(page.locator('select')).toBeVisible();
    await expect(page.locator('text=Open Sidepanel')).toBeVisible();
  });
});
