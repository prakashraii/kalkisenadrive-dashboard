import type { ReactNode } from 'react'
import type { PaymentRow } from '../../lib/api'
import { countryName, flagEmoji, formatDate, formatMoney, formatTime } from '../../lib/cn'
import { ActionButtons } from './Actions'
import { DataTable } from './DataTable'
import { StatusBadge } from './StatusBadge'

function reasonLabel(row: PaymentRow) {
  const raw = row.note || row.type || row.plan || row.purpose
  if (!raw) return '—'
  return raw.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
}

export function PaymentTable({
  rows,
  onView,
  nameHeader = 'User Name',
  hideReason,
  membershipColumns,
  loading,
  query,
  onClearSearch,
  empty,
}: {
  rows: PaymentRow[]
  onView: (row: PaymentRow) => void
  nameHeader?: string
  hideReason?: boolean
  membershipColumns?: boolean
  loading?: boolean
  query?: string
  onClearSearch?: () => void
  empty?: ReactNode
}) {
  const columns = membershipColumns
    ? [
        'Member ID',
        nameHeader,
        'Contact Details',
        'Country',
        'City',
        'Amount',
        'Bank/Wallet',
        'Date/Time',
        'Trans. ID',
        'Status',
        'Action',
      ]
    : [
        'ID',
        nameHeader,
        'Contact Details',
        'Member ID',
        'Country',
        'City',
        'Amount',
        ...(hideReason ? [] : ['Reason']),
        'Bank/Wallet',
        'Date/Time',
        'Trans. ID',
        'Status',
        'Action',
      ]

  return (
    <DataTable
      columns={columns}
      loading={loading}
      query={query}
      onClearSearch={onClearSearch}
      empty={empty}
    >
      {rows.map((row) => (
        <tr key={row.id} className="text-[#262626]">
          <td className="px-2.5 py-4">{membershipColumns ? row.memberId || row.publicId : row.publicId}</td>
          <td className="px-2.5 py-4">{row.userName}</td>
          <td className="px-2.5 py-4 leading-[15px]">
            <div>{row.email}</div>
            <div>{row.phone}</div>
          </td>
          {!membershipColumns && <td className="px-2.5 py-4">{row.memberId}</td>}
          <td className="px-2.5 py-4">
            <span className="inline-flex items-center gap-2">
              <span className="flex size-[18px] items-center justify-center overflow-hidden rounded-full text-[11px] leading-none">
                {flagEmoji(row.countryCode)}
              </span>
              {countryName(row.countryCode)}
            </span>
          </td>
          <td className="px-2.5 py-4">{row.city}</td>
          <td className="px-2.5 py-4">{formatMoney(row.amountCents).replace('रू ', '')}/-</td>
          {!membershipColumns && !hideReason && <td className="px-2.5 py-4">{reasonLabel(row)}</td>}
          <td className="px-2.5 py-4">{row.method === 'WALLET' ? 'Wallet' : 'Bank'}</td>
          <td className="whitespace-nowrap px-2.5 py-4 leading-[15px]">
            <div>{formatDate(row.date)}</div>
            <div>{formatTime(row.date)}</div>
          </td>
          <td className="px-2.5 py-4">{row.transId}</td>
          <td className="px-2.5 py-4">
            <StatusBadge status={row.status} />
          </td>
          <td className="px-2.5 py-4">
            <ActionButtons onView={() => onView(row)} />
          </td>
        </tr>
      ))}
    </DataTable>
  )
}
