import { useState } from 'react'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { useQuery } from '@tanstack/react-query'
import { api, type Paginated, type PaymentRow } from '../lib/api'
import { useAdminList, useAdminMutation } from '../viewmodels/useAdminCrud'
import { TableToolbar } from '../components/ui/TableToolbar'
import { Pagination } from '../components/ui/Pagination'
import { PaymentTable } from '../components/ui/PaymentTable'
import { Modal } from '../components/ui/Actions'
import { DataTable } from '../components/ui/DataTable'
import { FormActions, FormField, SelectField, TextInput } from '../components/ui/FormField'
import { formatMoney } from '../lib/cn'

type Plan = { id: string; name: string; code: string; priceCents: number; durationMonths: number; isActive: boolean }

export function MembershipsPage() {
  const list = useAdminList<PaymentRow>('memberships', '/admin/memberships')
  const plans = useQuery({ queryKey: ['plans'], queryFn: async () => (await api.get<Plan[]>('/admin/membership-plans')).data })
  const users = useQuery({ queryKey: ['users-mini'], queryFn: async () => (await api.get<Paginated<{ id: string; name: string }>>('/admin/users', { params: { limit: 50 } })).data })
  const mut = useAdminMutation(['memberships', 'plans', 'dashboard-members'])
  const [create, setCreate] = useState(false)
  const [planOpen, setPlanOpen] = useState(false)
  const [view, setView] = useState<PaymentRow | null>(null)

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Membership plans</h2>
          <button onClick={() => setPlanOpen(true)} className="h-9 rounded-lg border px-3 text-sm">
            Add plan
          </button>
        </div>
        <DataTable columns={['Name', 'Code', 'Price', 'Months', 'Active']}>
          {(plans.data ?? []).map((p) => (
            <tr key={p.id}>
              <td className="px-3 py-3">{p.name}</td>
              <td className="px-3 py-3">{p.code}</td>
              <td className="px-3 py-3">{formatMoney(p.priceCents)}</td>
              <td className="px-3 py-3">{p.durationMonths}</td>
              <td className="px-3 py-3">{p.isActive ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </DataTable>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Members</h2>
          <button onClick={() => setCreate(true)} className="h-9 rounded-lg bg-violet-600 px-3 text-sm font-medium text-white">
            Add membership
          </button>
        </div>
        <TableToolbar search={list.search} onSearch={list.setSearch} country={list.country} onCountry={list.setCountry} />
        <PaymentTable rows={list.data?.data ?? []} onView={setView} />
        <Pagination page={list.data?.meta.page ?? 1} pageCount={list.data?.meta.pageCount ?? 1} total={list.data?.meta.total ?? 0} limit={10} onPage={list.setPage} />
      </div>

      <Modal title="Member" open={!!view} onClose={() => setView(null)}>
        {view && (
          <p className="text-sm">
            {view.userName} · {view.plan ?? '—'} · {formatMoney(view.amountCents)}
          </p>
        )}
      </Modal>

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
