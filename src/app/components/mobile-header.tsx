'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function MobileHeader() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const headerRef = useRef<HTMLElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on navigation
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Close on click outside
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
      setOpen(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, handleClickOutside])

  return (
    <header ref={headerRef} className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
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
              <span className="text-sm font-bold leading-tight text-slate-900 tracking-tight">
                Young Artist
              </span>
              <span className="text-sm font-bold leading-tight text-brand-600 tracking-tight">
                Community
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
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
            <Link
              href="/about"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              About
            </Link>
          </nav>

          {/* Mobile hamburger — animated bars to X */}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="sm:hidden relative h-10 w-10 rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-4 flex flex-col justify-between">
              <span className={`block h-0.5 w-full bg-current transition-all duration-300 origin-center ${open ? 'translate-y-[7px] rotate-45' : ''}`} />
              <span className={`block h-0.5 w-full bg-current transition-all duration-300 ${open ? 'opacity-0 scale-x-0' : ''}`} />
              <span className={`block h-0.5 w-full bg-current transition-all duration-300 origin-center ${open ? '-translate-y-[7px] -rotate-45' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu — slide down */}
      <div
        ref={menuRef}
        className={`sm:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${open ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <nav className="border-t border-slate-100 bg-white px-4 pb-4 pt-2">
          <Link
            href="/"
            className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            Home
          </Link>
          <Link
            href="/programs"
            className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            Programs
          </Link>
          <Link
            href="/programs/new"
            className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            Submit a Program
          </Link>
          <Link
            href="/about"
            className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  )
}
