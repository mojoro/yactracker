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
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5">
                <svg className="h-8 w-8" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <rect width="32" height="32" rx="8" className="fill-brand-600" />
                  <path d="M13 4 L13 17 Q13 21 16 21 Q19 21 19 17 L19 4" stroke="white" strokeWidth="2.8" strokeLinecap="round" fill="none" />
                  <path d="M16 21 L16 28" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
                  <circle cx="16" cy="28.5" r="1.5" fill="white" />
                  <path d="M9.5 5.5 Q8 12 10.5 15" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.35" />
                  <path d="M22.5 5.5 Q24 12 21.5 15" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.35" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-base font-bold leading-tight text-slate-900 tracking-tight">
                    YACTracker
                  </span>
                  <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
                    Young Artist Community
                  </span>
                </div>
              </Link>
              <nav className="flex items-center gap-1">
                <Link
                  href="/"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  Home
                </Link>
                <Link
                  href="/programs"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  Programs
                </Link>
                <Link
                  href="/programs/new"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  Submit a Program
                </Link>
              </nav>
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="bg-brand-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <svg className="h-7 w-7" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                    <rect width="32" height="32" rx="7" className="fill-brand-500" />
                    <path d="M13 4 L13 17 Q13 21 16 21 Q19 21 19 17 L19 4" stroke="white" strokeWidth="2.8" strokeLinecap="round" fill="none" />
                    <path d="M16 21 L16 28" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
                    <circle cx="16" cy="28.5" r="1.5" fill="white" />
                    <path d="M9.5 5.5 Q8 12 10.5 15" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.35" />
                    <path d="M22.5 5.5 Q24 12 21.5 15" stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.35" />
                  </svg>
                  <span className="text-base font-semibold text-white">
                    YACTracker
                  </span>
                </div>
                <p className="mt-2 max-w-md text-sm text-slate-400">
                  A Young Artist Community resource for classical music and
                  opera programs.
                </p>
              </div>
              <nav className="flex gap-6 text-sm text-slate-400">
                <Link href="/" className="transition-colors hover:text-white">
                  Home
                </Link>
                <Link
                  href="/programs"
                  className="transition-colors hover:text-white"
                >
                  Programs
                </Link>
              </nav>
            </div>
            <div className="mt-8 border-t border-white/15 pt-6 text-xs text-slate-500">
              &copy; {new Date().getFullYear()} YACTracker
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
