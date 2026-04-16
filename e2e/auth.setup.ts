import { test as setup } from '@playwright/test'

setup('authenticate as admin', async ({ browser, baseURL }) => {
  const domain = new URL(baseURL ?? 'http://localhost:3000').hostname
  const context = await browser.newContext()
  await context.addCookies([
    {
      name: 'admin_token',
      value: process.env.ADMIN_TOKEN!,
      domain,
      path: '/admin',
    },
  ])
  await context.storageState({ path: 'e2e/.auth/admin.json' })
  await context.close()
})
