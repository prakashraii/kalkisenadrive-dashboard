import type { SelectHTMLAttributes } from 'react'
import { Calendar, ChevronDown, Filter, Search, X } from 'lucide-react'

const COUNTRIES = [
  { value: '', label: 'Country' },
  { value: 'NP', label: 'Nepal' },
  { value: 'US', label: 'USA' },
  { value: 'GB', label: 'UK' },
  { value: 'IN', label: 'India' },
]

function FilterSelect({
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="relative flex h-11 min-w-[183px] items-center rounded-md border border-black/12 bg-white px-4">
      <select {...props} className="h-full w-full appearance-none bg-transparent pr-6 text-base text-black outline-none">
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 size-3 text-black" />
    </label>
  )
}

export function TableToolbar({
  search,
  onSearch,
  country,
  onCountry,
  from,
  onFrom,
  onViewAll,
}: {
  search: string
  onSearch: (v: string) => void
  country?: string
  onCountry?: (v: string) => void
  from?: string
  onFrom?: (v: string) => void
  onViewAll?: () => void
}) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <label className="flex h-11 min-w-[240px] flex-1 items-center gap-2.5 rounded-md border border-black/10 bg-white px-4">
        <Search className="size-5 shrink-0 text-black/60" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Type to search..."
          aria-label="Search records"
          className="w-full bg-transparent text-xs text-black outline-none placeholder:text-black/60 [&::-webkit-search-cancel-button]:hidden"
        />
        {search ? (
          <button
            type="button"
            onClick={() => onSearch('')}
            aria-label="Clear search"
            className="rounded p-0.5 text-black/45 hover:text-black"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="flex h-11 min-w-[183px] items-center justify-between rounded-md border border-black/12 bg-white px-4 text-base text-black"
        >
          <span className="inline-flex items-center gap-2.5">
            <Filter className="size-3.5" />
            Filter
          </span>
          <ChevronDown className="size-3" />
        </button>
        {onCountry && (
          <FilterSelect value={country} onChange={(e) => onCountry(e.target.value)}>
            {COUNTRIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </FilterSelect>
        )}
        {onFrom && (
          <label className="relative flex h-11 min-w-[183px] items-center gap-2.5 rounded-md border border-black/12 bg-white px-4 text-base text-black">
            <Calendar className="size-5 shrink-0" />
            <input
              type="date"
              value={from}
              onChange={(e) => onFrom(e.target.value)}
              className="h-full w-full bg-transparent text-base outline-none"
            />
            <ChevronDown className="pointer-events-none size-3" />
          </label>
        )}
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="h-11 rounded-md bg-[#020B17] px-4 text-sm font-medium text-white"
          >
            View All
          </button>
        )}
      </div>
    </div>
  )
}
