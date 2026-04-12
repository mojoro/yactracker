import type { Metadata } from 'next'
import Link from 'next/link'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { SubscribeForm } from './subscribe/subscribe-form'
import { MobileHeader } from './components/mobile-header'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Young Artist Community | Classical Music Programs Directory',
  description:
    'Find and review young artist programs in classical music and opera. A community resource for singers and instrumentalists.',
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
        <MobileHeader />
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
                    Young Artist Community
                  </span>
                </div>
                <p className="mt-2 max-w-md text-sm text-slate-300">
                  A community directory for classical music and opera programs.
                </p>
              </div>
              <nav className="flex gap-6 text-sm text-slate-300">
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
            <div className="mt-8 border-t border-white/15 pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-300">
                    Interested in this platform?
                  </p>
                  <p className="mt-0.5 text-xs text-slate-300">
                    Sign up to let us know there's demand.
                  </p>
                </div>
                <div className="w-full sm:w-80">
                  <SubscribeForm variant="dark" />
                </div>
              </div>
            </div>
            <div className="mt-8 border-t border-white/15 pt-6">
              <div className="flex flex-col sm:flex-row justify-between gap-6">
                <div>
                  <p className="text-sm font-medium text-slate-300">
                    Built by John Moorman
                  </p>
                  <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate-300">
                    If anything about this project interests you or you'd like
                    to help out, please reach out.
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-sm text-slate-300">
                    <a
                      href="mailto:john@johnmoorman.com"
                      className="transition-colors hover:text-white"
                    >
                      john@johnmoorman.com
                    </a>
                    <a
                      href="https://johnmoorman.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors hover:text-white"
                    >
                      johnmoorman.com
                    </a>
                    <a
                      href="https://www.linkedin.com/in/john-moorman/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors hover:text-white"
                    >
                      LinkedIn
                    </a>
                  </div>
                </div>
              </div>
              <p className="mt-6 text-xs text-slate-300">
                &copy; {new Date().getFullYear()} Young Artist Community
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
