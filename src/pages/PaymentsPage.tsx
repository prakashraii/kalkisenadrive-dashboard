import { useState } from 'react'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { useQuery } from '@tanstack/react-query'
import { api, type PaymentRow } from '../lib/api'
import { useAdminList, useAdminMutation } from '../viewmodels/useAdminCrud'
import { TableToolbar } from '../components/ui/TableToolbar'
import { Pagination } from '../components/ui/Pagination'
import { PaymentTable } from '../components/ui/PaymentTable'
import { DataTable } from '../components/ui/DataTable'
import { ActionButtons, Modal } from '../components/ui/Actions'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { FormActions, FormField, TextInput } from '../components/ui/FormField'
import { formatMoney } from '../lib/cn'

type Bank = {
  id: string
  bankName: string
  accountName: string
  accountNumberMasked: string
  branch?: string | null
  isDefault: boolean
}

export function PaymentsPage() {
  const list = useAdminList<PaymentRow>('payments', '/admin/payments')
  const banks = useQuery({ queryKey: ['banks'], queryFn: async () => (await api.get<Bank[]>('/admin/bank-accounts')).data })
  const mut = useAdminMutation(['payments', 'banks'])
  const [view, setView] = useState<PaymentRow | null>(null)
  const [bankOpen, setBankOpen] = useState(false)
  const [del, setDel] = useState<Bank | null>(null)

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Bank accounts</h2>
          <button onClick={() => setBankOpen(true)} className="h-9 rounded-lg border px-3 text-sm">
            Add account
          </button>
        </div>
        <DataTable columns={['Bank', 'Account', 'Number', 'Branch', 'Default', 'Action']}>
          {(banks.data ?? []).map((b) => (
            <tr key={b.id}>
              <td className="px-3 py-3">{b.bankName}</td>
              <td className="px-3 py-3">{b.accountName}</td>
              <td className="px-3 py-3">{b.accountNumberMasked}</td>
              <td className="px-3 py-3">{b.branch}</td>
              <td className="px-3 py-3">{b.isDefault ? 'Yes' : 'No'}</td>
              <td className="px-3 py-3">
                <ActionButtons onDelete={() => setDel(b)} />
              </td>
            </tr>
          ))}
        </DataTable>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">Payments</h2>
        <TableToolbar search={list.search} onSearch={list.setSearch} />
        <PaymentTable rows={list.data?.data ?? []} onView={setView} />
        <Pagination page={list.data?.meta.page ?? 1} pageCount={list.data?.meta.pageCount ?? 1} total={list.data?.meta.total ?? 0} limit={10} onPage={list.setPage} />
      </div>

      <Modal title="Payment" open={!!view} onClose={() => setView(null)}>
        {view && (
          <div className="space-y-3">
            <p className="text-sm">
              {view.transId} · {formatMoney(view.amountCents)} · {view.status}
            </p>
            {view.status === 'PENDING' && (
              <div className="flex justify-end gap-2">
                <button className="h-9 rounded-lg border px-3 text-sm" onClick={() => mut.mutateAsync(() => api.patch(`/admin/payments/${view.id}/reject`)).then(() => setView(null))}>
                  Reject
                </button>
                <button className="h-9 rounded-lg bg-emerald-600 px-3 text-sm text-white" onClick={() => mut.mutateAsync(() => api.patch(`/admin/payments/${view.id}/approve`)).then(() => setView(null))}>
                  Approve
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal title="Add bank account" open={bankOpen} onClose={() => setBankOpen(false)}>
        <Formik
          initialValues={{ bankName: '', accountName: 'Kalki Sena Drive', accountNumberMasked: '', branch: '', isDefault: false }}
          validationSchema={Yup.object({ bankName: Yup.string().required(), accountName: Yup.string().required(), accountNumberMasked: Yup.string().required() })}
          onSubmit={async (values) => {
            await mut.mutateAsync(() => api.post('/admin/bank-accounts', values))
            setBankOpen(false)
          }}
        >
          {(fk) => (
            <form onSubmit={fk.handleSubmit} className="space-y-3">
              <FormField label="Bank" required>
                <TextInput name="bankName" value={fk.values.bankName} onChange={fk.handleChange} />
              </FormField>
              <FormField label="Account name" required>
                <TextInput name="accountName" value={fk.values.accountName} onChange={fk.handleChange} />
              </FormField>
              <FormField label="Masked number" required>
                <TextInput name="accountNumberMasked" value={fk.values.accountNumberMasked} onChange={fk.handleChange} />
              </FormField>
              <FormField label="Branch">
                <TextInput name="branch" value={fk.values.branch} onChange={fk.handleChange} />
              </FormField>
              <FormActions onCancel={() => setBankOpen(false)} pending={fk.isSubmitting} />
            </form>
          )}
        </Formik>
      </Modal>
      <ConfirmDialog
        open={!!del}
        title="Remove account"
        message="Delete this bank account?"
        onClose={() => setDel(null)}
        onConfirm={async () => {
          if (!del) return
          await mut.mutateAsync(() => api.delete(`/admin/bank-accounts/${del.id}`))
          setDel(null)
        }}
      />
    </div>
  )
}
