import { Calendar, Filter, Search } from 'lucide-react'

const COUNTRIES = [
  { value: '', label: 'Country' },
  { value: 'NP', label: 'Nepal' },
  { value: 'US', label: 'USA' },
  { value: 'GB', label: 'UK' },
  { value: 'IN', label: 'India' },
]

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
    <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
      <label className="flex h-9 w-[200px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm">
        <Search className="size-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search"
          className="w-full bg-transparent outline-none"
        />
      </label>
      <button type="button" className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm">
        <Filter className="size-4" /> Filter
      </button>
      {onCountry && (
        <select
          value={country}
          onChange={(e) => onCountry(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm"
        >
          {COUNTRIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      )}
      {onFrom && (
        <label className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-500">
          <Calendar className="size-4" />
          <input type="date" value={from} onChange={(e) => onFrom(e.target.value)} className="bg-transparent outline-none" />
        </label>
      )}
      {onViewAll && (
        <button type="button" onClick={onViewAll} className="h-9 rounded-lg bg-violet-600 px-3 text-sm font-medium text-white">
          View All
        </button>
      )}
    </div>
  )
}
