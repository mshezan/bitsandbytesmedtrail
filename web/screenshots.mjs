import { chromium } from '@playwright/test';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const routes = ['/login', '/home', '/medications', '/labs', '/providers', '/handover', '/share', '/timeline', '/connect'];
  
  if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');
  
  for (const route of routes) {
    await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle' });
    const name = route === '/' ? 'index' : route.replace(/\//g, '_');
    await page.screenshot({ path: `screenshots/before${name}.png`, fullPage: true });
  }
  
  await browser.close();
  console.log("Before screenshots taken.");
})();
