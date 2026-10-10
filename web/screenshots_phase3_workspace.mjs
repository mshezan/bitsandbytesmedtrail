import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
  
  await page.goto("http://localhost:3000/login");
  await page.click('button:has-text("Hospital Staff")');
  await page.waitForTimeout(500);
  await page.click('button:has-text("Sign In to Hospital Portal")');
  
  await page.waitForURL("**/hospital/home**");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  
  // Find a patient in the schedule and click "Start Consult"
  // Hover over the first schedule row to reveal the button
  const row = page.locator('tr.group').first();
  await row.hover();
  await page.waitForTimeout(500);
  await row.locator('text=Start Consult').click();
  
  // Wait for the workspace to load
  await page.waitForURL("**/consult**");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000); // Allow fetch API to populate

  await page.screenshot({ path: "../screenshots/phase3_consult_workspace.png", fullPage: true });

  await browser.close();
  console.log("Done");
})();
