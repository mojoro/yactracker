import { test, expect } from '@playwright/test'

test.describe('admin feedback', () => {
  test('feedback page accessible from admin nav', async ({ page }) => {
    await page.goto('/admin/import')
    const feedbackLink = page.getByRole('link', { name: /feedback/i })
    await expect(feedbackLink).toBeVisible()

    await feedbackLink.click()
    await page.waitForURL(/\/admin\/feedback/)
    await expect(page.getByRole('heading', { name: /feedback/i })).toBeVisible()
  })

  test('status filter tabs work', async ({ page }) => {
    await page.goto('/admin/feedback')
    await expect(page.getByRole('link', { name: /pending/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /read/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /resolved/i })).toBeVisible()

    await page.getByRole('link', { name: /^all/i }).click()
    await page.waitForURL(/status=all/)
  })
})
