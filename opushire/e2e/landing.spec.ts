import { test, expect } from '@playwright/test';

/**
 * Landing Page E2E Tests
 *
 * Verifies that the public-facing pages load correctly,
 * render key UI elements, and respond to user interaction.
 */

test.describe('Landing Page', () => {
  test('should load the homepage and display the brand', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/OpusHire/i);
    // Page should render without JavaScript errors
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('should have accessible navigation links', async ({ page }) => {
    await page.goto('/');
    // Look for common navigation elements
    const nav = page.locator('nav, header');
    await expect(nav.first()).toBeVisible();
  });

  test('should be responsive at mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    // Page should not have horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // 5px tolerance
  });

  test('should return correct HTTP status for health endpoints', async ({ request }) => {
    // Test the frontend serves a 200
    const response = await request.get('/');
    expect(response.status()).toBe(200);
  });
});

test.describe('404 Handling', () => {
  test('should handle non-existent routes gracefully', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-12345');
    // Next.js should return 404, not crash
    expect(response?.status()).toBe(404);
  });
});
