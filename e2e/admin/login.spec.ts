import { test, expect } from '@playwright/test'

test.use({ storageState: { cookies: [], origins: [] } })

test.describe('admin login', () => {
  test('renders the login form', async ({ page }) => {
    await page.goto('/admin')

    await expect(page.getByRole('heading', { name: 'Admin login' })).toBeVisible()
    await expect(page.getByLabel('Admin token')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  })

  test('shows error for wrong token', async ({ page }) => {
    await page.goto('/admin')

    await page.getByLabel('Admin token').fill('wrong-token-123')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByText('Invalid token.')).toBeVisible()
    await expect(page).toHaveURL(/\/admin\?error=invalid/)
  })

  test('redirects to /admin/import on correct token', async ({ page }) => {
    await page.goto('/admin')

    await page.getByLabel('Admin token').fill(process.env.ADMIN_TOKEN ?? 'test-admin-token')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page).toHaveURL(/\/admin\/import/)
  })

  test('redirects unauthenticated users from admin pages to login', async ({ page }) => {
    await page.goto('/admin/data')
    await expect(page).toHaveURL(/\/admin$/)
    await expect(page.getByRole('heading', { name: 'Admin login' })).toBeVisible()
  })
})
