import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  BookOpen,
  Building2,
  CarFront,
  HeartHandshake,
  ShoppingBag,
  Stethoscope,
  Users,
  Wallet,
} from 'lucide-react'
import { KeyStatCards } from '../components/dashboard/KeyStatCards'
import { SnapshotList } from '../components/dashboard/SnapshotList'
import { StatCard } from '../components/ui/StatCard'
import { api, type Paginated, type PaymentRow } from '../lib/api'
import { countryName, formatDate, formatMoney } from '../lib/cn'

const COLORS = ['#60a5fa', '#f9a8d4', '#a78bfa']

type Summary = {
  kpis: {
    totalDonationCents: number
    bookSellAmountCents: number
    totalBookOrders: number
    totalDriverRegistrations: number
    totalClinicMembers: number
    doctorDonationCents: number
    dowryDonationCents: number
    insideValleyBookSell: number
    outsideValleyBookSell: number
    totalClinics: number
    totalAppUsers: number
  }
  donationAnalytics: { months: string[]; years: number[]; series: { year: number; data: number[] }[] }
  bookSellAnalytics: { months: string[]; years: number[]; series: { year: number; data: number[] }[] }
  membershipAnalytics: { name: string; count: number }[]
  overview?: {
    donatedUsers: { value: number; trendPct: number }
    members: { value: number; trendPct: number }
    clinics: { value: number; trendPct: number }
    drivers: { value: number; trendPct: number }
  }
}

type ClinicRow = {
  id: string
  name: string
  city: string
  countryCode: string
  status: string
  memberCount?: number
}

type DriverRow = {
  id: string
  name: string
  city?: string | null
  status: string
  vehicleType?: string | null
  vehicleNumber?: string | null
}

const listParams = { page: 1, limit: 5 }

