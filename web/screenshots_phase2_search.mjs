import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
  
  await page.goto("http://localhost:3000/login");
  await page.click('button:has-text("Hospital Staff")');
  await page.waitForTimeout(500);
  await page.click('button:has-text("Sign In to Hospital Portal")');
  await page.waitForURL("**/hospital/home**");
  
  await page.goto("http://localhost:3000/hospital/search");
  await page.fill('input[type="text"]', "Priya");
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: "../screenshots/phase2_patient_search.png", fullPage: true });
  
  // Click register new patient
  await page.click('button:has-text("Register New Patient")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: "../screenshots/phase2_patient_register.png", fullPage: true });

  await browser.close();
  console.log("Done");
})();
