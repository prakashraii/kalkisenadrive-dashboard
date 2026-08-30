import { useSearchParams } from 'react-router-dom'
import { BookOrderDetailsForm } from '../components/books/BookOrderDetailsForm'
import { ActionButtons } from '../components/ui/Actions'
import { DataTable, TableFrame } from '../components/ui/DataTable'
import { Pagination } from '../components/ui/Pagination'
import { StatusBadge } from '../components/ui/StatusBadge'
import { TableToolbar } from '../components/ui/TableToolbar'
import { formatMoney } from '../lib/cn'
import { useAdminList } from '../viewmodels/useAdminCrud'

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

const COLUMNS = ['Order', 'User', 'Items', 'Region', 'Amount', 'Status', 'Action']

export function BookOrdersPage() {
  const [params, setParams] = useSearchParams()
  const viewId = params.get('view')
  const list = useAdminList<Order>('book-orders', '/admin/book-orders')

  if (viewId) {
    return <BookOrderDetailsForm orderId={viewId} onClose={() => setParams({})} />
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-normal text-black">Book Orders</h2>
        <TableToolbar search={list.search} onSearch={list.setSearch} country={list.country} onCountry={list.setCountry} />
        <TableFrame>
          <DataTable columns={COLUMNS}>
            {(list.data?.data ?? []).map((o) => (
              <tr key={o.id} className="text-[#262626]">
                <td className="px-2.5 py-4">{o.publicId}</td>
                <td className="px-2.5 py-4">{o.userName}</td>
                <td className="px-2.5 py-4 text-xs">{o.items.map((i) => `${i.titleSnapshot} ×${i.qty}`).join(', ')}</td>
                <td className="px-2.5 py-4">{o.region === 'INSIDE_VALLEY' ? 'Inside valley' : 'Outside valley'}</td>
                <td className="px-2.5 py-4">{formatMoney(o.amountCents)}</td>
                <td className="px-2.5 py-4">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-2.5 py-4">
                  <ActionButtons onView={() => setParams({ view: o.id })} />
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
