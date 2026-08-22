import { create } from 'zustand'

export type Admin = {
  id: string
  email: string
  name: string
  role?: string
  avatarUrl?: string | null
}

type AuthState = {
  admin: Admin | null
  setAdmin: (admin: Admin | null) => void
}

export const useAuth = create<AuthState>((set) => ({
  admin: null,
  setAdmin: (admin) => set({ admin }),
}))
