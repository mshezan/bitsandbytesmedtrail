import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
  
  console.log("Logging in...");
  await page.goto("http://localhost:3000/login");
  await page.click('button:has-text("Hospital Staff")');
  await page.waitForTimeout(500);
  await page.click('button:has-text("Sign In to Hospital Portal")');
  
  await page.waitForURL("**/hospital/home**");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  
  console.log("Clicking Start Consult button...");
  // Try clicking the button directly by ignoring hover (playwright can force click)
  const button = page.locator('button:has-text("Start Consult")').first();
  await button.click({ force: true });
  
  console.log("Waiting for consult workspace...");
  await page.waitForURL("**/consult**");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000); // Allow fetch API to populate completely

  await page.screenshot({ path: "../screenshots/phase3_consult_workspace.png", fullPage: true });

  await browser.close();
  console.log("Done");
})();
