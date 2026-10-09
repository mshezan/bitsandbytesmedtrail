import { chromium } from '@playwright/test';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const consoleLogs = [];
  const failedRequests = [];
  
  page.on('console', msg => consoleLogs.push(msg.text()));
  page.on('requestfailed', request => failedRequests.push(`${request.url()} - ${request.failure()?.errorText}`));
  
  // Login directly by setting localStorage
  await page.goto('http://localhost:3000');
  await page.evaluate(() => {
    // We don't have a token, but we can try to fetch one if we had the API.
    // We'll just use the UI to login to be safe.
  });

  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="tel"]', '5550101');
  await page.click('button:has-text("Continue")');
  await page.waitForTimeout(1000); // Wait for OTP field
  await page.fill('input[placeholder="Enter 6-digit PIN"]', '123456');
  await page.click('button:has-text("Sign in")');
  
  await page.waitForURL('**/home', { timeout: 10000 });
  
  // Let the page load
  await page.waitForTimeout(2000);

  const buttonTexts = [
    "Resolve", 
    "Request", 
    "Generate Handover Packet", 
    "Connect New Source", 
    "View timeline", 
    "View Card"
  ];

  const results = {};

  for (const text of buttonTexts) {
    const loc = page.locator(`button:has-text("${text}")`).first();
    if (await loc.count() > 0) {
      const box = await loc.boundingBox();
      if (box) {
        const x = box.x + box.width / 2;
        const y = box.y + box.height / 2;
        
        const elDetails = await page.evaluate(({x, y}) => {
          const el = document.elementFromPoint(x, y);
          if (!el) return 'null';
          return `${el.tagName.toLowerCase()} class="${el.className}" text="${el.textContent?.substring(0,20)}"`;
        }, {x, y});
        
        // Also check if it has a react event handler by checking the fiber node (trickier in prod, but we can just check DOM)
        results[text] = { x, y, receiver: elDetails };
      }
    } else {
      results[text] = "Not found";
    }
  }

  console.log("--- DIAGNOSTICS ---");
  console.log("Console Logs:", consoleLogs);
  console.log("Failed Requests:", failedRequests);
  console.log("Element From Point Results:", JSON.stringify(results, null, 2));

  await browser.close();
})();
