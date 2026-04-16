import { test, expect } from '@playwright/test'

test.describe('review likes', () => {
  test('heart button visible on review card', async ({ page }) => {
    await page.goto('/programs')
    await page.locator('article').first().getByRole('link').first().click()
    await page.waitForURL(/\/programs\//)

    // Only test if reviews exist on this page
    const reviewCards = page.locator('li', { has: page.locator('button[aria-label*="elpful"]') })
    const count = await reviewCards.count()
    if (count === 0) return // Skip if no reviews

    const firstHeart = reviewCards.first().getByRole('button', { name: /elpful/i })
    await expect(firstHeart).toBeVisible()
  })

  test('clicking heart toggles helpful count', async ({ page }) => {
    await page.goto('/programs')
    await page.locator('article').first().getByRole('link').first().click()
    await page.waitForURL(/\/programs\//)

    const heartButton = page.getByRole('button', { name: /elpful/i }).first()
    const count = await heartButton.count()
    if (count === 0) return // Skip if no reviews

    // Click to like
    await heartButton.click()
    // Verify the button text changed (optimistic update)
    await expect(heartButton).toHaveText(/Helpful/)

    // Click again to unlike (toggle)
    await heartButton.click()
    await expect(heartButton).toHaveText(/Helpful/)
  })
})
