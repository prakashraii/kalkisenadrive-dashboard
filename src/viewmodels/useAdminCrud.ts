import { useMemo, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Paginated } from '../lib/api'
import { withToast } from '../lib/toast'

export function useAdminList<T>(key: string, path: string, extra?: Record<string, string>) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [from, setFrom] = useState('')
  const params = useMemo(
    () => ({ page, limit: 10, search: search || undefined, country: country || undefined, from: from || undefined, ...extra }),
    [page, search, country, from, extra],
  )
  const query = useQuery({
    queryKey: [key, params],
    queryFn: async () => (await api.get<Paginated<T>>(path, { params })).data,
    placeholderData: keepPreviousData,
  })
  return { ...query, page, setPage, search, setSearch, country, setCountry, from, setFrom }
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
