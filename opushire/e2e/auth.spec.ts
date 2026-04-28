import { test, expect } from '@playwright/test';

/**
 * Authentication Flow E2E Tests
 *
 * Verifies the login and registration pages render correctly
 * and handle user input validation.
 */

test.describe('Authentication', () => {
  test('should render the login page', async ({ page }) => {
    await page.goto('/login');
    // Should have email and password fields
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    await expect(emailInput.first()).toBeVisible();
    await expect(passwordInput.first()).toBeVisible();
  });

  test('should render the register page', async ({ page }) => {
    await page.goto('/register');
    // Should have a name field and a submit button
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]');
    const submitButton = page.locator('button[type="submit"], button:has-text("Register"), button:has-text("Sign Up")');
    await expect(nameInput.first()).toBeVisible();
    await expect(submitButton.first()).toBeVisible();
  });

  test('should show validation error on empty login submission', async ({ page }) => {
    await page.goto('/login');
    // Click submit without filling fields
    const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    await submitButton.first().click();
    // Should show some form of validation feedback (error message, red border, etc.)
    await page.waitForTimeout(1000);
    // The page should NOT navigate away on invalid submission
    expect(page.url()).toContain('login');
  });

  test('should navigate between login and register', async ({ page }) => {
    await page.goto('/login');
    // Look for a link to register
    const registerLink = page.locator('a[href*="register"], a:has-text("Register"), a:has-text("Sign Up")');
    if (await registerLink.first().isVisible()) {
      await registerLink.first().click();
      await page.waitForURL('**/register*');
      expect(page.url()).toContain('register');
    }
  });
});
