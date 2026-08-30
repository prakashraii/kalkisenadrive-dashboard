import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CarFront, ShieldCheck, UserX } from 'lucide-react'
import { DriverDetailsForm } from '../components/drivers/DriverDetailsForm'
import { ActionButtons } from '../components/ui/Actions'
import { DataTable, TableFrame } from '../components/ui/DataTable'
import { MetricCard } from '../components/ui/MetricCard'
import { Pagination } from '../components/ui/Pagination'
import { StatusBadge } from '../components/ui/StatusBadge'
import { TableToolbar } from '../components/ui/TableToolbar'
import { Tabs } from '../components/ui/Tabs'
import { api } from '../lib/api'
import { countryName, flagEmoji } from '../lib/cn'
import { useAdminList } from '../viewmodels/useAdminCrud'

type ListTab = 'all' | 'accepted' | 'rejected'

type Driver = {
  id: string
  publicId: string
  name: string
  phone: string
  email?: string | null
  city?: string | null
  countryCode?: string
  status: string
  memberCode?: string | null
  user?: { memberCode?: string | null } | null
}

const LIST_TABS: { id: ListTab; label: string; status?: 'APPROVED' | 'REJECTED' }[] = [
  { id: 'all', label: 'All' },
  { id: 'accepted', label: 'Accepted', status: 'APPROVED' },
  { id: 'rejected', label: 'Rejected', status: 'REJECTED' },
]

const COLUMNS = ['ID', 'Driver Name', 'Contact Details', 'Member ID', 'Country', 'City', 'Status', 'Action']

function listTabFromParam(value: string | null): ListTab {
  return LIST_TABS.some((t) => t.id === value) ? (value as ListTab) : 'all'
}

export function DriversPage() {
  const [params, setParams] = useSearchParams()
  const viewId = params.get('view')
  const form = params.get('form')
  const isNew = form === 'new'
  const editId = form && form !== 'new' ? form : null
  const listTab = listTabFromParam(isNew || viewId || editId ? 'all' : params.get('tab'))
  const status = LIST_TABS.find((t) => t.id === listTab)?.status
  const extra = useMemo(() => (status ? { status } : undefined), [status])
  const list = useAdminList<Driver>(`drivers-${listTab}`, '/admin/drivers', extra)
  const { data: stats } = useQuery({
    queryKey: ['driver-stats'],
    queryFn: async () => (await api.get<{ total: number; accepted: number; rejected: number }>('/admin/drivers/stats')).data,
    enabled: !viewId && !isNew && !editId,
  })

  function changeTab(next: ListTab) {
    list.setPage(1)
    setParams({ tab: next })
  }

  if (isNew) {
    return (
      <DriverDetailsForm
        onClose={() => setParams({ tab: 'all' })}
        onCreated={(id) => setParams({ form: id, tab: 'details' })}
      />
    )
  }

  if (editId) {
    return <DriverDetailsForm key={editId} driverId={editId} onClose={() => setParams({ tab: 'all' })} />
  }

  if (viewId) {
    return <DriverDetailsForm key={`view-${viewId}`} driverId={viewId} readOnly onClose={() => setParams({ tab: 'all' })} />
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-4">
        <MetricCard
          title="Total Driver Registered"
          value={stats?.total ?? 0}
          icon={<CarFront className="size-6 text-[#C837AB]" />}
        />
        <MetricCard
          title="Accepted Driver"
          value={stats?.accepted ?? 0}
          icon={<ShieldCheck className="size-6 text-[#34C759]" />}
        />
        <MetricCard title="Rejected" value={stats?.rejected ?? 0} icon={<UserX className="size-6 text-[#FF543E]" />} />
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs tabs={LIST_TABS} value={listTab} onChange={changeTab} />
          <button
            type="button"
            onClick={() => setParams({ form: 'new', tab: 'details' })}
            className="inline-flex h-11 items-center rounded-md bg-[#020B17] px-4 text-sm text-white"
          >
            Add registration
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
          <DataTable columns={COLUMNS}>
            {(list.data?.data ?? []).map((d) => (
              <tr key={d.id} className="text-[#262626]">
                <td className="px-2.5 py-4">{d.publicId}</td>
                <td className="px-2.5 py-4">{d.name}</td>
                <td className="px-2.5 py-4 leading-[15px]">
                  <div>{d.email || '—'}</div>
                  <div>{d.phone}</div>
                </td>
                <td className="px-2.5 py-4">{d.memberCode ?? d.user?.memberCode ?? '—'}</td>
                <td className="px-2.5 py-4">
                  <span className="inline-flex items-center gap-2">
                    <span className="flex size-[18px] items-center justify-center overflow-hidden rounded-full text-[11px] leading-none">
                      {flagEmoji(d.countryCode)}
                    </span>
                    {countryName(d.countryCode)}
                  </span>
                </td>
                <td className="px-2.5 py-4">{d.city || '—'}</td>
                <td className="px-2.5 py-4">
                  <StatusBadge status={d.status} />
                </td>
                <td className="px-2.5 py-4">
                  <ActionButtons
                    onView={() => setParams({ view: d.id, tab: 'details' })}
                    onEdit={() => setParams({ form: d.id, tab: 'details' })}
                  />
                </td>
              </tr>
            ))}
          </DataTable>
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
