'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

export interface ComboboxItem {
  id: string
  name: string
  is_new: boolean
}

interface ComboboxProps {
  name: string
  label: string
  options: { id: string; name: string }[]
  placeholder?: string
  required?: boolean
  initialSelected?: { id: string; name: string }[]
}

export function Combobox({ name, label, options, placeholder, required, initialSelected }: ComboboxProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<ComboboxItem[]>(
    () => initialSelected?.map((item) => ({ id: item.id, name: item.name, is_new: false })) ?? [],
  )
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const lowerQuery = query.toLowerCase().trim()

  const filtered = lowerQuery
    ? options.filter(
        (o) =>
          o.name.toLowerCase().includes(lowerQuery) &&
          !selected.some((s) => s.id === o.id),
      )
    : options.filter((o) => !selected.some((s) => s.id === o.id))

  const exactMatch = options.some(
    (o) => o.name.toLowerCase() === lowerQuery,
  )
  const alreadySelected = selected.some(
    (s) => s.name.toLowerCase() === lowerQuery,
  )
  const showAddOption = lowerQuery && !exactMatch && !alreadySelected

  const handleSelect = useCallback((opt: { id: string; name: string }) => {
    setSelected((prev) => [...prev, { id: opt.id, name: opt.name, is_new: false }])
    setQuery('')
    inputRef.current?.focus()
  }, [])

  const handleAddNew = useCallback(() => {
    const trimmed = query.trim()
    if (!trimmed) return
    const newItem: ComboboxItem = {
      id: `new-${crypto.randomUUID()}`,
      name: trimmed,
      is_new: true,
    }
    setSelected((prev) => [...prev, newItem])
    setQuery('')
    inputRef.current?.focus()
  }, [query])

  const handleRemove = useCallback((id: string) => {
    setSelected((prev) => prev.filter((s) => s.id !== id))
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const serialized = JSON.stringify(selected)

  return (
    <div ref={wrapperRef}>
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type="hidden" name={name} value={serialized} />
      <div className="relative">
        <input
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
          <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-slate-900/10">
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
                  + Add &ldquo;{query.trim()}&rdquo;
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((item) => (
            <span
              key={item.id}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                item.is_new
                  ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {item.name}
              {item.is_new && (
                <span className="text-[10px] font-normal text-brand-500">new</span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="ml-0.5 text-slate-400 hover:text-slate-600"
                aria-label={`Remove ${item.name}`}
              >
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3l6 6M9 3l-6 6" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Location combobox — handles city + country for new entries
// ---------------------------------------------------------------------------

interface LocationComboboxProps {
  name: string
  label: string
  options: { id: string; name: string }[]
  placeholder?: string
  required?: boolean
  initialSelected?: { id: string; name: string }[]
}

interface LocationNewForm {
  city: string
  country: string
}

export function LocationCombobox({
  name,
  label,
  options,
  placeholder,
  required,
  initialSelected,
}: LocationComboboxProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<ComboboxItem[]>(
    () => initialSelected?.map((item) => ({ id: item.id, name: item.name, is_new: false })) ?? [],
  )
  const [open, setOpen] = useState(false)
  const [addingNew, setAddingNew] = useState(false)
  const [newLoc, setNewLoc] = useState<LocationNewForm>({ city: '', country: '' })
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const lowerQuery = query.toLowerCase().trim()

  const filtered = lowerQuery
    ? options.filter(
        (o) =>
          o.name.toLowerCase().includes(lowerQuery) &&
          !selected.some((s) => s.id === o.id),
      )
    : options.filter((o) => !selected.some((s) => s.id === o.id))

  const exactMatch = options.some(
    (o) => o.name.toLowerCase() === lowerQuery,
  )
  const alreadySelected = selected.some(
    (s) => s.name.toLowerCase() === lowerQuery,
  )
  const showAddOption = lowerQuery && !exactMatch && !alreadySelected

  const handleSelect = useCallback((opt: { id: string; name: string }) => {
    setSelected((prev) => [...prev, { id: opt.id, name: opt.name, is_new: false }])
    setQuery('')
    setOpen(false)
    inputRef.current?.focus()
  }, [])

  const handleStartAddNew = useCallback(() => {
    setAddingNew(true)
    setOpen(false)
    // Pre-fill city from query
    const trimmed = query.trim()
    setNewLoc({ city: trimmed, country: '' })
  }, [query])

  const handleConfirmNew = useCallback(() => {
    const city = newLoc.city.trim()
    const country = newLoc.country.trim()
    if (!city || !country) return
    const displayName = `${city}, ${country}`
    const newItem: ComboboxItem = {
      id: `new-${crypto.randomUUID()}`,
      name: displayName,
      is_new: true,
    }
    setSelected((prev) => [...prev, newItem])
    setNewLoc({ city: '', country: '' })
    setAddingNew(false)
    setQuery('')
    inputRef.current?.focus()
  }, [newLoc])

  const handleCancelNew = useCallback(() => {
    setAddingNew(false)
    setNewLoc({ city: '', country: '' })
  }, [])

  const handleRemove = useCallback((id: string) => {
    setSelected((prev) => prev.filter((s) => s.id !== id))
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

  const serialized = JSON.stringify(selected)

  return (
    <div ref={wrapperRef}>
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type="hidden" name={name} value={serialized} />
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setAddingNew(false)
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors"
          autoComplete="off"
        />
        {open && !addingNew && (filtered.length > 0 || showAddOption) && (
          <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-slate-900/10">
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
                  onClick={handleStartAddNew}
                  className="w-full px-3 py-2 text-left text-sm font-medium text-brand-600 hover:bg-brand-50 transition-colors"
                >
                  + Add new location...
                </button>
              </li>
            )}
          </ul>
        )}
      </div>

      {addingNew && (
        <div className="mt-2 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
            New location
          </p>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={newLoc.city}
              onChange={(e) => setNewLoc((prev) => ({ ...prev, city: e.target.value }))}
              placeholder="City"
              className="rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 transition-colors"
              autoFocus
            />
            <input
              type="text"
              value={newLoc.country}
              onChange={(e) => setNewLoc((prev) => ({ ...prev, country: e.target.value }))}
              placeholder="Country"
              className="rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900 ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 transition-colors"
            />
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={handleConfirmNew}
              disabled={!newLoc.city.trim() || !newLoc.country.trim()}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add
            </button>
            <button
              type="button"
              onClick={handleCancelNew}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((item) => (
            <span
              key={item.id}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                item.is_new
                  ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {item.name}
              {item.is_new && (
                <span className="text-[10px] font-normal text-brand-500">new</span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="ml-0.5 text-slate-400 hover:text-slate-600"
                aria-label={`Remove ${item.name}`}
              >
                <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3l6 6M9 3l-6 6" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
