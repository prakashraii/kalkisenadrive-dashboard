import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '../lib/api'
import { withToast } from '../lib/toast'
import { usePageSearch } from '../store/page-search'

const SEARCH_DEBOUNCE_MS = 300

export function useAdminList<T>(key: string, path: string, extra?: Record<string, string>) {
  const headerQuery = usePageSearch((s) => s.query)
  const setHeaderQuery = usePageSearch((s) => s.setQuery)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState(headerQuery)
  const [debouncedSearch, setDebouncedSearch] = useState(headerQuery.trim())
  const [country, setCountry] = useState('')
  const [from, setFrom] = useState('')

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(handle)
  }, [search])

  useEffect(() => {
    if (headerQuery === search) return
    setPage(1)
    setSearch(headerQuery)
  }, [headerQuery, search])

  function setSearchAndReset(value: string) {
    setPage(1)
    setSearch(value)
    setHeaderQuery(value)
  }
  function setCountryAndReset(value: string) {
    setPage(1)
    setCountry(value)
  }
  function setFromAndReset(value: string) {
    setPage(1)
    setFrom(value)
  }

  const params = useMemo(
    () => ({
      page,
      limit: 10,
      search: debouncedSearch || undefined,
      country: country || undefined,
      from: from || undefined,
      ...extra,
    }),
    [page, debouncedSearch, country, from, extra],
  )
  const query = useQuery({
    queryKey: [key, params],
    queryFn: async () => (await api.get<Paginated<T>>(path, { params })).data,
    placeholderData: (previousData, previousQuery) => {
      if (previousQuery?.queryKey[0] !== key) return undefined
      const prev = previousQuery.queryKey[1] as typeof params | undefined
      if (prev?.search !== params.search || prev?.country !== params.country || prev?.from !== params.from) {
        return undefined
      }
      return previousData
    },
  })
  return {
    ...query,
    page,
    setPage,
    search,
    setSearch: setSearchAndReset,
    country,
    setCountry: setCountryAndReset,
    from,
    setFrom: setFromAndReset,
  }
}

export function useAdminMutation(invalidate: string[]) {
  const qc = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (fn: () => Promise<unknown>) => fn(),
    onSuccess: () => {
      for (const k of invalidate) void qc.invalidateQueries({ queryKey: [k] })
    },
  })

  function run<T>(fn: () => Promise<T>, messages: { success: string; error: string }) {
    return withToast(() => mutation.mutateAsync(fn) as Promise<T>, messages)
  }

  return { ...mutation, run }
}
