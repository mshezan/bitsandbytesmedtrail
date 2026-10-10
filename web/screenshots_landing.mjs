import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
  
  console.log("Capturing landing page...");
  await page.goto("http://localhost:3000/");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "../screenshots/phase3_landing.png", fullPage: true });

  console.log("Capturing API explorer page...");
  await page.goto("http://localhost:3000/api");
  await page.waitForLoadState("networkidle");
  
  // Click the run demo button
  await page.click('button');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "../screenshots/phase3_api.png", fullPage: true });

  await browser.close();
  console.log("Done.");
})();
