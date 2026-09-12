import { api, type Paginated, type PaymentRow } from './api'
import { countryName } from './cn'

export type GlobalSearchHit = {
  id: string
  title: string
  subtitle: string
  href: string
}

export type GlobalSearchGroup = {
  key: string
  label: string
  viewAllTo: string
  total: number
  items: GlobalSearchHit[]
}

export type GlobalSearchResult = {
  groups: GlobalSearchGroup[]
  failed: boolean
}

type UserHit = {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  memberCode?: string | null
}

type DriverHit = {
  id: string
  name: string
  phone?: string | null
  vehicleNumber?: string | null
  city?: string | null
}

type ClinicHit = {
  id: string
  name: string
  city?: string | null
  countryCode?: string | null
}

async function fetchGroup<T>(
  path: string,
  query: string,
  map: (row: T) => GlobalSearchHit,
): Promise<{ items: GlobalSearchHit[]; total: number; ok: boolean }> {
  try {
    const { data } = await api.get<Paginated<T>>(path, {
      params: { search: query, page: 1, limit: 4 },
    })
    return { items: (data.data ?? []).map(map), total: data.meta?.total ?? 0, ok: true }
  } catch {
    return { items: [], total: 0, ok: false }
  }
}

export async function searchAdminRecords(query: string): Promise<GlobalSearchResult> {
  const q = query.trim()
  if (!q) return { groups: [], failed: false }

  const [users, donations, members, drivers, clinics] = await Promise.all([
    fetchGroup<UserHit>('/admin/users', q, (u) => ({
      id: u.id,
      title: u.name || 'Untitled user',
      subtitle: [u.memberCode, u.phone, u.email].filter(Boolean).join(' · '),
      href: `/users?view=${u.id}`,
    })),
    fetchGroup<PaymentRow>('/admin/donations', q, (d) => ({
      id: d.donationId ?? d.id,
      title: d.userName,
      subtitle: [d.type, d.phone].filter(Boolean).join(' · '),
      href: d.donationId ? `/donations?view=${d.donationId}` : '/donations',
    })),
    fetchGroup<PaymentRow>('/admin/memberships', q, (m) => ({
      id: m.id,
      title: m.userName,
      subtitle: [m.plan, m.memberId].filter(Boolean).join(' · '),
      href: `/memberships?view=${m.id}`,
    })),
    fetchGroup<DriverHit>('/admin/drivers', q, (d) => ({
      id: d.id,
      title: d.name,
      subtitle: [d.vehicleNumber, d.phone, d.city].filter(Boolean).join(' · '),
      href: `/drivers?view=${d.id}`,
    })),
    fetchGroup<ClinicHit>('/admin/clinics', q, (c) => ({
      id: c.id,
      title: c.name,
      subtitle: [c.city, countryName(c.countryCode)].filter(Boolean).join(', '),
      href: `/clinics?view=${c.id}`,
    })),
  ])

  const raw = [
    { key: 'users', label: 'Users', viewAllTo: '/users', ...users },
    { key: 'donations', label: 'Donations', viewAllTo: '/donations', ...donations },
    { key: 'members', label: 'Members', viewAllTo: '/memberships', ...members },
    { key: 'drivers', label: 'Drivers', viewAllTo: '/drivers', ...drivers },
    { key: 'clinics', label: 'Clinics', viewAllTo: '/clinics', ...clinics },
  ]

  return {
    groups: raw.filter((group) => group.items.length > 0),
    failed: raw.every((group) => !group.ok),
  }
}
