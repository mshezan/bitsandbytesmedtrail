import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
  
  console.log("Logging in as Hospital Staff...");
  await page.goto("http://localhost:3000/login");
  
  // Switch to hospital tab
  await page.click('button:has-text("Hospital Staff")');
  await page.waitForTimeout(500);

  await page.click('button:has-text("Sign In to Hospital Portal")');
  
  await page.waitForURL("**/hospital/home**");
  console.log("Logged in!");
  
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000); // Wait for data to fetch
  
  await page.screenshot({ path: "../screenshots/phase1_doctor_home.png", fullPage: true });

  console.log("Done.");
  await browser.close();
})();
