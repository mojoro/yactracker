import { test as setup, expect } from '@playwright/test'

setup('authenticate as admin', async ({ browser, baseURL }) => {
  const token = process.env.ADMIN_TOKEN
  expect(token, 'ADMIN_TOKEN env var must be set').toBeTruthy()

  const domain = new URL(baseURL ?? 'http://localhost:3000').hostname
  const context = await browser.newContext()
  await context.addCookies([
    {
      name: 'admin_token',
      value: token!,
      domain,
      path: '/admin',
    },
  ])
  await context.storageState({ path: 'e2e/.auth/admin.json' })
  await context.close()
})
