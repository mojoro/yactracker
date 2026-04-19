import { test, expect } from '@playwright/test'

test.describe('platform interest poll', () => {
  test('checkboxes render inside the community CTA on the landing page', async ({ page }) => {
    await page.goto('/')
    for (const label of ['Facebook', 'Instagram', 'Discord', 'Reddit', 'Other']) {
      await expect(page.getByRole('checkbox', { name: new RegExp(label, 'i') })).toBeVisible()
    }
  })

  test('clicking a checkbox toggles voted state', async ({ page }) => {
    await page.goto('/')

    const checkbox = page.getByRole('checkbox', { name: /Discord/i })

    await expect(checkbox).not.toBeChecked()

    await checkbox.click()
    await expect(checkbox).toBeChecked()
    // Wait for the server action's transition to settle before clicking again,
    // otherwise the checkbox is still disabled and the second click is a no-op.
    await expect(checkbox).toBeEnabled()

    await checkbox.click()
    await expect(checkbox).not.toBeChecked()
    await expect(checkbox).toBeEnabled()
  })

  test('voted state persists across reload via cookie', async ({ page }) => {
    await page.goto('/')

    const checkbox = page.getByRole('checkbox', { name: /Reddit/i })
    await checkbox.click()
    await expect(checkbox).toBeChecked()
    // Wait for the server action to settle so the Set-Cookie header is applied
    // before we reload the page.
    await expect(checkbox).toBeEnabled()

    await page.reload()
    await expect(page.getByRole('checkbox', { name: /Reddit/i })).toBeChecked()

    // Clean up so repeated runs stay deterministic
    const reloaded = page.getByRole('checkbox', { name: /Reddit/i })
    await reloaded.click()
    await expect(reloaded).not.toBeChecked()
    await expect(reloaded).toBeEnabled()
  })
})
