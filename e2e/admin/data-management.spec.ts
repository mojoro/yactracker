import { test, expect } from '@playwright/test'

test.describe('Admin data management', () => {
  test('page renders with heading', async ({ page }) => {
    await page.goto('/admin/data')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/manage data/i)
  })

  test('programs table lists at least one program', async ({ page }) => {
    await page.goto('/admin/data')
    const rows = page.locator('table tbody tr')
    await expect(rows.first()).toBeVisible()
    expect(await rows.count()).toBeGreaterThanOrEqual(1)
  })

  test('clicking a program updates URL and loads editor', async ({ page }) => {
    await page.goto('/admin/data')
    const firstLink = page.locator('table tbody tr').first().getByRole('link')
    const programName = await firstLink.textContent()
    await firstLink.click()

    await expect(page).toHaveURL(/[?&]program=/)
    await expect(
      page.getByRole('heading', { name: new RegExp(`^Edit: ${programName!}`, 'i') }),
    ).toBeVisible()
  })
})
