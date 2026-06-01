import { test, expect } from '@playwright/test';

test('shows the calculator', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('RPN Calculator');
});

test('evaluates an addition end-to-end', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('RPN expression').fill('3 4 +');
  await page.getByRole('button', { name: 'Evaluate' }).click();
  await expect(page.getByTestId('result')).toHaveText('= 7');
});

test('evaluates a multi-operator expression', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('RPN expression').fill('3 4 + 2 *');
  await page.getByRole('button', { name: 'Evaluate' }).click();
  await expect(page.getByTestId('result')).toHaveText('= 14');
});

test('shows a clear error for division by zero', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('RPN expression').fill('5 0 /');
  await page.getByRole('button', { name: 'Evaluate' }).click();
  await expect(page.getByTestId('error')).toContainText('divide by zero');
});

test('shows a friendly error for malformed input', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('RPN expression').fill('3 +');
  await page.getByRole('button', { name: 'Evaluate' }).click();
  await expect(page.getByTestId('error')).toBeVisible();
});
