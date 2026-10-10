import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
  
  await page.goto("http://localhost:3000/login");
  await page.click('button:has-text("Hospital Staff")');
  await page.waitForTimeout(500);
  await page.click('button:has-text("Sign In to Hospital Portal")');
  
  // 1. ER Triage Board
  await page.goto("http://localhost:3000/hospital/er");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "../screenshots/phase8_er_triage.png", fullPage: true });

  // 2. ER Critical View
  // We can just click the mock patient in P2
  await page.click('h3:has-text("Priya Sharma")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "../screenshots/phase8_er_critical_view.png", fullPage: true });

  // 3. Inpatients Board
  await page.goto("http://localhost:3000/hospital/inpatients");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "../screenshots/phase8_inpatients_board.png", fullPage: true });

  // 4. Referral Composer
  await page.goto("http://localhost:3000/hospital/search");
  await page.fill('input[type="text"]', "Priya");
  await page.waitForTimeout(1000);
  await page.click('text=View Chart');
  await page.waitForTimeout(1000);
  
  const currentUrl = page.url();
  await page.goto(`${currentUrl}/consult`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
  
  await page.click('button:has-text("Refer Patient")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "../screenshots/phase8_referral_composer.png", fullPage: true });

  await browser.close();
  console.log("Done");
})();
