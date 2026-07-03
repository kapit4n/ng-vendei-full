import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
const page = await context.newPage();

await page.goto('http://localhost:4200/', { waitUntil: 'domcontentloaded', timeout: 15000 });
await page.waitForTimeout(3000);

// Save as the main repo screenshot
await page.screenshot({ path: 'mockups/ng-vendei-home-0010.png', fullPage: false });
console.log('OK  ng-vendei-home-0010.png (POS view)');

await page.close();
await browser.close();
