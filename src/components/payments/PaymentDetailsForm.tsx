import { useQuery } from '@tanstack/react-query'
import { api, type PaymentRow } from '../../lib/api'
import { countryName, formatDate, formatMoney, formatTime } from '../../lib/cn'
import { useAdminMutation } from '../../viewmodels/useAdminCrud'

const fieldClass =
  'h-11 w-full rounded-lg bg-[#E5E5E5] px-4 text-sm text-[#262626] outline-none placeholder:text-[#262626]/70'

const textareaClass =
  'min-h-[168px] w-full resize-none rounded-lg bg-[#E5E5E5] px-4 py-3 text-sm text-[#262626] outline-none placeholder:text-[#262626]/70'

function Field({ value, placeholder }: { value?: string | null; placeholder: string }) {
  return <input readOnly value={value ?? ''} placeholder={placeholder} className={fieldClass} />
}

function statusLabel(status?: string) {
  if (!status) return ''
  return status.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
}

export function PaymentDetailsForm({
  paymentId,
  onClose,
}: {
  paymentId: string
  onClose: () => void
}) {
  const mut = useAdminMutation(['payments', 'banks', 'dashboard-summary'])
  const { data: row } = useQuery({
    queryKey: ['payment', paymentId],
    queryFn: async () => (await api.get<PaymentRow>(`/admin/payments/${paymentId}`)).data,
  })

  const note = [
    row?.transId ? `Trans. ID: ${row.transId}` : '',
    row?.purpose ? `Purpose: ${row.purpose.replaceAll('_', ' ')}` : '',
    row?.note ?? '',
  ]
    .filter(Boolean)
    .join('\n')

  return (
    <div className="-mx-8 -my-8 min-h-full bg-white px-8 py-8">
      <div className="grid max-w-6xl gap-8">
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2">
          <Field value={row?.userName} placeholder="User Name" />
          <Field value={row?.memberId} placeholder="Member ID" />
          <Field value={row?.email} placeholder="Email Address" />
          <Field value={row?.phone} placeholder="Phone Number" />
          <Field value={countryName(row?.countryCode)} placeholder="Country" />
          <Field value={row?.city} placeholder="City" />
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2">
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
            <Field
              value={row ? `${formatMoney(row.amountCents).replace('रू ', '')}/-` : ''}
              placeholder="Amount"
            />
            <Field value={row?.method === 'WALLET' ? 'Wallet' : row ? 'Bank' : ''} placeholder="Bank/Wallet" />
            <Field
              value={row ? `${formatDate(row.date)}  ${formatTime(row.date)}` : ''}
              placeholder="Date/Time"
            />
            <Field value={row?.transId} placeholder="Trans. ID" />
            <Field value={statusLabel(row?.status)} placeholder="Status" />
            <Field value={statusLabel(row?.purpose)} placeholder="Purpose" />
          </div>
          <textarea readOnly value={note} placeholder="Payment details" className={textareaClass} />
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="h-11 rounded-md border border-black/12 px-6 text-sm text-black">
          Back
        </button>
        {row?.status === 'PENDING' && (
          <>
            <button
              type="button"
              className="h-11 rounded-md border border-black/12 px-6 text-sm text-black"
              onClick={() => mut.mutateAsync(() => api.patch(`/admin/payments/${row.id}/reject`)).then(onClose)}
            >
              Reject
            </button>
            <button
              type="button"
              className="h-11 rounded-md bg-[#001E5E] px-6 text-sm font-medium text-white"
              onClick={() => mut.mutateAsync(() => api.patch(`/admin/payments/${row.id}/approve`)).then(onClose)}
            >
              Approve
            </button>
          </>
        )}
      </div>
    </div>
  )
}
