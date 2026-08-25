import { test, expect } from '@playwright/test';

test.describe('POS Smoke Tests', () => {
  test('app loads and shows POS shell', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.app-root-layout')).toBeVisible();
  });

  test('admin FAB is visible on POS route', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.pos-admin-fab')).toBeVisible();
  });

  test('admin FAB links to /main', async ({ page }) => {
    await page.goto('/');
    const fab = page.locator('.pos-admin-fab');
    await expect(fab).toHaveAttribute('href', '/main');
  });
});

test.describe('Navigation', () => {
  test('can navigate to main page', async ({ page }) => {
    await page.goto('/main');
    await expect(page).toHaveURL(/\/main/);
  });

  test('can navigate to products page', async ({ page }) => {
    await page.goto('/reg/products');
    await expect(page).toHaveURL(/\/reg\/products/);
  });

  test('can navigate to categories page', async ({ page }) => {
    await page.goto('/reg/categories');
    await expect(page).toHaveURL(/\/reg\/categories/);
  });
});
