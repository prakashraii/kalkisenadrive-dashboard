import { useState } from 'react'
import { api } from '../lib/api'
import { useAdminList, useAdminMutation } from '../viewmodels/useAdminCrud'
import { DataTable } from '../components/ui/DataTable'
import { Pagination } from '../components/ui/Pagination'
import { TableToolbar } from '../components/ui/TableToolbar'
import { StatusBadge } from '../components/ui/StatusBadge'
import { ActionButtons, Modal } from '../components/ui/Actions'
import { formatMoney } from '../lib/cn'

type Order = {
  id: string
  publicId: string
  region: string
  city?: string | null
  status: string
  userName: string
  transId: string
  amountCents: number
  method: string
  items: { titleSnapshot: string; qty: number }[]
}

export function BookOrdersPage() {
  const list = useAdminList<Order>('book-orders', '/admin/book-orders')
  const mut = useAdminMutation(['book-orders'])
  const [view, setView] = useState<Order | null>(null)

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">Book orders</h2>
      <TableToolbar search={list.search} onSearch={list.setSearch} country={list.country} onCountry={list.setCountry} />
      <DataTable columns={['Order', 'User', 'Items', 'Region', 'Amount', 'Status', 'Action']}>
        {(list.data?.data ?? []).map((o) => (
          <tr key={o.id}>
            <td className="px-3 py-3">{o.publicId}</td>
            <td className="px-3 py-3">{o.userName}</td>
            <td className="px-3 py-3 text-xs">{o.items.map((i) => `${i.titleSnapshot} ×${i.qty}`).join(', ')}</td>
            <td className="px-3 py-3">{o.region === 'INSIDE_VALLEY' ? 'Inside valley' : 'Outside valley'}</td>
            <td className="px-3 py-3">{formatMoney(o.amountCents)}</td>
            <td className="px-3 py-3">
              <StatusBadge status={o.status} />
            </td>
            <td className="px-3 py-3">
              <ActionButtons onView={() => setView(o)} />
            </td>
          </tr>
        ))}
      </DataTable>
      <Pagination page={list.data?.meta.page ?? 1} pageCount={list.data?.meta.pageCount ?? 1} total={list.data?.meta.total ?? 0} limit={10} onPage={list.setPage} />

      <Modal title="Update order" open={!!view} onClose={() => setView(null)}>
        {view && (
          <div className="space-y-3">
            <p className="text-sm">
              {view.publicId} · {view.userName}
            </p>
            <div className="flex flex-wrap gap-2">
              {(['PENDING', 'APPROVED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const).map((s) => (
                <button
                  key={s}
                  className="h-8 rounded-lg border px-3 text-xs"
                  onClick={() => mut.mutateAsync(() => api.patch(`/admin/book-orders/${view.id}`, { status: s })).then(() => setView(null))}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
