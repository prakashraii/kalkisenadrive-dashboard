import { create } from 'zustand'

type PageSearchState = {
  query: string
  setQuery: (query: string) => void
}

export const usePageSearch = create<PageSearchState>((set) => ({
  query: '',
  setQuery: (query) => set({ query }),
}))
