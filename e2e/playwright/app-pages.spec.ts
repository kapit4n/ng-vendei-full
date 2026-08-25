import { test, expect } from '@playwright/test';

test.describe('Catalog and Cart Flow', () => {
  test('catalog page renders without critical errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/reg/products');
    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter(
      (e) => !e.includes('NG0304') && !e.includes('favicon')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('categories page renders without critical errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/reg/categories');
    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter(
      (e) => !e.includes('NG0304') && !e.includes('favicon')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('POS Checkout Page', () => {
  test('checkout page renders', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter(
      (e) => !e.includes('NG0304') && !e.includes('favicon')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
