import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
  
  await page.goto("http://localhost:3000/login");
  await page.click('button:has-text("Hospital Staff")');
  await page.waitForTimeout(500);
  await page.click('button:has-text("Sign In to Hospital Portal")');
  await page.waitForURL("**/hospital/dashboard**");
  
  await page.goto("http://localhost:3000/hospital/search");
  await page.fill('input[type="text"]', "Priya");
  await page.waitForTimeout(1000);
  
  // Click first result
  await page.click('text=View Record');
  await page.waitForTimeout(1000);

  // Purpose of Access modal should appear
  await page.screenshot({ path: "../screenshots/phase5_access_modal.png", fullPage: true });

  // Select purpose
  await page.click('button:has-text("OPD Consult")');
  await page.waitForTimeout(1000);

  // Patient view should appear
  await page.screenshot({ path: "../screenshots/phase5_patient_view.png", fullPage: true });

  await browser.close();
})();
