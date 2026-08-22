import { useState } from 'react'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { api, type Paginated, type PaymentRow } from '../lib/api'
import { useAdminList, useAdminMutation } from '../viewmodels/useAdminCrud'
import { TableToolbar } from '../components/ui/TableToolbar'
import { Pagination } from '../components/ui/Pagination'
import { PaymentTable } from '../components/ui/PaymentTable'
import { Modal } from '../components/ui/Actions'
import { DetailList } from '../components/ui/DetailList'
import { FormActions, FormField, SelectField, TextInput } from '../components/ui/FormField'
import { formatMoney } from '../lib/cn'
import { useQuery } from '@tanstack/react-query'

const schema = Yup.object({
  userId: Yup.string().required('Required'),
  type: Yup.string().required(),
  amountCents: Yup.number().min(1).required(),
  method: Yup.string().required(),
})

export function DonationsPage() {
  const list = useAdminList<PaymentRow>('donations', '/admin/donations')
  const mut = useAdminMutation(['donations', 'dashboard-summary', 'dashboard-donated'])
  const users = useQuery({ queryKey: ['users-mini'], queryFn: async () => (await api.get<Paginated<{ id: string; name: string }>>('/admin/users', { params: { limit: 50 } })).data })
  const [view, setView] = useState<PaymentRow | null>(null)
  const [create, setCreate] = useState(false)

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Donations</h2>
        <button onClick={() => setCreate(true)} className="h-9 rounded-lg bg-violet-600 px-3 text-sm font-medium text-white">
          Record donation
        </button>
      </div>
      <TableToolbar search={list.search} onSearch={list.setSearch} country={list.country} onCountry={list.setCountry} from={list.from} onFrom={list.setFrom} />
      <PaymentTable rows={list.data?.data ?? []} onView={setView} />
      <Pagination page={list.data?.meta.page ?? 1} pageCount={list.data?.meta.pageCount ?? 1} total={list.data?.meta.total ?? 0} limit={10} onPage={list.setPage} />

      <Modal title="Donation" open={!!view} onClose={() => setView(null)}>
        {view && (
          <div className="space-y-3">
            <DetailList
              items={[
                { label: 'User', value: view.userName },
                { label: 'Type', value: view.type },
                { label: 'Amount', value: formatMoney(view.amountCents) },
                { label: 'Trans. ID', value: view.transId },
                { label: 'Status', value: view.status },
              ]}
            />
            {view.status === 'PENDING' && view.donationId && (
              <div className="flex justify-end gap-2">
                <button
                  className="h-9 rounded-lg border px-3 text-sm"
                  onClick={() => mut.mutateAsync(() => api.patch(`/admin/donations/${view.donationId}/reject`)).then(() => setView(null))}
                >
                  Reject
                </button>
                <button
                  className="h-9 rounded-lg bg-emerald-600 px-3 text-sm text-white"
                  onClick={() => mut.mutateAsync(() => api.patch(`/admin/donations/${view.donationId}/approve`)).then(() => setView(null))}
                >
                  Approve
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal title="Record donation" open={create} onClose={() => setCreate(false)}>
        <Formik
          initialValues={{ userId: '', type: 'GENERAL', amountCents: 15000, method: 'BANK', note: '' }}
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
                <option value="DOCTOR">Doctor</option>
                <option value="DOWRY">Dowry</option>
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
