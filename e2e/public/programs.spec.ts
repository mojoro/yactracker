import { test, expect } from '@playwright/test'

test.describe('Programs listing page', () => {
  test('renders the page heading', async ({ page }) => {
    await page.goto('/programs')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Programs')
  })

  test('renders filter dropdowns for instrument and category', async ({ page }) => {
    await page.goto('/programs')

    await expect(page.locator('select[name="instrument_id"]')).toBeVisible()
    await expect(page.locator('select[name="category_id"]')).toBeVisible()
  })

  test('renders the search input', async ({ page }) => {
    await page.goto('/programs')

    await expect(page.locator('input[name="q"]')).toBeVisible()
    await expect(page.locator('input[name="q"]')).toHaveAttribute(
      'placeholder',
      'Search by name or description...',
    )
  })

  test('displays at least one program card', async ({ page }) => {
    await page.goto('/programs')

    await expect(page.locator('article').first()).toBeVisible()
    expect(await page.locator('article').count()).toBeGreaterThanOrEqual(1)
  })

  test('view toggle switches between card and list views', async ({ page }) => {
    await page.goto('/programs')

    // Default is card view — articles visible, no table
    await expect(page.locator('article').first()).toBeVisible()
    await expect(page.locator('table')).toHaveCount(0)

    // Click list view button
    await page.getByRole('link', { name: 'List view' }).click()
    await page.waitForURL(/view=list/)
    await expect(page.locator('table')).toBeVisible()

    // Click card view button to switch back
    await page.getByRole('link', { name: 'Card view' }).click()
    await expect(page.locator('article').first()).toBeVisible()
  })
})
