// tests/e2e/myplan.spec.ts
import { test, expect } from '@playwright/test';
test('MyPlan shows correct totals after seeding via dev page', async ({ page }) => {
  await page.goto('http://localhost:3000/dev/local-test', { waitUntil: 'domcontentloaded' });
  const nuke = page.getByRole('button', { name: /nuke/i });
  const seed = page.getByRole('button', { name: /seed/i });
  await nuke.click();
  await seed.click();
  await page.goto('http://localhost:3000/my-plan', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('£3,500')).toBeVisible();
  await expect(page.getByText('180')).toBeVisible();
  await expect(page.getByText(/2.*debts/i)).toBeVisible();
});
