import type { Metadata } from 'next'
import Link from 'next/link'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'YACTracker — Young Artist Community',
  description:
    'Find and review young artist programs in classical music and opera. YACTracker is a Young Artist Community resource for singers and instrumentalists.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              YACTracker
              <span className="ml-1.5 text-xs font-normal text-gray-500">Young Artist Community</span>
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/" className="text-gray-700 hover:text-gray-900">
                Home
              </Link>
              <Link
                href="/programs"
                className="text-gray-700 hover:text-gray-900"
              >
                Programs
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-200 bg-gray-50">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-gray-500">
            YACTracker — a Young Artist Community resource for classical music
            and opera programs.
          </div>
        </footer>
      </body>
    </html>
  )
}
