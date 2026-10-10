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
  
  await page.click('text=View Chart');
  await page.waitForTimeout(1000);

  const currentUrl = page.url();
  await page.goto(`${currentUrl}/consult`);
  
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(3000); // Wait extra for LLM generation/fallback

  await page.screenshot({ path: "../screenshots/phase4_pre_visit_brief.png", fullPage: true });

  await browser.close();
  console.log("Done");
})();
