import { test, expect } from '@playwright/test';

test.describe('POS Smoke Tests', () => {
  test('app loads and shows POS shell', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.app-root-layout')).toBeVisible();
  });

  test('POS route leaves room for the top nav header', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.app-outlet-wrap')).toBeVisible();
    // The POS shell deliberately hides the top nav, so the two redundant
    // /main entry points (admin FAB, catalog Home button) were removed.
    await expect(page.locator('.pos-admin-fab')).toHaveCount(0);
    await expect(page.locator('.toolbar-home')).toHaveCount(0);
    await expect(page.locator('.category-manage-btn')).toHaveCount(0);
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
