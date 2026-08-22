import type { PaymentRow } from '../../lib/api'
import { countryName, flagEmoji, formatDateTime, formatMoney } from '../../lib/cn'
import { ActionButtons } from './Actions'
import { DataTable } from './DataTable'
import { StatusBadge } from './StatusBadge'

const COLUMNS = [
  'ID',
  'User Name',
  'Contact Details',
  'Member ID',
  'Country',
  'City',
  'Amount',
  'Bank/Wallet',
  'Date/Time',
  'Trans. ID',
  'Status',
  'Action',
]

export function PaymentTable({
  rows,
  onView,
}: {
  rows: PaymentRow[]
  onView: (row: PaymentRow) => void
}) {
  return (
    <DataTable columns={COLUMNS}>
      {rows.map((row) => (
        <tr key={row.id} className="text-slate-700">
          <td className="px-3 py-3">{row.publicId}</td>
          <td className="px-3 py-3 font-medium">{row.userName}</td>
          <td className="px-3 py-3 text-xs leading-5">
            <div>{row.email}</div>
            <div>{row.phone}</div>
          </td>
          <td className="px-3 py-3">{row.memberId}</td>
          <td className="px-3 py-3">
            <span className="inline-flex items-center gap-1">
              <span>{flagEmoji(row.countryCode)}</span>
              {countryName(row.countryCode)}
            </span>
          </td>
          <td className="px-3 py-3">{row.city}</td>
          <td className="px-3 py-3">{formatMoney(row.amountCents).replace('रू ', '')}/-</td>
          <td className="px-3 py-3">{row.method === 'WALLET' ? 'Wallet' : 'Bank'}</td>
          <td className="px-3 py-3 whitespace-nowrap">{formatDateTime(row.date)}</td>
          <td className="px-3 py-3">{row.transId}</td>
          <td className="px-3 py-3">
            <StatusBadge status={row.status} />
          </td>
          <td className="px-3 py-3">
            <ActionButtons onView={() => onView(row)} />
          </td>
        </tr>
      ))}
    </DataTable>
  )
}
