import { Plus } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PushNotificationForm } from '../components/notifications/PushNotificationForm'
import { ActionButtons } from '../components/ui/Actions'
import { DataTable, TableFrame } from '../components/ui/DataTable'
import { Pagination } from '../components/ui/Pagination'
import { StatusBadge } from '../components/ui/StatusBadge'
import { TableToolbar } from '../components/ui/TableToolbar'
import { Tabs } from '../components/ui/Tabs'
import { formatDateTime, formatMoney } from '../lib/cn'
import { useAdminList } from '../viewmodels/useAdminCrud'

type Tab = 'all' | 'DONATION' | 'MEMBERSHIP' | 'BOOK_PURCHASE' | 'PUSH'

type NotificationRow = {
  sn: number
  id: string
  type: Exclude<Tab, 'all'>
  title: string
  body: string
  userName: string | null
  amountCents: number | null
  status: string
  createdAt: string
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'DONATION', label: 'Donation' },
  { id: 'MEMBERSHIP', label: 'Membership' },
  { id: 'BOOK_PURCHASE', label: 'Book Purchase' },
  { id: 'PUSH', label: 'Push' },
]

const TYPE_LABEL: Record<Exclude<Tab, 'all'>, string> = {
  DONATION: 'Donation',
  MEMBERSHIP: 'Membership',
  BOOK_PURCHASE: 'Book Purchase',
  PUSH: 'Push',
}

const COLUMNS = ['#', 'Type', 'Title', 'Message', 'User', 'Amount', 'Date', 'Status', 'Action']

const VIEW_PATH: Partial<Record<Exclude<Tab, 'all'>, string>> = {
  DONATION: '/donations',
  MEMBERSHIP: '/memberships',
  BOOK_PURCHASE: '/books/orders',
}

function tabFromParam(value: string | null): Tab {
  return TABS.some((t) => t.id === value) ? (value as Tab) : 'all'
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = tabFromParam(params.get('tab'))
  const extra = useMemo(() => (tab === 'all' ? undefined : { type: tab }), [tab])
  const list = useAdminList<NotificationRow>('admin-notifications', '/admin/notifications', extra)

  if (params.get('form') === 'new') {
    return (
      <div className="-mx-8 -my-8 min-h-full bg-white px-8 py-8">
        <PushNotificationForm />
      </div>
    )
  }

  function changeTab(next: Tab) {
    list.setPage(1)
    setParams(next === 'all' ? {} : { tab: next })
  }

  function openRow(row: NotificationRow) {
    const path = VIEW_PATH[row.type]
    if (path) navigate(`${path}?view=${row.id}`)
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs tabs={TABS} value={tab} onChange={changeTab} />
        <button
          type="button"
          onClick={() => setParams({ form: 'new' })}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-[#020B17] px-4 text-sm text-white"
        >
          <Plus className="size-4" />
          Send Notification
        </button>
      </div>

      <section className="flex flex-col gap-4">
        <TableToolbar search={list.search} onSearch={list.setSearch} from={list.from} onFrom={list.setFrom} />
        <TableFrame>
          <DataTable columns={COLUMNS}>
            {list.isLoading ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-2.5 py-8 text-[#262626]/60">
                  Loading notifications…
                </td>
              </tr>
            ) : (list.data?.data ?? []).length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-2.5 py-8 text-[#262626]/60">
                  No notifications found.
                </td>
              </tr>
            ) : (
              (list.data?.data ?? []).map((row) => (
                <tr key={`${row.type}-${row.id}`} className="text-[#262626]">
                  <td className="px-2.5 py-4">{row.sn}</td>
                  <td className="px-2.5 py-4">{TYPE_LABEL[row.type]}</td>
                  <td className="max-w-[180px] px-2.5 py-4 font-medium">{row.title}</td>
                  <td className="max-w-[220px] truncate px-2.5 py-4 text-[#262626]/70">{row.body}</td>
                  <td className="px-2.5 py-4">{row.userName ?? '—'}</td>
                  <td className="px-2.5 py-4">{row.amountCents != null ? formatMoney(row.amountCents) : '—'}</td>
                  <td className="px-2.5 py-4">{formatDateTime(row.createdAt)}</td>
                  <td className="px-2.5 py-4">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-2.5 py-4">
                    {VIEW_PATH[row.type] ? <ActionButtons onView={() => openRow(row)} /> : '—'}
                  </td>
                </tr>
              ))
            )}
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
