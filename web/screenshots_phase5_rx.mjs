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
  await page.waitForTimeout(2000); 

  // Switch to Medications tab
  await page.click('button:has-text("Medications")');
  await page.waitForTimeout(500);

  // Click Add Rx
  await page.click('button:has-text("Add Rx")');
  await page.waitForTimeout(1000);
  
  // Fill in drug to trigger interaction (Priya has Metformin already in her meds if we fetch)
  // Let's use the template "T2DM Follow-up" to fill Glycomet
  await page.click('button:has-text("T2DM Follow-up")');
  await page.waitForTimeout(500);

  // Add Ecosprin to trigger interaction (Wait, does Priya have Ibuprofen? We don't know for sure in seed, but we can manually type Ibuprofen in another row to trigger the intra-prescription check!)
  await page.click('button:has-text("Add Drug Row")');
  await page.waitForTimeout(200);
  
  // Get all drug inputs
  const inputs = await page.locator('input[placeholder="Search generic/brand..."]').all();
  // We added a new row, so fill the last one with Ecosprin
  await inputs[2].fill("Ecosprin");
  await page.waitForTimeout(500);
  
  // Add another row with Ibuprofen
  await page.click('button:has-text("Add Drug Row")');
  await page.waitForTimeout(200);
  const inputs2 = await page.locator('input[placeholder="Search generic/brand..."]').all();
  await inputs2[3].fill("Ibuprofen");
  
  await page.waitForTimeout(1000); // Wait for Live Checks

  await page.screenshot({ path: "../screenshots/phase5_rx_composer_live_checks.png", fullPage: true });
  
  // Click Sign
  // To avoid hard stop, we will sign. Wait, the hard stop is only for ALLERGY penicilin + augmentin. 
  // Let's test the signature flow.
  await page.click('button:has-text("Sign & Lock Rx")');
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: "../screenshots/phase5_rx_signed_print.png", fullPage: true });

  await browser.close();
  console.log("Done");
})();
