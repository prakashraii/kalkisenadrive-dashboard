import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { LoaderCircle, Search, SearchX, X } from 'lucide-react'
import { searchAdminRecords, type GlobalSearchHit } from '../../lib/global-search'
import { cn } from '../../lib/cn'
import { usePageSearch } from '../../store/page-search'

const SEARCH_DEBOUNCE_MS = 300

export function GlobalSearch() {
  const navigate = useNavigate()
  const location = useLocation()
  const listId = useId()
  const rootRef = useRef<HTMLFormElement>(null)
  const query = usePageSearch((s) => s.query)
  const setQuery = usePageSearch((s) => s.setQuery)
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const [submitted, setSubmitted] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const result = useQuery({
    queryKey: ['global-search', submitted],
    queryFn: () => searchAdminRecords(submitted),
    enabled: open && submitted.length > 0,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  })

  const groups = result.data?.groups ?? []
  const hits = useMemo(() => groups.flatMap((group) => group.items), [groups])
  const activeHit = hits[activeIndex]

  function runSearch(value: string) {
    const next = value.trim()
    setSubmitted(next)
    setActiveIndex(0)
    setOpen(true)
  }

  function goTo(href: string) {
    setOpen(false)
    navigate(href)
  }

  function goToHit(hit: GlobalSearchHit) {
    goTo(hit.href)
  }

  useEffect(() => {
    const next = query.trim()
    if (!focused) return
    if (!next) {
      setOpen(false)
      setSubmitted('')
      return
    }
    const handle = window.setTimeout(() => runSearch(query), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(handle)
  }, [query, focused])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const next = query.trim()
    if (open && submitted === next && activeHit && !result.isFetching) {
      goToHit(activeHit)
      return
    }
    runSearch(query)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      return
    }
    if (!open || hits.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, hits.length - 1))
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    }
  }

  const showPanel = open
  const emptyTitle = result.data?.failed ? 'Search could not be completed' : 'No results found'
  const emptyBody = result.data?.failed
    ? 'Please try again in a moment.'
    : submitted
      ? `No matches for “${submitted}”. Try a name, phone, email, or ID.`
      : 'Type a name, phone, email, or ID to search.'

  let offset = 0

  return (
    <form ref={rootRef} onSubmit={onSubmit} className="relative mx-auto hidden w-full max-w-xl flex-1 md:block">
      <label className="flex h-11 items-center gap-2.5 rounded-md border border-white/30 px-4 text-xs">
        <button type="submit" aria-label="Search" className="shrink-0 text-white/60 hover:text-white">
          <Search className="size-5" aria-hidden="true" />
        </button>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
          placeholder="Type to search..."
          aria-label="Search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showPanel && activeHit ? `${listId}-${activeHit.id}` : undefined}
          className="w-full bg-transparent text-white outline-none placeholder:text-white/60 [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setSubmitted('')
              setOpen(false)
            }}
            aria-label="Clear search"
            className="rounded p-0.5 text-white/55 hover:text-white"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </label>

      {showPanel ? (
        <div
          id={listId}
          role="listbox"
          aria-label="Search results"
          className="absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-lg border border-black/8 bg-white shadow-[0_12px_32px_rgba(0,0,0,0.18)]"
        >
          {result.isFetching ? (
            <p className="flex items-center gap-2 px-3 py-3 text-xs text-black/55">
              <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
              Searching…
            </p>
          ) : hits.length === 0 ? (
            <div role="status" aria-live="polite" className="flex items-start gap-2.5 px-3 py-3">
              <SearchX className="mt-0.5 size-4 shrink-0 text-black/40" aria-hidden="true" />
              <div>
                <p className="text-xs font-medium text-[#262626]">{emptyTitle}</p>
                <p className="mt-0.5 text-[11px] leading-4 text-black/55">{emptyBody}</p>
              </div>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto py-1">
              {groups.map((group) => {
                const start = offset
                offset += group.items.length
                return (
                  <section key={group.key} className="px-1.5">
                    <div className="flex items-center justify-between px-2 pb-0.5 pt-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-black/40">{group.label}</p>
                      {group.total > group.items.length ? (
                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => goTo(group.viewAllTo)}
                          className="text-[10px] font-medium text-[#009EE8] hover:underline"
                        >
                          View all {group.total}
                        </button>
                      ) : null}
                    </div>
                    <ul>
                      {group.items.map((hit, index) => {
                        const flatIndex = start + index
                        const active = flatIndex === activeIndex
                        return (
                          <li key={`${group.key}-${hit.id}`}>
                            <button
                              id={`${listId}-${hit.id}`}
                              type="button"
                              role="option"
                              aria-selected={active}
                              onMouseEnter={() => setActiveIndex(flatIndex)}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => goToHit(hit)}
                              className={cn(
                                'flex w-full flex-col rounded-md px-2 py-1.5 text-left',
                                active ? 'bg-header/8' : 'hover:bg-black/3',
                              )}
                            >
                              <span className="truncate text-xs font-medium text-[#262626]">{hit.title}</span>
                              {hit.subtitle ? (
                                <span className="truncate text-[11px] text-black/50">{hit.subtitle}</span>
                              ) : null}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </section>
                )
              })}
            </div>
          )}
        </div>
      ) : null}
    </form>
  )
}
