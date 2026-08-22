import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
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
import { api, type Paginated, type PaymentRow } from '../lib/api'
import { formatMoney } from '../lib/cn'
import { StatCard } from '../components/ui/StatCard'
import { TableToolbar } from '../components/ui/TableToolbar'
import { Pagination } from '../components/ui/Pagination'
import { PaymentTable } from '../components/ui/PaymentTable'
import { Modal } from '../components/ui/Actions'
import { DetailList } from '../components/ui/DetailList'

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
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [donPage, setDonPage] = useState(1)
  const [memPage, setMemPage] = useState(1)
  const [donSearch, setDonSearch] = useState('')
  const [memSearch, setMemSearch] = useState('')
  const [view, setView] = useState<PaymentRow | null>(null)

  const { data } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => (await api.get<Summary>('/admin/dashboard/summary')).data,
  })
  const donated = useQuery({
    queryKey: ['dashboard-donated', donPage, donSearch],
    queryFn: async () =>
      (await api.get<Paginated<PaymentRow>>('/admin/dashboard/donated-users', { params: { page: donPage, limit: 10, search: donSearch || undefined } })).data,
  })
  const members = useQuery({
    queryKey: ['dashboard-members', memPage, memSearch],
    queryFn: async () =>
      (await api.get<Paginated<PaymentRow>>('/admin/dashboard/members', { params: { page: memPage, limit: 10, search: memSearch || undefined } })).data,
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

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Donation" value={k?.totalDonationCents ?? 0} money icon={<Wallet className="size-5" />} tone="violet" />
        <StatCard title="Book Sell Amount" value={k?.bookSellAmountCents ?? 0} money icon={<BookOpen className="size-5" />} tone="blue" />
        <StatCard title="Total Book Order" value={k?.totalBookOrders ?? 0} icon={<ShoppingBag className="size-5" />} tone="teal" />
        <StatCard title="Total Driver Registration" value={k?.totalDriverRegistrations ?? 0} icon={<CarFront className="size-5" />} tone="pink" />
        <StatCard title="Total Clinic Members" value={k?.totalClinicMembers ?? 0} icon={<Users className="size-5" />} tone="orange" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard title="Doctor Donation" value={k?.doctorDonationCents ?? 0} money icon={<Stethoscope className="size-5" />} tone="violet" />
        <StatCard title="Dowry Donation" value={k?.dowryDonationCents ?? 0} money icon={<HeartHandshake className="size-5" />} tone="blue" />
        <StatCard title="Inside Valley Book Sell" value={k?.insideValleyBookSell ?? 0} money icon={<BookOpen className="size-5" />} tone="teal" />
        <StatCard title="Outside Valley Book Sell" value={k?.outsideValleyBookSell ?? 0} money icon={<BookOpen className="size-5" />} tone="pink" />
        <StatCard title="Total Clinic" value={k?.totalClinics ?? 0} icon={<Building2 className="size-5" />} tone="orange" />
        <StatCard title="Total App Users" value={k?.totalAppUsers ?? 0} icon={<Users className="size-5" />} tone="green" />
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

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Donated User List</h2>
        </div>
        <TableToolbar search={donSearch} onSearch={setDonSearch} onViewAll={() => navigate('/donations')} />
        <PaymentTable rows={donated.data?.data ?? []} onView={setView} />
        <Pagination
          page={donated.data?.meta.page ?? 1}
          pageCount={donated.data?.meta.pageCount ?? 1}
          total={donated.data?.meta.total ?? 0}
          limit={donated.data?.meta.limit ?? 10}
          onPage={setDonPage}
        />
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 font-semibold">Member List</h2>
        <TableToolbar search={memSearch} onSearch={setMemSearch} onViewAll={() => navigate('/memberships')} />
        <PaymentTable rows={members.data?.data ?? []} onView={setView} />
        <Pagination
          page={members.data?.meta.page ?? 1}
          pageCount={members.data?.meta.pageCount ?? 1}
          total={members.data?.meta.total ?? 0}
          limit={members.data?.meta.limit ?? 10}
          onPage={setMemPage}
        />
      </section>

      <Modal title="Details" open={!!view} onClose={() => setView(null)}>
        {view && (
          <DetailList
            items={[
              { label: 'User', value: view.userName },
              { label: 'Member ID', value: view.memberId },
              { label: 'Amount', value: formatMoney(view.amountCents) },
              { label: 'Trans. ID', value: view.transId },
              { label: 'Status', value: view.status },
              { label: 'Type', value: view.type ?? view.plan ?? '—' },
            ]}
          />
        )}
      </Modal>
    </div>
  )
}
