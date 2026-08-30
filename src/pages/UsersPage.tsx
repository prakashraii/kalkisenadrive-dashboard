import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Building2, CarFront, HeartHandshake, Plus, Users } from 'lucide-react'
import { api, type PaymentRow } from '../lib/api'
import { countryName, flagEmoji } from '../lib/cn'
import { ActionButtons } from '../components/ui/Actions'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { DataTable, TableFrame } from '../components/ui/DataTable'
import { MetricCard } from '../components/ui/MetricCard'
import { Pagination } from '../components/ui/Pagination'
import { PaymentTable } from '../components/ui/PaymentTable'
import { StatusBadge } from '../components/ui/StatusBadge'
import { TableToolbar } from '../components/ui/TableToolbar'
import { Tabs } from '../components/ui/Tabs'
import { UserDetailsForm } from '../components/users/UserDetailsForm'
import { useAdminList, useAdminMutation } from '../viewmodels/useAdminCrud'

type Tab = 'all' | 'donations' | 'members' | 'drivers' | 'buyers'

type User = {
  id: string
  publicId: string
  memberCode: string
  name: string
  email?: string | null
  phone: string
  countryCode: string
  city?: string | null
  status: string
}

type Driver = {
  id: string
  publicId: string
  userId?: string | null
  name: string
  phone: string
  licenseNumber: string
  vehicleType: string
  vehicleNumber: string
  city?: string | null
  countryCode?: string
  status: string
}

type Order = {
  id: string
  publicId: string
  userId?: string
  userName: string
  transId: string
  amountCents: number
  method: string
  city?: string | null
  countryCode?: string
  status: string
  items: { titleSnapshot: string; qty: number }[]
}

const TABS: { id: Tab; label: string; path: string }[] = [
  { id: 'all', label: 'All', path: '/admin/users' },
  { id: 'donations', label: 'Donation Users', path: '/admin/donations' },
  { id: 'members', label: 'Members', path: '/admin/memberships' },
  { id: 'drivers', label: 'Drivers', path: '/admin/drivers' },
  { id: 'buyers', label: 'Book Buyers', path: '/admin/book-orders' },
]

const USER_COLUMNS = ['ID', 'User Name', 'Contact Details', 'Member ID', 'Country', 'City', 'Status', 'Action']
const DRIVER_COLUMNS = ['ID', 'User Name', 'Contact Details', 'License', 'Vehicle', 'City', 'Status', 'Action']
const ORDER_COLUMNS = ['ID', 'User Name', 'Items', 'City', 'Amount', 'Bank/Wallet', 'Trans. ID', 'Status', 'Action']

