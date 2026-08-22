import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { PaymentDetailsForm } from '../components/payments/PaymentDetailsForm'
import { PaymentSettingForm, type BankAccount } from '../components/payments/PaymentSettingForm'
import { ActionButtons } from '../components/ui/Actions'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { DataTable, TableFrame } from '../components/ui/DataTable'
import { Pagination } from '../components/ui/Pagination'
import { PaymentTable } from '../components/ui/PaymentTable'
import { TableToolbar } from '../components/ui/TableToolbar'
import { api, type PaymentRow } from '../lib/api'
import { useAdminList, useAdminMutation } from '../viewmodels/useAdminCrud'

const BANK_COLUMNS = ['Bank', 'Account', 'Number', 'Branch', 'Default', 'Action']

export function PaymentsPage() {
  const [params, setParams] = useSearchParams()
  const form = params.get('form')
  const viewId = params.get('view')
  const list = useAdminList<PaymentRow>('payments', '/admin/payments')
  const banks = useQuery({
    queryKey: ['banks'],
    queryFn: async () => (await api.get<BankAccount[]>('/admin/bank-accounts')).data,
  })
  const mut = useAdminMutation(['payments', 'banks'])
  const [del, setDel] = useState<BankAccount | null>(null)

  if (form) {
    return <PaymentSettingForm bankId={form} onClose={() => setParams({})} />
  }

  if (viewId) {
    return <PaymentDetailsForm paymentId={viewId} onClose={() => setParams({})} />
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-normal text-black">Payment Setting</h2>
          <button
            type="button"
            onClick={() => setParams({ form: 'new' })}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-[#020B17] px-4 text-sm text-white"
          >
            <Plus className="size-4" />
            Add account
          </button>
        </div>
        <TableFrame>
          <DataTable columns={BANK_COLUMNS}>
            {(banks.data ?? []).map((b) => (
              <tr key={b.id} className="text-[#262626]">
                <td className="px-2.5 py-4">{b.bankName}</td>
                <td className="px-2.5 py-4">{b.accountName}</td>
                <td className="px-2.5 py-4">{b.accountNumberMasked}</td>
                <td className="px-2.5 py-4">{b.branch || '—'}</td>
                <td className="px-2.5 py-4">{b.isDefault ? 'Yes' : 'No'}</td>
                <td className="px-2.5 py-4">
                  <ActionButtons onView={() => setParams({ form: b.id })} onDelete={() => setDel(b)} />
                </td>
              </tr>
            ))}
          </DataTable>
        </TableFrame>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-normal text-black">Payments</h2>
        <TableToolbar search={list.search} onSearch={list.setSearch} />
        <TableFrame>
          <PaymentTable rows={list.data?.data ?? []} onView={(row) => setParams({ view: row.id })} />
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
