import { test, expect } from '@playwright/test';

type StoreProfile = { id: number; name: string; businessName?: string; defaultProfile: boolean };

/**
 * Default Business Type configuration (Task #25).
 *
 * The /settings page persists the default business/catalog that the POS opens
 * with (backend `defaultProfile` flag). A temporary switch inside the POS must
 * not overwrite the configured default, and a fresh POS session must load the
 * configured default.
 *
 * The tests interact with the settings UI, then verify persistence through the
 * backend API and the bootstrapping of a fresh POS context (which resolves the
 * default via `VStoreProfileService`).
 */
test.describe('Default Business Type configuration', () => {
  async function fetchProfiles(request: any): Promise<StoreProfile[]> {
    const res = await request.get('/storeProfiles');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    return Array.isArray(body) ? body : body.data ?? [];
  }

  /** The "Default Business Type" card (the page also has a "Product Card Size" card). */
  function defaultCard(page: any) {
    return page
      .locator('mat-card')
      .filter({ has: page.getByText('Default Business Type', { exact: false }).first() })
      .first();
  }

  test('settings page loads and lists business profiles', async ({ page }) => {
    await page.goto('/settings');
    await page.locator('mat-card-title').filter({ hasText: 'Default Business Type' }).waitFor();
    const card = defaultCard(page);
    await expect(card.locator('mat-card-subtitle')).toContainText('loaded automatically when the POS starts.');

    await page.locator('mat-select').click();
    const options = page.locator('mat-option');
    await expect(options.first()).toBeVisible();
    const optionsCount = await options.count();
    expect(optionsCount).toBeGreaterThan(1);

    const valueText = await page.locator('mat-select .mat-mdc-select-value-text').textContent();
    expect(valueText?.trim()).toBeTruthy();
  });

  test('changing the default persists to the backend and drives a fresh POS session', async ({
    browser,
    request,
  }) => {
    const profiles = await fetchProfiles(request);
    const original = profiles.find((p) => p.defaultProfile);
    expect(original).toBeTruthy();
    const target = profiles.find((p) => !p.defaultProfile && p.id !== original!.id);
    expect(target).toBeTruthy();
    // The settings UI renders profiles with their business display name.
    const displayName = (p: StoreProfile) => p.businessName || p.name;
    const targetLabel = displayName(target!);
    const originalLabel = displayName(original!);

    const settingsContext = await browser.newContext();
    const settingsPage = await settingsContext.newPage();
    await settingsPage.goto('/settings');
    await settingsPage.locator('mat-card-title').filter({ hasText: 'Default Business Type' }).waitFor();
    await settingsPage.locator('mat-select').click();
    await settingsPage.getByRole('option', { name: targetLabel, exact: true }).first().click();
    await defaultCard(settingsPage).locator('button').filter({ hasText: 'Save' }).click();
    await expect(settingsPage.locator('.feedback-message--success')).toContainText(targetLabel);

    // The backend must now report exactly one default, and it must be `target`.
    const afterSave = await fetchProfiles(request);
    const defaults = afterSave.filter((p) => p.defaultProfile);
    expect(defaults).toHaveLength(1);
    expect(defaults[0].id).toBe(target!.id);

    // A fresh context (no stored temporary selection) must bootstrap the POS
    // onto the configured default: the catalog loads and the resolved profile
    // id is recorded as the active session profile.
    const posContext = await browser.newContext();
    const posPage = await posContext.newPage();
    await posPage.goto('/');
    await posPage.locator('app-product-card').first().waitFor({ state: 'visible' });
    const activeProfileId = await posPage.evaluate(() =>
      window.localStorage.getItem('activeStoreProfileId')
    );
    expect(Number(activeProfileId)).toBe(target!.id);
    await posContext.close();

    // Restore the original default so the environment stays as found.
    await settingsPage.goto('/settings');
    await expect(settingsPage.locator('mat-card-title').filter({ hasText: 'Default Business Type' })).toBeVisible();
    await settingsPage.locator('mat-select').click();
    await settingsPage.getByRole('option', { name: originalLabel, exact: true }).first().click();
    await defaultCard(settingsPage).locator('button').filter({ hasText: 'Save' }).click();
    await expect(settingsPage.locator('.feedback-message--success')).toContainText(originalLabel);
    const restored = await fetchProfiles(request);
    expect(restored.filter((p) => p.defaultProfile)[0]?.id).toBe(original!.id);

    await settingsContext.close();
  });
});