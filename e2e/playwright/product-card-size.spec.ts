import { test, expect, type Page } from '@playwright/test';

/**
 * POS product card size (Small | Medium | Large).
 *
 * Covers: default medium, per-size grid densities (visual), the toolbar quick
 * control, preservation of search/ticket/category on change, and persistence
 * across a full page reload (the value lives in the store profile config).
 */
test.describe('POS product card size', () => {
  /**
   * The card size is persisted per store profile on the server, so it survives
   * between runs — which is what makes the app work, and also what made this
   * suite order-dependent: a run that left 'Small' set made the next run's
   * "defaults to medium" assertion fail.
   *
   * Each test therefore states its own starting density instead of assuming
   * one. The reset goes through the same PUT the settings screen issues.
   */
  const setPersistedCardSize = async (page: Page, size: 'small' | 'medium' | 'large') => {
    const activeId = await page.evaluate(() => window.localStorage.getItem('activeStoreProfileId'));
    const profiles = await (await page.request.get('/storeProfiles')).json();
    const active = profiles.find((p: any) => String(p.id) === String(activeId)) ?? profiles[0];
    const response = await page.request.put(`/storeProfiles/${active.id}`, {
      data: {
        name: active.name,
        slug: active.slug,
        posConfig: { ...(active.posConfig ?? {}), catalogCardSize: size },
      },
    });
    expect(response.ok(), `could not reset card size: ${response.status()}`).toBe(true);
  };

  test('defaults to medium and switches sizes without reloading', async ({ page }) => {
    await page.goto('/');
    await page.locator('app-product-card').first().waitFor({ state: 'visible' });
    await setPersistedCardSize(page, 'medium');
    await page.reload();
    await page.locator('app-product-card').first().waitFor({ state: 'visible' });

    const density = page.locator('.display-density');
    await expect(density).toBeVisible();
    await expect(page.locator('.density-btn[aria-pressed="true"]')).toHaveText('Medium');
    await expect(page.locator('.product-cards-grid--medium')).toBeVisible();

    await page.getByRole('button', { name: 'Product card size: small' }).click();
    await expect(page.locator('.product-cards-grid--small')).toBeVisible();
    await expect(page.locator('.density-btn[aria-pressed="true"]')).toHaveText('Small');

    await page.getByRole('button', { name: 'Product card size: large' }).click();
    await expect(page.locator('.product-cards-grid--large')).toBeVisible();
    await expect(page.locator('.density-btn[aria-pressed="true"]')).toHaveText('Large');

    await page.getByRole('button', { name: 'Product card size: medium' }).click();
    await expect(page.locator('.product-cards-grid--medium')).toBeVisible();
  });

  test('changing size keeps search and ticket content', async ({ page }) => {
    await page.goto('/');
    await page.locator('app-product-card').first().waitFor({ state: 'visible' });

    // Search for the first visible product (token derived from its name) so the
    // assertion works regardless of which seeded business is active.
    const firstLabel = await page.locator('app-product-card').first().getAttribute('aria-label');
    const token = (firstLabel || 'Add Coca').replace(/^Add /, '').split(':')[0].split(' ')[0].slice(0, 4);
    await page.locator('input[type="search"]').fill(token);
    await expect(page.locator('app-product-card').first()).toBeVisible();
    const cardsWhileSearching = await page.locator('app-product-card').count();
    expect(cardsWhileSearching).toBeGreaterThan(0);

    // Add the first matching product to the ticket.
    await page.locator('app-product-card').first().click();
    await expect(page.locator('app-pos-ticket-lines .line-item')).toHaveCount(1);

    await page.getByRole('button', { name: 'Product card size: large' }).click();

    // Search text and ticket content survive the density change (no reload/reset).
    await expect(page.locator('input[type="search"]')).toHaveValue(token);
    await expect(page.locator('app-pos-ticket-lines .line-item')).toHaveCount(1);
    const cardsAfter = await page.locator('app-product-card').count();
    expect(cardsAfter).toBe(cardsWhileSearching);

    await page.getByRole('button', { name: 'Product card size: medium' }).click();
  });

  test('renders distinct grid densities for small, medium and large', async ({ page }) => {
    await page.goto('/');
    await page.locator('app-product-card').first().waitFor({ state: 'visible' });
    const grid = page.locator('.product-cards-grid');

    await page.getByRole('button', { name: 'Product card size: small' }).click();
    await expect(grid).toHaveClass(/product-cards-grid--small/);
    await expect(grid).toHaveScreenshot('pos-grid-small.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });

    await page.getByRole('button', { name: 'Product card size: medium' }).click();
    await expect(grid).toHaveClass(/product-cards-grid--medium/);
    await expect(grid).toHaveScreenshot('pos-grid-medium.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });

    await page.getByRole('button', { name: 'Product card size: large' }).click();
    await expect(grid).toHaveClass(/product-cards-grid--large/);
    await expect(grid).toHaveScreenshot('pos-grid-large.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });

    await page.getByRole('button', { name: 'Product card size: medium' }).click();
  });

  test('card size persists across a full reload', async ({ page }) => {
    await page.goto('/');
    await page.locator('app-product-card').first().waitFor({ state: 'visible' });

    await page.getByRole('button', { name: 'Product card size: large' }).click();
    await expect(page.locator('.product-cards-grid--large')).toBeVisible();

    await page.reload();
    await page.locator('app-product-card').first().waitFor({ state: 'visible' });

    await expect(page.locator('.product-cards-grid--large')).toBeVisible();
    await expect(page.locator('.density-btn[aria-pressed="true"]')).toHaveText('Large');

    // Leave the environment clean at the default size.
    await page.getByRole('button', { name: 'Product card size: medium' }).click();
    await expect(page.locator('.product-cards-grid--medium')).toBeVisible();
  });
});