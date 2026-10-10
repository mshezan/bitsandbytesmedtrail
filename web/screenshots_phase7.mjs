import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
  
  await page.goto("http://localhost:3000/login");
  await page.click('button:has-text("Hospital Staff")');
  await page.waitForTimeout(500);
  await page.click('button:has-text("Sign In to Hospital Portal")');
  
  // 1. Corrections Inbox Screenshot
  await page.goto("http://localhost:3000/hospital/inbox");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  
  await page.click('button:has-text("Corrections")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: "../screenshots/phase7_inbox_corrections.png", fullPage: true });

  // 2. Note Editor Screenshot
  await page.goto("http://localhost:3000/hospital/search");
  await page.fill('input[type="text"]', "Priya");
  await page.waitForTimeout(1000);
  await page.click('text=View Chart');
  await page.waitForTimeout(1000);
  const currentUrl = page.url();
  await page.goto(`${currentUrl}/consult`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
  
  await page.click('button:has-text("Notes & Visits")');
  await page.waitForTimeout(500);
  await page.click('button:has-text("Add Note")');
  await page.waitForTimeout(1000);

  // Trigger smart inserts
  await page.click('button:has-text("Insert Vitals")');
  await page.waitForTimeout(300);
  await page.click('button:has-text("Insert Active Meds")');
  await page.waitForTimeout(500);
  
  await page.screenshot({ path: "../screenshots/phase7_note_editor_inserts.png", fullPage: true });
  
  await page.click('button:has-text("Sign & Lock Note")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "../screenshots/phase7_note_editor_signed.png", fullPage: true });

  await browser.close();
  console.log("Done");
})();
