import { test, expect } from '@playwright/test'

test.describe('programs search and filter', () => {
  test('search updates URL and filters results', async ({ page }) => {
    await page.goto('/programs')

    await page.getByLabel(/search/i).fill('opera')
    await page.getByLabel(/search/i).press('Enter')

    await expect(page).toHaveURL(/[?&]q=opera/)
  })

  test('category filter updates URL', async ({ page }) => {
    await page.goto('/programs')

    const categorySelect = page.getByLabel(/category/i)
    const options = categorySelect.locator('option:not([value=""])')
    const optionCount = await options.count()

    expect(optionCount, 'Test database must have at least one category').toBeGreaterThan(0)
    {
      const firstValue = await options.first().getAttribute('value')
      await categorySelect.selectOption(firstValue!)
      // Submit the form — the search label's input triggers form submit on Enter
      await page.getByLabel(/search/i).press('Enter')
      await expect(page).toHaveURL(/category_id=/)
    }
  })
})
