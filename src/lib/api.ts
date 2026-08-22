import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3011/api/v1',
  withCredentials: true,
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original?._retry && !original?.url?.includes('/auth/login')) {
      original._retry = true
      try {
        await api.post('/admin/auth/refresh')
        return api(original)
      } catch {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export type Paginated<T> = {
  data: T[]
  meta: { page: number; limit: number; total: number; pageCount: number }
}

export type PaymentRow = {
  sn: number
  id: string
  publicId: string
  transId: string
  userName: string
  email?: string | null
  phone: string
  memberId: string
  countryCode: string
  city?: string | null
  amountCents: number
  method: string
  status: string
  date: string
  type?: string
  plan?: string
  planCode?: string
  note?: string
  purpose?: string
  userId?: string
  donationId?: string
  startedAt?: string
  expiresAt?: string
  membershipStatus?: string
  durationMonths?: number
}
