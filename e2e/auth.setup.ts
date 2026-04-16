import { test as setup, expect } from '@playwright/test'

setup('authenticate as admin', async ({ page }) => {
  const token = process.env.ADMIN_TOKEN
  expect(token, 'ADMIN_TOKEN env var must be set').toBeTruthy()

  await page.goto('/admin')
  await page.getByLabel('Admin token').fill(token!)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/admin\/import/)

  await page.context().storageState({ path: 'e2e/.auth/admin.json' })
})
