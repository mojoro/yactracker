'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface ProgramOption {
  id: string
  name: string
}

interface SelectedProgram {
  id: string
  name: string
  is_new: boolean
}

interface ProgramComboboxProps {
  name: string
  options: ProgramOption[]
  placeholder?: string
}

export function ProgramCombobox({ name, options, placeholder }: ProgramComboboxProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<SelectedProgram | null>(null)
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const lowerQuery = query.toLowerCase().trim()

  const filtered = lowerQuery
    ? options.filter((o) => o.name.toLowerCase().includes(lowerQuery))
    : options

  const exactMatch = options.some((o) => o.name.toLowerCase() === lowerQuery)
  const showAddOption = lowerQuery && !exactMatch

  const handleSelect = useCallback((opt: ProgramOption) => {
    setSelected({ id: opt.id, name: opt.name, is_new: false })
    setQuery(opt.name)
    setOpen(false)
  }, [])

  const handleAddNew = useCallback(() => {
    const trimmed = query.trim()
    if (!trimmed) return
    setSelected({ id: `new-${crypto.randomUUID()}`, name: trimmed, is_new: true })
    setOpen(false)
  }, [query])

  const handleClear = useCallback(() => {
    setSelected(null)
    setQuery('')
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const serialized = selected ? JSON.stringify(selected) : ''

  return (
    <div ref={wrapperRef}>
      <label
        htmlFor="program-combobox"
        className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5"
      >
        Program <span className="text-red-500">*</span>
      </label>
      <input type="hidden" name={name} value={serialized} />
      <div className="relative">
        {selected ? (
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200">
            <span className="flex-1 text-sm text-slate-900">{selected.name}</span>
            {selected.is_new && (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600 ring-1 ring-brand-200">
                new program
              </span>
            )}
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Change program"
            >
              <svg className="h-4 w-4" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3l6 6M9 3l-6 6" />
              </svg>
            </button>
          </div>
        ) : (
          <>
            <input
              id="program-combobox"
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setOpen(true)
              }}
              onFocus={() => setOpen(true)}
              placeholder={placeholder}
              className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors"
              autoComplete="off"
            />
            {open && (filtered.length > 0 || showAddOption) && (
              <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-slate-900/10">
                {filtered.slice(0, 20).map((opt) => (
                  <li key={opt.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(opt)}
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                    >
                      {opt.name}
                    </button>
                  </li>
                ))}
                {showAddOption && (
                  <li>
                    <button
                      type="button"
                      onClick={handleAddNew}
                      className="w-full px-3 py-2 text-left text-sm font-medium text-brand-600 hover:bg-brand-50 transition-colors"
                    >
                      + Add &ldquo;{query.trim()}&rdquo; as a new program
                    </button>
                  </li>
                )}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  )
}
