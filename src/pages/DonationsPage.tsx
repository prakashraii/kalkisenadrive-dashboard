import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Coins, UserPlus, Users } from 'lucide-react'
import { api, type PaymentRow } from '../lib/api'
import { useAdminList } from '../viewmodels/useAdminCrud'
import { DonorDetailsForm } from '../components/donations/DonorDetailsForm'
import { MetricCard } from '../components/ui/MetricCard'
import { Pagination } from '../components/ui/Pagination'
import { PaymentTable } from '../components/ui/PaymentTable'
import { TableFrame } from '../components/ui/DataTable'
import { TableToolbar } from '../components/ui/TableToolbar'
import { Tabs } from '../components/ui/Tabs'

type Tab = 'all' | 'dowry' | 'doctor' | 'general'

const TABS: { id: Tab; label: string; type?: 'DOWRY' | 'DOCTOR' | 'GENERAL' }[] = [
  { id: 'all', label: 'All' },
  { id: 'dowry', label: 'Dowry Donation', type: 'DOWRY' },
  { id: 'doctor', label: 'Doctor Donation', type: 'DOCTOR' },
  { id: 'general', label: 'General Donation', type: 'GENERAL' },
]

function tabFromParam(value: string | null): Tab {
  return TABS.some((t) => t.id === value) ? (value as Tab) : 'all'
}

export function DonationsPage() {
  const [params, setParams] = useSearchParams()
  const tab = tabFromParam(params.get('tab'))
  const viewId = params.get('view')
  const isNew = params.get('form') === 'new'
  const type = TABS.find((t) => t.id === tab)?.type
  const extra = useMemo(() => (type ? { type } : undefined), [type])
  const list = useAdminList<PaymentRow>(`donations-${tab}`, '/admin/donations', extra)
  const { data: stats } = useQuery({
    queryKey: ['donation-stats', type],
    queryFn: async () =>
      (await api.get<{ totalCents: number; donorCount: number; totalUsers: number }>('/admin/donations/stats', { params: { type } }))
        .data,
  })

  function changeTab(next: Tab) {
    list.setPage(1)
    setParams({ tab: next })
  }

  if (isNew) {
    return <DonorDetailsForm donationId="new" defaultType={type ?? 'DOWRY'} onClose={() => setParams({ tab })} />
  }

  if (viewId) {
    return <DonorDetailsForm donationId={viewId} onClose={() => setParams({ tab })} />
  }

  return (
    <div className="flex flex-col gap-8">
      <Tabs tabs={TABS} value={tab} onChange={changeTab} />

      <div className="flex flex-wrap gap-4">
        <MetricCard
          title="Total Donation"
          value={stats?.totalCents ?? 0}
          money
          icon={<Coins className="size-6 text-[#FF543E]" />}
        />
        <MetricCard
          title="Total User Donated"
          value={stats?.donorCount ?? 0}
          icon={<UserPlus className="size-6 text-[#009EE8]" />}
        />
        <MetricCard
          title="Total Users"
          value={stats?.totalUsers ?? 0}
          icon={<Users className="size-6 text-[#00A419]" />}
        />
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setParams({ tab, form: 'new' })}
            className="inline-flex h-11 items-center rounded-md bg-[#020B17] px-4 text-sm text-white"
          >
            Record donation
          </button>
        </div>
        <TableToolbar
          search={list.search}
          onSearch={list.setSearch}
          country={list.country}
          onCountry={list.setCountry}
          from={list.from}
          onFrom={list.setFrom}
        />
        <TableFrame>
          <PaymentTable
            hideReason
            rows={list.data?.data ?? []}
            onView={(row) => {
              if (row.donationId) setParams({ tab, view: row.donationId })
            }}
          />
          <Pagination
            page={list.data?.meta.page ?? 1}
            pageCount={list.data?.meta.pageCount ?? 1}
            total={list.data?.meta.total ?? 0}
            limit={10}
            onPage={list.setPage}
          />
        </TableFrame>
      </section>
    </div>
  )
}