export function UsersPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('donations')
  const path = TABS.find((t) => t.id === tab)!.path
  const list = useAdminList(tab, path)
  const mut = useAdminMutation(['users', 'donations', 'members', 'drivers', 'book-orders', 'dashboard-summary'])
  const [edit, setEdit] = useState<User | 'new' | null>(null)
  const [formMode, setFormMode] = useState<'new' | 'edit' | 'view'>('edit')
  const [del, setDel] = useState<User | null>(null)

  function openForm(next: User | 'new', mode: 'new' | 'edit' | 'view' = next === 'new' ? 'new' : 'edit') {
    setEdit(next)
    setFormMode(mode)
    navigate(mode === 'new' ? '/users?form=new' : `/users?form=${mode}`)
  }

  function openUserView(user: User) {
    openForm(user, 'view')
  }

  function openPaymentUser(row: PaymentRow) {
    if (row.userId) {
      openUserView({
        id: row.userId,
        publicId: row.publicId,
        memberCode: row.memberId,
        name: row.userName,
        email: row.email,
        phone: row.phone,
        countryCode: row.countryCode,
        city: row.city,
        status: row.status,
      })
      return
    }
    if (tab === 'members') {
      navigate(`/memberships?view=${row.id}`)
      return
    }
    if (row.donationId) navigate(`/donations?view=${row.donationId}`)
  }

  function closeForm() {
    setEdit(null)
    setFormMode('edit')
    navigate('/users')
  }

  const { data: summary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => (await api.get('/admin/dashboard/summary')).data as {
      kpis: {
        totalAppUsers: number
        totalBookOrders: number
        totalClinicMembers: number
        totalDriverRegistrations: number
      }
    },
  })
  const { data: donatedTotal } = useQuery({
    queryKey: ['donations-count'],
    queryFn: async () => (await api.get('/admin/donations', { params: { limit: 1 } })).data.meta.total as number,
  })

  function changeTab(next: Tab) {
    setTab(next)
    list.setPage(1)
  }

  const k = summary?.kpis
  const paymentTabs = tab === 'donations' || tab === 'members'

  if (edit) {
    return <UserDetailsForm edit={edit} onClose={closeForm} readOnly={formMode === 'view'} />
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-4">
        <MetricCard
          title="Total Users"
          value={k?.totalAppUsers ?? 0}
          icon={<Users className="size-6 text-[#00A419]" />}
        />
        <MetricCard
          title="Total User Donated"
          value={donatedTotal ?? 0}
          icon={<HeartHandshake className="size-6 text-[#FF543E]" />}
        />
        <MetricCard
          title="Book Buyers"
          value={k?.totalBookOrders ?? 0}
          icon={<BookOpen className="size-6 text-[#9747FF]" />}
        />
        <MetricCard
          title="Clinic Members"
          value={k?.totalClinicMembers ?? 0}
          icon={<Building2 className="size-6 text-[#009EE8]" />}
        />
        <MetricCard
          title="User Register as Driver"
          value={k?.totalDriverRegistrations ?? 0}
          icon={<CarFront className="size-6 text-[#C837AB]" />}
        />
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-normal text-black">User List</h2>
          <button
            type="button"
            onClick={() => openForm('new')}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-[#020B17] px-4 text-sm text-white"
          >
            <Plus className="size-4" />
            Add user
          </button>
        </div>
        <Tabs tabs={TABS} value={tab} onChange={changeTab} />
        <TableToolbar
          search={list.search}
          onSearch={list.setSearch}
          country={list.country}
          onCountry={list.setCountry}
          from={list.from}
          onFrom={list.setFrom}
        />
        <TableFrame>
          {tab === 'all' && (
            <DataTable columns={USER_COLUMNS}>
              {((list.data?.data ?? []) as User[]).map((u) => (
                <tr key={u.id} className="text-[#262626]">
                  <td className="px-2.5 py-4">{u.publicId}</td>
                  <td className="px-2.5 py-4">{u.name}</td>
                  <td className="px-2.5 py-4 leading-[15px]">
                    <div>{u.email}</div>
                    <div>{u.phone}</div>
                  </td>
                  <td className="px-2.5 py-4">{u.memberCode}</td>
                  <td className="px-2.5 py-4">
                    <span className="inline-flex items-center gap-2">
                      <span className="flex size-[18px] items-center justify-center overflow-hidden rounded-full text-[11px] leading-none">
                        {flagEmoji(u.countryCode)}
                      </span>
                      {countryName(u.countryCode)}
                    </span>
                  </td>
                  <td className="px-2.5 py-4">{u.city}</td>
                  <td className="px-2.5 py-4">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="px-2.5 py-4">
                    <ActionButtons onView={() => openUserView(u)} onEdit={() => openForm(u, 'edit')} onDelete={() => setDel(u)} />
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
          {paymentTabs && <PaymentTable rows={(list.data?.data ?? []) as PaymentRow[]} onView={openPaymentUser} />}
          {tab === 'drivers' && (
            <DataTable columns={DRIVER_COLUMNS}>
              {((list.data?.data ?? []) as Driver[]).map((d) => (
                <tr key={d.id} className="text-[#262626]">
                  <td className="px-2.5 py-4">{d.publicId}</td>
                  <td className="px-2.5 py-4">{d.name}</td>
                  <td className="px-2.5 py-4">{d.phone}</td>
                  <td className="px-2.5 py-4">{d.licenseNumber}</td>
                  <td className="px-2.5 py-4">
                    {d.vehicleType} · {d.vehicleNumber}
                  </td>
                  <td className="px-2.5 py-4">{d.city}</td>
                  <td className="px-2.5 py-4">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="px-2.5 py-4">
                    <ActionButtons
                      onView={() =>
                        d.userId
                          ? openUserView({
                              id: d.userId,
                              publicId: d.publicId,
                              memberCode: '',
                              name: d.name,
                              phone: d.phone,
                              countryCode: d.countryCode ?? 'NP',
                              city: d.city,
                              status: d.status,
                            })
                          : navigate(`/drivers?view=${d.id}&tab=details`)
                      }
                    />
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
          {tab === 'buyers' && (
            <DataTable columns={ORDER_COLUMNS}>
              {((list.data?.data ?? []) as Order[]).map((o) => (
                <tr key={o.id} className="text-[#262626]">
                  <td className="px-2.5 py-4">{o.publicId}</td>
                  <td className="px-2.5 py-4">{o.userName}</td>
                  <td className="px-2.5 py-4">{o.items.map((i) => `${i.titleSnapshot} ×${i.qty}`).join(', ')}</td>
                  <td className="px-2.5 py-4">{o.city}</td>
                  <td className="px-2.5 py-4">{(o.amountCents / 100).toLocaleString('en-NP')}/-</td>
                  <td className="px-2.5 py-4">{o.method === 'WALLET' ? 'Wallet' : 'Bank'}</td>
                  <td className="px-2.5 py-4">{o.transId}</td>
                  <td className="px-2.5 py-4">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-2.5 py-4">
                    <ActionButtons
                      onView={() =>
                        o.userId
                          ? openUserView({
                              id: o.userId,
                              publicId: o.publicId,
                              memberCode: '',
                              name: o.userName,
                              phone: '',
                              countryCode: o.countryCode ?? 'NP',
                              city: o.city,
                              status: o.status,
                            })
                          : navigate(`/books/orders?view=${o.id}`)
                      }
                    />
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
          <Pagination
            page={list.data?.meta.page ?? 1}
            pageCount={list.data?.meta.pageCount ?? 1}
            total={list.data?.meta.total ?? 0}
            limit={10}
            onPage={list.setPage}
          />
        </TableFrame>
      </section>

      <ConfirmDialog
        open={!!del}
        title="Delete user"
        message="This cannot be undone."
        onClose={() => setDel(null)}
        pending={mut.isPending}
        onConfirm={async () => {
          if (!del) return
          await mut.mutateAsync(() => api.delete(`/admin/users/${del.id}`))
          setDel(null)
        }}
      />
    </div>
  )
}
