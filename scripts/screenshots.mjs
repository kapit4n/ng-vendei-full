import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:4200';
const OUT = 'mockups/all';
mkdirSync(OUT, { recursive: true });

const pages = [
  { route: '/',                       name: 'vendei-full-shopping-cart' },
  { route: '/main',                   name: 'vendei-full-pages-preview' },
  { route: '/reg/products',           name: 'vendei-full-products-list' },
  { route: '/reg/products/new',       name: 'vendei-full-product-edit' },
  { route: '/customers',              name: 'vendei-full-customers' },
  { route: '/reg/categories',         name: 'vendei-full-categories' },
  { route: '/reg/unit-of-measures',   name: 'vendei-full-unit-of-measures' },
  { route: '/rep/products',           name: 'vendei-full-report-products' },
  { route: '/rep/sells',              name: 'vendei-full-report-sells' },
  { route: '/rep/daily-sales',        name: 'vendei-full-daily-sales' },
  { route: '/inv/products',           name: 'vendei-full-inventory-products' },
  { route: '/inv/products/1',         name: 'vendei-full-inventory-product-detail' },
  { route: '/tools/backend-api',      name: 'vendei-full-backend-api' },
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });

for (const { route, name } of pages) {
  const page = await context.newPage();
  try {
    await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
    console.log(`OK  ${name}`);
  } catch (e) {
    console.log(`ERR ${name}: ${e.message}`);
  }
  await page.close();
}

await browser.close();
console.log('\nDone.');
