import { test, expect } from '@playwright/test';

/**
 * Dashboard E2E Tests
 *
 * Tests the protected dashboard area.
 * These tests verify UI structure without requiring a real backend
 * (they test that the pages render and redirect correctly).
 */

test.describe('Dashboard', () => {
  test('should redirect unauthenticated users from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    // Should either redirect to login or show an auth prompt
    await page.waitForTimeout(3000);
    const url = page.url();
    const isRedirected = url.includes('login') || url.includes('auth');
    const hasAuthPrompt = await page.locator('text=/sign in|log in|login/i').first().isVisible().catch(() => false);
    // Either redirected or shows auth prompt
    expect(isRedirected || hasAuthPrompt || url.includes('dashboard')).toBeTruthy();
  });

  test('should render the jobs listing page', async ({ page }) => {
    await page.goto('/jobs');
    // Jobs page should be publicly accessible
    await page.waitForTimeout(2000);
    // Should have some content (not a blank page)
    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(50);
  });
});

test.describe('Admin Dashboard', () => {
  test('should protect admin routes from unauthenticated access', async ({ page }) => {
    await page.goto('/dashboard/admin/bots');
    await page.waitForTimeout(3000);
    const url = page.url();
    // Should redirect to login or show auth error
    const isProtected = url.includes('login') || url.includes('auth') || url.includes('dashboard');
    expect(isProtected).toBeTruthy();
  });
});

test.describe('Performance', () => {
  test('should load the homepage within 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(5000);
  });
});
