import { test, expect } from '@playwright/test'

test.describe('platform interest poll', () => {
  test('checkboxes render inside the community CTA on the landing page', async ({ page }) => {
    await page.goto('/')
    for (const label of ['Facebook', 'Instagram', 'Discord', 'Reddit']) {
      await expect(page.getByRole('checkbox', { name: new RegExp(label, 'i') })).toBeVisible()
    }
  })

  test('clicking a checkbox toggles voted state and updates the count', async ({ page }) => {
    await page.goto('/')

    const row = page.locator('li', { has: page.getByRole('checkbox', { name: /Discord/i }) })
    const checkbox = row.getByRole('checkbox', { name: /Discord/i })
    const count = row.locator('span.tabular-nums')
    const initial = Number(((await count.textContent()) ?? '0').trim())

    await expect(checkbox).not.toBeChecked()

    await checkbox.click()
    await expect(checkbox).toBeChecked()
    await expect(count).toHaveText(String(initial + 1))

    await checkbox.click()
    await expect(checkbox).not.toBeChecked()
    await expect(count).toHaveText(String(initial))
  })

  test('voted state persists across reload via cookie', async ({ page }) => {
    await page.goto('/')

    const checkbox = page.getByRole('checkbox', { name: /Reddit/i })
    const actionDone = page.waitForResponse(
      (r) => r.url().includes('localhost') && r.status() === 200 && r.request().method() === 'POST',
    )
    await checkbox.click()
    await actionDone
    await expect(checkbox).toBeChecked()

    await page.reload()
    await expect(page.getByRole('checkbox', { name: /Reddit/i })).toBeChecked()

    // Clean up so repeated runs stay deterministic
    const cleanupDone = page.waitForResponse(
      (r) => r.url().includes('localhost') && r.status() === 200 && r.request().method() === 'POST',
    )
    await page.getByRole('checkbox', { name: /Reddit/i }).click()
    await cleanupDone
    await expect(page.getByRole('checkbox', { name: /Reddit/i })).not.toBeChecked()
  })
})
