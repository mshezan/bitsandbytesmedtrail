import { chromium } from '@playwright/test';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const routes = ['/login', '/home', '/medications', '/labs', '/providers', '/handover', '/share', '/timeline', '/connect'];
  
  const results = [];
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  for (const route of routes) {
    const url = `http://localhost:3000${route}`;
    console.log(`Auditing ${url}`);
    const errors = [];
    
    page.on('requestfailed', request => {
      errors.push(`Failed: ${request.url()} - ${request.failure().errorText}`);
    });
    
    page.on('response', response => {
      if (!response.ok()) {
        errors.push(`Bad Status: ${response.url()} - ${response.status()}`);
      }
    });

    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      const title = await page.title();
      results.push({ route, status: 'Loaded', title, errors });
    } catch(e) {
      results.push({ route, status: 'Failed', errors: [e.message] });
    }
  }
  
  console.log("AUDIT RESULTS:", JSON.stringify(results, null, 2));
  await browser.close();
})();
