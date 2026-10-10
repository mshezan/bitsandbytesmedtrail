import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
  
  try {
    await page.goto("http://localhost:3000/login");
    await page.click('button:has-text("Hospital Staff")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Sign In to Hospital Portal")');
    
    // Go to Integration Hub
    await page.goto("http://localhost:3000/hospital/integration");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "../screenshots/phase4_integration_hub_network.png" });

    // Open Pipeline Inspector
    await page.click('button:has-text("Open Pipeline Inspector Demo")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "../screenshots/phase4_pipeline_inspector.png" });
    await page.click('button:has-text("Close Inspector")');
    await page.waitForTimeout(500);

    // Go to Link Review
    await page.click('button:has-text("Link review")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "../screenshots/phase4_integration_hub_identity.png" });
    
    console.log("Screenshots saved successfully.");
  } catch(e) {
    console.error("Screenshot failed: ", e);
  } finally {
    await browser.close();
  }
})();
