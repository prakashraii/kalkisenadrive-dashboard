import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Coins, UserPlus, Users } from 'lucide-react'
import { api, type PaymentRow } from '../lib/api'
import { useAdminList } from '../viewmodels/useAdminCrud'
import { MemberDetailsForm } from '../components/memberships/MemberDetailsForm'
import { PlanDetailsForm } from '../components/memberships/PlanDetailsForm'
import { MetricCard } from '../components/ui/MetricCard'
import { Pagination } from '../components/ui/Pagination'
import { PaymentTable } from '../components/ui/PaymentTable'
import { TableFrame } from '../components/ui/DataTable'
import { TableToolbar } from '../components/ui/TableToolbar'

export function MembershipsPage() {
  const [params, setParams] = useSearchParams()
  const viewId = params.get('view')
  const form = params.get('form')
  const list = useAdminList<PaymentRow>('memberships', '/admin/memberships')
  const { data: stats } = useQuery({
    queryKey: ['membership-stats'],
    queryFn: async () =>
      (await api.get<{ totalCents: number; memberCount: number; totalUsers: number }>('/admin/memberships/stats')).data,
  })

  if (form === 'plan') {
    return <PlanDetailsForm onClose={() => setParams({})} />
  }

  if (form === 'new') {
    return <MemberDetailsForm membershipId="new" onClose={() => setParams({})} />
  }

  if (viewId) {
    return <MemberDetailsForm membershipId={viewId} onClose={() => setParams({})} />
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-4">
        <MetricCard
          title="Total Membership Amount"
          value={stats?.totalCents ?? 0}
          money
          icon={<Coins className="size-6 text-[#FF543E]" />}
        />
        <MetricCard
          title="Total Members"
          value={stats?.memberCount ?? 0}
          icon={<UserPlus className="size-6 text-[#009EE8]" />}
        />
        <MetricCard
          title="Total Users"
          value={stats?.totalUsers ?? 0}
          icon={<Users className="size-6 text-[#00A419]" />}
        />
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setParams({ form: 'plan' })}
            className="inline-flex h-11 items-center rounded-md border border-black/12 bg-white px-4 text-sm text-black"
          >
            Add plan
          </button>
          <button
            type="button"
            onClick={() => setParams({ form: 'new' })}
            className="inline-flex h-11 items-center rounded-md bg-[#020B17] px-4 text-sm text-white"
          >
            Add membership
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
            membershipColumns
            rows={list.data?.data ?? []}
            onView={(row) => setParams({ view: row.id })}
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
