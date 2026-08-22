import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { useQuery } from '@tanstack/react-query'
import { Coins, UserPlus, Users } from 'lucide-react'
import { api, type Paginated, type PaymentRow } from '../lib/api'
import { useAdminList, useAdminMutation } from '../viewmodels/useAdminCrud'
import { DonorDetailsForm } from '../components/donations/DonorDetailsForm'
import { MetricCard } from '../components/ui/MetricCard'
import { Modal } from '../components/ui/Actions'
import { Pagination } from '../components/ui/Pagination'
import { PaymentTable } from '../components/ui/PaymentTable'
import { TableFrame } from '../components/ui/DataTable'
import { TableToolbar } from '../components/ui/TableToolbar'
import { Tabs } from '../components/ui/Tabs'
import { FormActions, FormField, SelectField, TextInput } from '../components/ui/FormField'

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

const schema = Yup.object({
  userId: Yup.string().required('Required'),
  type: Yup.string().required(),
  amountCents: Yup.number().min(1).required(),
  method: Yup.string().required(),
})

export function DonationsPage() {
  const [params, setParams] = useSearchParams()
  const tab = tabFromParam(params.get('tab'))
  const viewId = params.get('view')
  const type = TABS.find((t) => t.id === tab)?.type
  const extra = useMemo(() => (type ? { type } : {}), [type])
  const list = useAdminList<PaymentRow>(`donations-${tab}`, '/admin/donations', extra)
  const mut = useAdminMutation(['donations', 'donation-stats', 'dashboard-summary', 'dashboard-donated'])
  const users = useQuery({
    queryKey: ['users-mini'],
    queryFn: async () => (await api.get<Paginated<{ id: string; name: string }>>('/admin/users', { params: { limit: 50 } })).data,
  })
  const { data: stats } = useQuery({
    queryKey: ['donation-stats', type],
    queryFn: async () =>
      (await api.get<{ totalCents: number; donorCount: number; totalUsers: number }>('/admin/donations/stats', { params: { type } }))
        .data,
  })
  const [create, setCreate] = useState(false)

  function changeTab(next: Tab) {
    list.setPage(1)
    setParams({ tab: next })
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
            onClick={() => setCreate(true)}
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

      <Modal title="Record donation" open={create} onClose={() => setCreate(false)}>
        <Formik
          initialValues={{ userId: '', type: type ?? 'DOWRY', amountCents: 15000, method: 'BANK', note: '' }}
          enableReinitialize
          validationSchema={schema}
          onSubmit={async (values) => {
            await mut.mutateAsync(() => api.post('/admin/donations', values))
            setCreate(false)
          }}
        >
          {(fk) => (
            <form onSubmit={fk.handleSubmit} className="space-y-3">
              <SelectField label="User" name="userId" value={fk.values.userId} onChange={fk.handleChange} required>
                <option value="">Select</option>
                {(users.data?.data ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Type" name="type" value={fk.values.type} onChange={fk.handleChange}>
                <option value="DOWRY">Dowry</option>
                <option value="DOCTOR">Doctor</option>
                <option value="GENERAL">General</option>
              </SelectField>
              <FormField label="Amount (paisa)" required>
                <TextInput type="number" name="amountCents" value={fk.values.amountCents} onChange={fk.handleChange} />
              </FormField>
              <SelectField label="Method" name="method" value={fk.values.method} onChange={fk.handleChange}>
                <option value="BANK">Bank</option>
                <option value="WALLET">Wallet</option>
              </SelectField>
              <FormActions onCancel={() => setCreate(false)} pending={fk.isSubmitting} />
            </form>
          )}
        </Formik>
      </Modal>
    </div>
  )
}