export function DashboardPage() {
  const { data } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => (await api.get<Summary>('/admin/dashboard/summary')).data,
  })
  const donated = useQuery({
    queryKey: ['dashboard-donated'],
    queryFn: async () =>
      (await api.get<Paginated<PaymentRow>>('/admin/dashboard/donated-users', { params: listParams })).data,
  })
  const members = useQuery({
    queryKey: ['dashboard-members'],
    queryFn: async () =>
      (await api.get<Paginated<PaymentRow>>('/admin/memberships', { params: listParams })).data,
  })
  const clinics = useQuery({
    queryKey: ['dashboard-clinics'],
    queryFn: async () => (await api.get<Paginated<ClinicRow>>('/admin/clinics', { params: listParams })).data,
  })
  const drivers = useQuery({
    queryKey: ['dashboard-drivers'],
    queryFn: async () => (await api.get<Paginated<DriverRow>>('/admin/drivers', { params: listParams })).data,
  })

  const k = data?.kpis
  const barData =
    data?.donationAnalytics.months.map((month, i) => {
      const row: Record<string, string | number> = { month }
      data.donationAnalytics.series.forEach((s) => {
        row[String(s.year)] = s.data[i]
      })
      return row
    }) ?? []
  const lineData =
    data?.bookSellAnalytics.months.map((month, i) => {
      const row: Record<string, string | number> = { month }
      data.bookSellAnalytics.series.forEach((s) => {
        row[String(s.year)] = s.data[i]
      })
      return row
    }) ?? []

  const overview = data?.overview

  return (
    <div className="space-y-5">
      <KeyStatCards
        donatedUsers={{
          value: overview?.donatedUsers.value ?? donated.data?.meta.total ?? 0,
          trend: overview?.donatedUsers.trendPct,
        }}
        members={{
          value: overview?.members.value ?? members.data?.meta.total ?? 0,
          trend: overview?.members.trendPct,
        }}
        clinics={{
          value: overview?.clinics.value ?? clinics.data?.meta.total ?? k?.totalClinics ?? 0,
          trend: overview?.clinics.trendPct,
        }}
        drivers={{
          value: overview?.drivers.value ?? drivers.data?.meta.total ?? k?.totalDriverRegistrations ?? 0,
          trend: overview?.drivers.trendPct,
        }}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Donation" value={k?.totalDonationCents ?? 0} money icon={<Wallet className="size-4" />} tone="violet" />
        <StatCard title="Book Sell Amount" value={k?.bookSellAmountCents ?? 0} money icon={<BookOpen className="size-4" />} tone="blue" />
        <StatCard title="Total Book Order" value={k?.totalBookOrders ?? 0} icon={<ShoppingBag className="size-4" />} tone="teal" />
        <StatCard title="Total Driver Registration" value={k?.totalDriverRegistrations ?? 0} icon={<CarFront className="size-4" />} tone="pink" />
        <StatCard title="Total Clinic Members" value={k?.totalClinicMembers ?? 0} icon={<Users className="size-4" />} tone="orange" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard title="Doctor Donation" value={k?.doctorDonationCents ?? 0} money icon={<Stethoscope className="size-4" />} tone="violet" />
        <StatCard title="Dowry Donation" value={k?.dowryDonationCents ?? 0} money icon={<HeartHandshake className="size-4" />} tone="blue" />
        <StatCard title="Inside Valley Book Sell" value={k?.insideValleyBookSell ?? 0} money icon={<BookOpen className="size-4" />} tone="teal" />
        <StatCard title="Outside Valley Book Sell" value={k?.outsideValleyBookSell ?? 0} money icon={<BookOpen className="size-4" />} tone="pink" />
        <StatCard title="Total Clinic" value={k?.totalClinics ?? 0} icon={<Building2 className="size-4" />} tone="orange" />
        <StatCard title="Total App Users" value={k?.totalAppUsers ?? 0} icon={<Users className="size-4" />} tone="green" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Donation Analytics</h2>
            <select className="h-8 rounded-lg border border-slate-200 px-2 text-xs">
              <option>This Month</option>
            </select>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                {data?.donationAnalytics.series.map((s, i) => (
                  <Bar key={s.year} dataKey={String(s.year)} fill={COLORS[i]} radius={[3, 3, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-semibold">Book Sell Analytics</h2>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <XAxis dataKey="month" hide />
                  <Tooltip />
                  {data?.bookSellAnalytics.series.map((s, i) => (
                    <Line key={s.year} type="monotone" dataKey={String(s.year)} stroke={COLORS[i]} dot={false} strokeWidth={2} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-semibold">Membership Analytics</h2>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data?.membershipAnalytics ?? []} dataKey="count" nameKey="name" innerRadius={40} outerRadius={70}>
                    {(data?.membershipAnalytics ?? []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SnapshotList
          title="Donated Users"
          icon={<HeartHandshake className="size-5" />}
          tone="violet"
          total={donated.data?.meta.total}
          viewAllTo="/donations"
          emptyText="No recent donations yet."
          loading={donated.isLoading}
          items={(donated.data?.data ?? []).map((row) => ({
            id: row.donationId ?? row.id,
            name: row.userName,
            chip: row.type,
            secondary: formatDate(row.date),
            highlight: formatMoney(row.amountCents),
            status: row.status,
            href: row.donationId ? `/donations?view=${row.donationId}` : '/donations',
          }))}
        />
        <SnapshotList
          title="Members"
          icon={<Users className="size-5" />}
          tone="blue"
          total={members.data?.meta.total}
          viewAllTo="/memberships"
          emptyText="No members yet."
          loading={members.isLoading}
          items={(members.data?.data ?? []).map((row) => ({
            id: row.id,
            name: row.userName,
            secondary: [row.memberId, row.plan].filter(Boolean).join(' · '),
            highlight: row.expiresAt ? `Exp ${formatDate(row.expiresAt)}` : undefined,
            status: row.membershipStatus ?? row.status,
            href: `/memberships?view=${row.id}`,
          }))}
        />
        <SnapshotList
          title="Clinics"
          icon={<Building2 className="size-5" />}
          tone="orange"
          total={clinics.data?.meta.total ?? k?.totalClinics}
          viewAllTo="/clinics"
          emptyText="No clinics yet."
          loading={clinics.isLoading}
          items={(clinics.data?.data ?? []).map((row) => ({
            id: row.id,
            name: row.name,
            secondary: [row.city, countryName(row.countryCode)].filter(Boolean).join(', '),
            highlight: `${row.memberCount ?? 0} members`,
            status: row.status,
            href: `/clinics?view=${row.id}`,
          }))}
        />
        <SnapshotList
          title="Drivers"
          icon={<CarFront className="size-5" />}
          tone="pink"
          total={drivers.data?.meta.total ?? k?.totalDriverRegistrations}
          viewAllTo="/drivers"
          emptyText="No driver registrations yet."
          loading={drivers.isLoading}
          items={(drivers.data?.data ?? []).map((row) => ({
            id: row.id,
            name: row.name,
            secondary: [vehicleLabel(row), row.city].filter(Boolean).join(' · '),
            status: row.status,
            href: `/drivers?view=${row.id}`,
          }))}
        />
      </div>
    </div>
  )
}

function vehicleLabel(row: DriverRow) {
  const parts = [row.vehicleType, row.vehicleNumber].filter(Boolean)
  return parts.length ? parts.join(' ') : ''
}
