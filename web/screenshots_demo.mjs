import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
  
  try {
    await page.goto("http://localhost:3000/demo");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "../screenshots/phase5_demo_control_panel.png" });

    // Click the first scenario to show trace
    await page.click('button:has-text("Step 1")');
    await page.waitForTimeout(4000); // Wait for the visual trace simulation to finish
    await page.screenshot({ path: "../screenshots/phase5_demo_pipeline_trace.png" });
    
    console.log("Screenshots saved successfully.");
  } catch(e) {
    console.error("Screenshot failed: ", e);
  } finally {
    await browser.close();
  }
})();
