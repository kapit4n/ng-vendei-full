import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const BASE = 'http://localhost:4200';
const OUT = 'mockups';

// Load product data for mocking
const products = JSON.parse(readFileSync('src/assets/vendei/products.json', 'utf-8'));

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
const page = await context.newPage();

// Mock API endpoints so no backend is needed
await page.route('**/productPresentations', async (route) => {
  await route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify(products),
  });
});

await page.route('**/categories', async (route) => {
  await route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify([
      { id: 1, name: 'Groceries' },
      { id: 2, name: 'Electronics' },
      { id: 3, name: 'Home & Personal Care' },
    ]),
  });
});

await page.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 });

// Wait for product cards to render
await page.waitForSelector('.product-list-item-t', { timeout: 15000 });
await page.waitForTimeout(1000);

// Add several products to the ticket for a richer screenshot
const productButtons = await page.$$('.product-list-item-t');
const toAdd = Math.min(productButtons.length, 5);
for (let i = 0; i < toAdd; i++) {
  await productButtons[i].click();
  await page.waitForTimeout(250);
}

// Wait for UI to settle
await page.waitForTimeout(800);

// Force all prices to be recomputed (in case they use cached values)
await page.evaluate(() => {
  // This triggers the price formatting to ensure prices are displayed
  Array.from(document.querySelectorAll('.product-card-price')).forEach(el => {
    const value = el.textContent || '';
    // Force text node to update
    el.textContent = value.trim();
  });
});

// Wait a bit more for prices to update
await page.waitForTimeout(500);

// Save as the main repo screenshot (used in README)
await page.screenshot({ path: `${OUT}/home.png`, fullPage: false });
console.log('OK  home.png (POS view with products)');

// Also save as the named version
await page.screenshot({ path: `${OUT}/ng-vendei-home-0010.png`, fullPage: false });
console.log('OK  ng-vendei-home-0010.png (POS view with products)');

// Save a comprehensive catalog view with prices
await page.screenshot({ path: `${OUT}/features/product-catalog/main.png`, fullPage: false });
console.log('OK  features/product-catalog/main.png (POS catalog with prices)');

await page.close();
await browser.close();
