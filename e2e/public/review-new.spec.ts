import { test, expect } from '@playwright/test'

test('standalone review page loads', async ({ page }) => {
  await page.goto('/reviews/new')
  await expect(page.getByRole('heading', { level: 1, name: /write a review/i })).toBeVisible()
})
