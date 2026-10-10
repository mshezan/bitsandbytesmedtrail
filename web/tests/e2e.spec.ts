import { test, expect } from '@playwright/test';

test('App loads and backend responds', async ({ page, request }) => {
  // Test backend
  const res = await request.get('http://localhost:8000/health');
  expect(res.status()).toBe(200);

  // Test frontend
  await page.goto('http://localhost:3000/login');
  await expect(page).toHaveTitle(/MedTrail/);
  
  await page.goto('http://localhost:3000/patient/home');
  await expect(page).toHaveTitle(/MedTrail/);
});
