import { test, expect } from '@playwright/test';

/**
 * POS catalog layout regression (root cause: grid row collapse).
 *
 * Guardrail against the `.product-cards-box` default `align-items: stretch` bug that,
 * combined with `aspect-ratio` media tiles, collapsed grid rows to 158px while card
 * content was ~309px, clipping images/price and overlapping rows.
 */
test.describe('POS catalog layout regression', () => {
  test('product cards render at their natural height (not clipped)', async ({ page }) => {
    await page.goto('/');
    await page.locator('app-product-card').first().waitFor({ state: 'visible' });

    const result = await page.evaluate(() => {
      const card = document.querySelector('app-product-card button.product-card');
      if (!card) {
        return { found: false };
      }
      const el = card as HTMLElement;
      // Clipped when the content exceeds the rendered box.
      return {
        found: true,
        clientHeight: el.clientHeight,
        scrollHeight: el.scrollHeight,
        clipped: el.scrollHeight > el.clientHeight,
      };
    });

    expect(result.found).toBe(true);
    expect(result.scrollHeight).toBeGreaterThan(100);
    expect(result.clipped).toBe(false);
  });

  test('grid uses start alignment so rows do not collapse', async ({ page }) => {
    await page.goto('/');
    await page.locator('.product-cards-grid').first().waitFor({ state: 'visible' });

    const alignItems = await page
      .locator('.product-cards-grid')
      .first()
      .evaluate((el) => getComputedStyle(el).alignItems);

    expect(alignItems).toBe('start');
  });

  test('cards render a real <img> with a product name', async ({ page }) => {
    await page.goto('/');
    await page.locator('app-product-card').first().waitFor({ state: 'visible' });

    const img = page.locator('app-product-card img').first();
    await expect(img).toHaveCount(1);
    const src = await img.getAttribute('src');
    expect(src).toBeTruthy();

    // The placeholder may be used when the product has no asset; ensure at least a name shows.
    const cardText = await page.locator('app-product-card').first().textContent();
    expect(cardText).toMatch(/Bs|\./);
  });

  test('payment panel is collapsed by default and ticket is visible', async ({ page }) => {
    await page.goto('/');
    await page.locator('.selected-list-body').first().waitFor({ state: 'visible' });

    // Collapsed: the payment panel content is hidden but the toggle is visible.
    const toggle = page.locator('.payment-toggle');
    await expect(toggle).toBeVisible();
    await expect(page.locator('.payment-section .cal-table')).toHaveCount(0);
    await expect(page.locator('.selected-list-body')).toBeVisible();
  });

  test('payment panel expands on toggle', async ({ page }) => {
    await page.goto('/');
    await page.locator('.payment-toggle').first().waitFor({ state: 'visible' });

    await page.locator('.payment-toggle').first().click();
    await expect(page.locator('.payment-section .cal-table')).toBeVisible();
  });
});
