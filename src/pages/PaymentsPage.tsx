import { Landmark, Plus, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { PaymentDetailsForm } from '../components/payments/PaymentDetailsForm'
import { PaymentSettingForm, type BankAccount } from '../components/payments/PaymentSettingForm'
import { WalletSettingForm, type WalletAccount } from '../components/payments/WalletSettingForm'
import { ActionButtons } from '../components/ui/Actions'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { DataTable, TableFrame } from '../components/ui/DataTable'
import { MetricCard } from '../components/ui/MetricCard'
import { Pagination } from '../components/ui/Pagination'
import { PaymentTable } from '../components/ui/PaymentTable'
import { TableToolbar } from '../components/ui/TableToolbar'
import { Tabs } from '../components/ui/Tabs'
import { api, type PaymentRow } from '../lib/api'
import { useAdminList, useAdminMutation } from '../viewmodels/useAdminCrud'

const BANK_COLUMNS = ['Bank', 'Account', 'Number', 'Branch', 'Default', 'Action']
const WALLET_COLUMNS = ['Wallet', 'Details', 'Default', 'Action']
const TABS = [
  { id: 'bank' as const, label: 'Bank' },
  { id: 'wallet' as const, label: 'Wallet' },
]

type Tab = (typeof TABS)[number]['id']
type Summary = {
  balanceCents: number
  totalTransactionCents: number
  bankCents: number
  walletCents: number
}

export function PaymentsPage() {
  const [params, setParams] = useSearchParams()
  const form = params.get('form')
  const viewId = params.get('view')
  const tab: Tab = params.get('tab') === 'wallet' ? 'wallet' : 'bank'
  const extra = useMemo(() => (tab === 'wallet' ? { method: 'WALLET' } : { method: 'BANK' }), [tab])
  const list = useAdminList<PaymentRow>('payments', '/admin/payments', extra)
  const banks = useQuery({
    queryKey: ['banks'],
    queryFn: async () => (await api.get<BankAccount[]>('/admin/bank-accounts')).data,
  })
  const wallets = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => (await api.get<WalletAccount[]>('/admin/wallet-accounts')).data,
  })
  const summary = useQuery({
    queryKey: ['payments-summary'],
    queryFn: async () => (await api.get<Summary>('/admin/payments-summary')).data,
  })
  const mut = useAdminMutation(['payments', 'banks', 'wallets', 'payments-summary'])
  const [delBank, setDelBank] = useState<BankAccount | null>(null)
  const [delWallet, setDelWallet] = useState<WalletAccount | null>(null)

  function setTab(next: Tab) {
    list.setPage(1)
    setParams({ tab: next })
  }

  if (form) {
    if (params.get('type') === 'wallet') {
      return <WalletSettingForm walletId={form} onClose={() => setParams({ tab: 'wallet' })} />
    }
    return <PaymentSettingForm bankId={form} onClose={() => setParams({ tab: 'bank' })} />
  }

  if (viewId) {
    return <PaymentDetailsForm paymentId={viewId} onClose={() => setParams({ tab })} />
  }

  const s = summary.data

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-4">
        <MetricCard title="Balance" value={s?.balanceCents ?? 0} money icon={<Wallet className="size-6 text-[#FF543E]" />} />
        <MetricCard
          title="Total Transaction"
          value={s?.totalTransactionCents ?? 0}
          money
          icon={<Landmark className="size-6 text-[#009EE8]" />}
        />
        <MetricCard title="Bank" value={s?.bankCents ?? 0} money icon={<Landmark className="size-6 text-[#00A419]" />} />
        <MetricCard title="Wallet" value={s?.walletCents ?? 0} money icon={<Wallet className="size-6 text-[#9747FF]" />} />
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs tabs={TABS} value={tab} onChange={setTab} />
          <button
            type="button"
            onClick={() => setParams({ form: 'new', tab, type: tab })}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-[#020B17] px-4 text-sm text-white"
          >
            <Plus className="size-4" />
            {tab === 'wallet' ? 'Add wallet' : 'Add account'}
          </button>
        </div>
        <TableFrame>
          {tab === 'wallet' ? (
            <DataTable columns={WALLET_COLUMNS}>
              {(wallets.data ?? []).map((w) => (
                <tr key={w.id} className="text-[#262626]">
                  <td className="px-2.5 py-4">{w.name}</td>
                  <td className="px-2.5 py-4">{w.details}</td>
                  <td className="px-2.5 py-4">{w.isDefault ? 'Yes' : 'No'}</td>
                  <td className="px-2.5 py-4">
                    <ActionButtons
                      onEdit={() => setParams({ form: w.id, tab: 'wallet', type: 'wallet' })}
                      onDelete={() => setDelWallet(w)}
                    />
                  </td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <DataTable columns={BANK_COLUMNS}>
              {(banks.data ?? []).map((b) => (
                <tr key={b.id} className="text-[#262626]">
                  <td className="px-2.5 py-4">{b.bankName}</td>
                  <td className="px-2.5 py-4">{b.accountName}</td>
                  <td className="px-2.5 py-4">{b.accountNumberMasked}</td>
                  <td className="px-2.5 py-4">{b.branch || '—'}</td>
                  <td className="px-2.5 py-4">{b.isDefault ? 'Yes' : 'No'}</td>
                  <td className="px-2.5 py-4">
                    <ActionButtons onEdit={() => setParams({ form: b.id, tab: 'bank' })} onDelete={() => setDelBank(b)} />
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </TableFrame>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-normal text-black">{tab === 'wallet' ? 'Wallet' : 'Payments'}</h2>
        <TableToolbar search={list.search} onSearch={list.setSearch} />
        <TableFrame>
          <PaymentTable rows={list.data?.data ?? []} onView={(row) => setParams({ view: row.id, tab })} />
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
        open={!!delBank}
        title="Remove account"
        message="Delete this bank account?"
        onClose={() => setDelBank(null)}
        onConfirm={async () => {
          if (!delBank) return
          await mut.mutateAsync(() => api.delete(`/admin/bank-accounts/${delBank.id}`))
          setDelBank(null)
        }}
      />
      <ConfirmDialog
        open={!!delWallet}
        title="Remove wallet"
        message="Delete this wallet account?"
        onClose={() => setDelWallet(null)}
        onConfirm={async () => {
          if (!delWallet) return
          await mut.mutateAsync(() => api.delete(`/admin/wallet-accounts/${delWallet.id}`))
          setDelWallet(null)
        }}
      />
    </div>
  )
}
