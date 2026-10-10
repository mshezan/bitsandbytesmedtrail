import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
  
  console.log("Capturing Integrations page...");
  await page.goto("http://localhost:3000/hospital/settings");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "../screenshots/phase4_integrations.png", fullPage: true });

  await browser.close();
  console.log("Done.");
})();
