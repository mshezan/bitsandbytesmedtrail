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
  
  await page.goto("http://localhost:3000/hospital/search");
  await page.fill('input[type="text"]', "Priya");
  await page.waitForTimeout(1000);
  
  // Click first result (it routes to /hospital/patient/[id])
  await page.click('text=View Chart');
  await page.waitForTimeout(1000);

  // Now we are at /hospital/patient/[id]
  const currentUrl = page.url();
  console.log(`Current URL: ${currentUrl}`);
  
  // Navigate to consult
  await page.goto(`${currentUrl}/consult`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  await page.screenshot({ path: "../screenshots/phase3_consult_workspace.png", fullPage: true });

  await browser.close();
  console.log("Done");
})();
