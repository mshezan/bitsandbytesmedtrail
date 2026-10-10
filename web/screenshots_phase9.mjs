import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
  
  await page.goto("http://localhost:3000/login");
  await page.click('button:has-text("Hospital Staff")');
  await page.waitForTimeout(500);
  await page.click('button:has-text("Sign In to Hospital Portal")');
  
  // 1. Analytics
  await page.goto("http://localhost:3000/hospital/analytics");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "../screenshots/phase9_analytics.png", fullPage: true });

  // 2. Insights
  await page.goto("http://localhost:3000/hospital/insights");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "../screenshots/phase9_population_insights.png", fullPage: true });

  // 3. Access History
  await page.goto("http://localhost:3000/hospital/access");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "../screenshots/phase9_access_audit.png", fullPage: true });

  await browser.close();
  console.log("Done");
})();
