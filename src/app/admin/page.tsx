import { redirect } from 'next/navigation'
import { isAdminAuthenticated, adminLogin } from './actions'

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  if (await isAdminAuthenticated()) redirect('/admin/import')

  const params = await searchParams
  const hasError = params.error === 'invalid'

  return (
    <div className="mx-auto max-w-sm px-4 py-20">
      <h1 className="text-xl font-semibold text-gray-900">Admin login</h1>
      <form action={adminLogin} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="token"
            className="block text-sm font-medium text-gray-700"
          >
            Admin token
          </label>
          <input
            id="token"
            name="token"
            type="password"
            required
            autoFocus
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          />
        </div>
        {hasError && (
          <p className="text-sm text-red-600">Invalid token.</p>
        )}
        <button
          type="submit"
          className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Sign in
        </button>
      </form>
    </div>
  )
}
