import { test, expect } from '@playwright/test'

test.describe('platform interest poll', () => {
  test('pills render inside the community CTA on the landing page', async ({ page }) => {
    await page.goto('/')
    for (const label of ['Facebook', 'Instagram', 'Discord', 'Reddit']) {
      await expect(
        page.getByRole('button', { name: new RegExp(`Vote for ${label}`, 'i') }),
      ).toBeVisible()
    }
  })

  test('clicking a pill toggles voted state and updates the count', async ({ page }) => {
    await page.goto('/')

    const pill = page.getByRole('button', { name: /Vote for Discord/i })
    const initial = Number((await pill.textContent())?.match(/\((\d+)\)/)?.[1] ?? '0')

    await pill.click()

    const voted = page.getByRole('button', { name: /Remove vote for Discord/i })
    await expect(voted).toBeVisible()
    await expect(voted).toHaveAttribute('aria-pressed', 'true')
    await expect(voted).toContainText(`(${initial + 1})`)

    // Toggle off — pill returns to unvoted label + original count
    await voted.click()
    const revertedPill = page.getByRole('button', { name: /Vote for Discord/i })
    await expect(revertedPill).toHaveAttribute('aria-pressed', 'false')
    await expect(revertedPill).toContainText(`(${initial})`)
  })

  test('voted state persists across reload via cookie', async ({ page }) => {
    await page.goto('/')

    const pill = page.getByRole('button', { name: /Vote for Reddit/i })
    await pill.click()
    await expect(page.getByRole('button', { name: /Remove vote for Reddit/i })).toBeVisible()

    await page.reload()
    await expect(page.getByRole('button', { name: /Remove vote for Reddit/i })).toBeVisible()

    // Clean up so repeated runs stay deterministic
    await page.getByRole('button', { name: /Remove vote for Reddit/i }).click()
    await expect(page.getByRole('button', { name: /Vote for Reddit/i })).toBeVisible()
  })
})
