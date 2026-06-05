import { expect, test } from '@playwright/test';

test('searches hospitals by LGA/city text', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('e.g. Reddington, Ikoyi, or Surulere').fill('Eti-Osa');
  await expect(page.getByText('Reddington Multi-Specialty Hospital')).toBeVisible();
  await expect(page.getByText('Lagoon Hospital Ikoyi')).toBeVisible();
});

test('exports filtered hospital results to CSV', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('e.g. Reddington, Ikoyi, or Surulere').fill('Lagos');
  await page.getByRole('button', { name: 'Download' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByText('Trigger Download').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^hospitals-lagos-\d{4}-\d{2}-\d{2}\.csv$/);
});

test('generates a shareable link for current filters', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('e.g. Reddington, Ikoyi, or Surulere').fill('Lagos');
  await page.getByTitle('Share hospital list').click();
  const input = page.locator('input[readonly]');
  await expect(input).toHaveValue(/query=Lagos/);
  await page.getByText('Copy URL').click();
  await expect(page.getByText('Copied!')).toBeVisible();
});

test('admin can sign in and open the registry console', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.getByRole('button', { name: 'Admin' }).click();
  await page.getByLabel('Email Address').fill('admin@carefinder.gov.ng');
  await page.getByLabel('Password').fill('admin123');
  await page.locator('form').getByRole('button', { name: 'Sign In' }).click();
  await expect(page.getByText('Admin Dashboard')).toBeVisible();
  await page.getByText('Admin Dashboard').click();
  await expect(page.getByText('Carefinder Registry Console')).toBeVisible();
});

test('anonymous users must sign in before reviewing hospitals', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByText('Lagos University Teaching Hospital').click();
  await expect(page.getByText('Sign In to Rate')).toBeVisible();
});
