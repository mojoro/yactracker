import { test, expect } from '@playwright/test'

test.describe('feedback modal', () => {
  test('feedback button visible in header', async ({ page }) => {
    await page.goto('/')
    const feedbackBtn = page.getByRole('banner').getByRole('button', { name: /feedback/i })
    await expect(feedbackBtn).toBeVisible()
  })

  test('clicking feedback button opens modal', async ({ page }) => {
    await page.goto('/')
    await page
      .getByRole('banner')
      .getByRole('button', { name: /feedback/i })
      .click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('heading', { name: /send feedback/i })).toBeVisible()
  })

  test('submitting empty form shows validation', async ({ page }) => {
    await page.goto('/')
    await page
      .getByRole('banner')
      .getByRole('button', { name: /feedback/i })
      .click()

    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: /send feedback/i }).click()

    // Browser native validation should prevent submission (required field)
    // The textarea has required attribute so the form won't submit
    await expect(dialog).toBeVisible()
  })

  test('submitting with message succeeds', async ({ page }) => {
    await page.goto('/')
    await page
      .getByRole('banner')
      .getByRole('button', { name: /feedback/i })
      .click()

    const dialog = page.getByRole('dialog')
    await dialog.getByLabel(/message/i).fill('This is a test feedback message from E2E.')
    await dialog.getByRole('button', { name: /send feedback/i }).click()

    await expect(dialog.getByText(/thanks/i)).toBeVisible({ timeout: 5000 })
  })

  test('submitting with message and email succeeds', async ({ page }) => {
    await page.goto('/')
    await page
      .getByRole('banner')
      .getByRole('button', { name: /feedback/i })
      .click()

    const dialog = page.getByRole('dialog')
    await dialog.getByLabel(/message/i).fill('Feedback with email from E2E.')
    await dialog.getByLabel(/email/i).fill('test@example.com')
    await dialog.getByRole('button', { name: /send feedback/i }).click()

    await expect(dialog.getByText(/thanks/i)).toBeVisible({ timeout: 5000 })
  })
})
