import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
  
  console.log("Logging in as Hospital Staff...");
  await page.goto("http://localhost:3000/login");
  
  // Switch to hospital tab
  await page.click('button:has-text("Hospital Staff")');
  await page.waitForTimeout(500);

  // The fields are pre-filled with demo creds: HOSP-KAV-001, ramesh.iyer@kaveri.local, etc.
  await page.click('button:has-text("Sign In to Hospital Portal")');
  
  await page.waitForURL("**/hospital/dashboard**");
  console.log("Logged in!");
  
  // Go to search
  await page.goto("http://localhost:3000/hospital/search");
  await page.waitForLoadState("networkidle");
  
  await page.fill('input[type="text"]', "Priya");
  await page.waitForTimeout(1000); // Wait for debounce and fetch
  
  await page.screenshot({ path: "../screenshots/phase5_search.png", fullPage: true });

  console.log("Done.");
  await browser.close();
})();
