import { test, expect } from '@playwright/test'

test.describe('review submission', () => {
  test('fills and submits review form on program detail page', async ({ page }) => {
    await page.goto('/programs')
    await page.locator('article').first().getByRole('link').first().click()
    await page.waitForURL(/\/programs\//)

    const currentURL = page.url()

    await page.getByLabel(/rating/i).selectOption('4')
    await page
      .getByLabel(/review/i)
      .fill('Great program with wonderful faculty and performance opportunities.')
    await page.getByRole('button', { name: /submit review/i }).click()

    // Wait for server action to complete — page stays on same program
    await page.waitForLoadState('load')
    await expect(page).toHaveURL(currentURL)
  })
})
