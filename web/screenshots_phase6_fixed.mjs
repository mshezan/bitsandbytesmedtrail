import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
  
  await page.goto("http://localhost:3000/login");
  await page.click('button:has-text("Hospital Staff")');
  await page.waitForTimeout(500);
  await page.click('button:has-text("Sign In to Hospital Portal")');
  
  // Go to Inbox directly
  await page.goto("http://localhost:3000/hospital/inbox");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: "../screenshots/phase6_inbox_results.png", fullPage: true });

  await page.click('button:has-text("My Orders")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: "../screenshots/phase6_inbox_orders.png", fullPage: true });

  await page.goto("http://localhost:3000/hospital/search");
  await page.fill('input[type="text"]', "Priya");
  await page.waitForTimeout(1000);
  await page.click('text=View Chart');
  await page.waitForTimeout(1000);
  
  const currentUrl = page.url();
  await page.goto(`${currentUrl}/consult`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
  
  await page.click('button:has-text("Labs")');
  await page.waitForTimeout(500);
  await page.click('button:has-text("Add Order")');
  await page.waitForTimeout(1000);

  const inputs = await page.locator('input[placeholder="Search test..."]').all();
  await inputs[0].fill("HbA1c");
  await page.waitForTimeout(1000); 
  
  await page.screenshot({ path: "../screenshots/phase6_order_composer_duplicate.png", fullPage: true });

  await browser.close();
  console.log("Done");
})();
