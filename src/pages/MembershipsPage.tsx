import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { useQuery } from '@tanstack/react-query'
import { Coins, UserPlus, Users } from 'lucide-react'
import { api, type Paginated, type PaymentRow } from '../lib/api'
import { useAdminList, useAdminMutation } from '../viewmodels/useAdminCrud'
import { MemberDetailsForm } from '../components/memberships/MemberDetailsForm'
import { MetricCard } from '../components/ui/MetricCard'
import { Modal } from '../components/ui/Actions'
import { Pagination } from '../components/ui/Pagination'
import { PaymentTable } from '../components/ui/PaymentTable'
import { TableFrame } from '../components/ui/DataTable'
import { TableToolbar } from '../components/ui/TableToolbar'
import { FormActions, FormField, SelectField, TextInput } from '../components/ui/FormField'

type Plan = { id: string; name: string; code: string; priceCents: number; durationMonths: number; isActive: boolean }

export function MembershipsPage() {
  const [params, setParams] = useSearchParams()
  const viewId = params.get('view')
  const list = useAdminList<PaymentRow>('memberships', '/admin/memberships')
  const plans = useQuery({ queryKey: ['plans'], queryFn: async () => (await api.get<Plan[]>('/admin/membership-plans')).data })
  const users = useQuery({
    queryKey: ['users-mini'],
    queryFn: async () => (await api.get<Paginated<{ id: string; name: string }>>('/admin/users', { params: { limit: 50 } })).data,
  })
  const { data: stats } = useQuery({
    queryKey: ['membership-stats'],
    queryFn: async () =>
      (await api.get<{ totalCents: number; memberCount: number; totalUsers: number }>('/admin/memberships/stats')).data,
  })
  const mut = useAdminMutation(['memberships', 'plans', 'dashboard-members', 'membership-stats'])
  const [create, setCreate] = useState(false)
  const [planOpen, setPlanOpen] = useState(false)

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
            onClick={() => setPlanOpen(true)}
            className="inline-flex h-11 items-center rounded-md border border-black/12 bg-white px-4 text-sm text-black"
          >
            Add plan
          </button>
          <button
            type="button"
            onClick={() => setCreate(true)}
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

      <Modal title="Add membership" open={create} onClose={() => setCreate(false)}>
        <Formik
          initialValues={{ userId: '', planId: '', method: 'BANK' }}
          validationSchema={Yup.object({ userId: Yup.string().required(), planId: Yup.string().required() })}
          onSubmit={async (values) => {
            await mut.mutateAsync(() => api.post('/admin/memberships', values))
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
              <SelectField label="Plan" name="planId" value={fk.values.planId} onChange={fk.handleChange} required>
                <option value="">Select</option>
                {(plans.data ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Method" name="method" value={fk.values.method} onChange={fk.handleChange}>
                <option value="BANK">Bank</option>
                <option value="WALLET">Wallet</option>
              </SelectField>
              <FormActions onCancel={() => setCreate(false)} pending={fk.isSubmitting} />
            </form>
          )}
        </Formik>
      </Modal>

      <Modal title="Add plan" open={planOpen} onClose={() => setPlanOpen(false)}>
        <Formik
          initialValues={{ name: '', code: '', priceCents: 1500000, durationMonths: 12, isActive: true }}
          validationSchema={Yup.object({ name: Yup.string().required(), code: Yup.string().required() })}
          onSubmit={async (values) => {
            await mut.mutateAsync(() => api.post('/admin/membership-plans', values))
            setPlanOpen(false)
          }}
        >
          {(fk) => (
            <form onSubmit={fk.handleSubmit} className="space-y-3">
              <FormField label="Name" required>
                <TextInput name="name" value={fk.values.name} onChange={fk.handleChange} />
              </FormField>
              <FormField label="Code" required>
                <TextInput name="code" value={fk.values.code} onChange={fk.handleChange} />
              </FormField>
              <FormField label="Price (paisa)">
                <TextInput type="number" name="priceCents" value={fk.values.priceCents} onChange={fk.handleChange} />
              </FormField>
              <FormField label="Duration (months)">
                <TextInput type="number" name="durationMonths" value={fk.values.durationMonths} onChange={fk.handleChange} />
              </FormField>
              <FormActions onCancel={() => setPlanOpen(false)} pending={fk.isSubmitting} />
            </form>
          )}
        </Formik>
      </Modal>
    </div>
  )
}
