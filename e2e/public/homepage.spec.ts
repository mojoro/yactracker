import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('page loads and main heading is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('program cards render in the recently updated section', async ({ page }) => {
    const section = page.locator('section').filter({
      has: page.getByRole('heading', { name: /recently updated/i }),
    })
    const cards = section.locator('article')
    await expect(cards.first()).toBeVisible()
    expect(await cards.count()).toBeGreaterThanOrEqual(1)
  })

  test('search input exists', async ({ page }) => {
    const input = page.getByPlaceholder(/search/i).filter({ visible: true })
    await expect(input.first()).toBeVisible()
  })

  test('browse by category section has category links', async ({ page }) => {
    const section = page.locator('section').filter({
      has: page.getByRole('heading', { name: /browse by category/i }),
    })
    const links = section.getByRole('link')
    await expect(links.first()).toBeVisible()
    expect(await links.count()).toBeGreaterThanOrEqual(1)
  })

  test('community CTA links are present', async ({ page }) => {
    const section = page.locator('section').filter({
      has: page.getByRole('heading', { name: /directory grows when you contribute/i }),
    })
    await expect(section.getByRole('link', { name: /write a review/i })).toBeVisible()
    await expect(section.getByRole('link', { name: /submit a program/i })).toBeVisible()
  })
})
