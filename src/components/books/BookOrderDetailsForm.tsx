import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { countryName, formatDate, formatMoney, formatTime } from '../../lib/cn'
import { useAdminMutation } from '../../viewmodels/useAdminCrud'
import { ConfirmDialog } from '../ui/ConfirmDialog'

const fieldClass =
  'h-11 w-full rounded-lg bg-[#E5E5E5] px-4 text-sm text-[#262626] outline-none placeholder:text-[#262626]/70'

const textareaClass =
  'min-h-[168px] w-full resize-none rounded-lg bg-[#E5E5E5] px-4 py-3 text-sm text-[#262626] outline-none placeholder:text-[#262626]/70'

const STATUSES = ['PENDING', 'APPROVED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const

type OrderStatus = (typeof STATUSES)[number]

export type BookOrderDetails = {
  id: string
  publicId: string
  region: string
  city?: string | null
  countryCode?: string
  status: string
  userId?: string
  userName: string
  memberId?: string
  email?: string | null
  phone?: string | null
  transId: string
  amountCents: number
  method: string
  items: { titleSnapshot: string; qty: number }[]
  createdAt?: string
}

function Field({ value, placeholder }: { value?: string | null; placeholder: string }) {
  return <input readOnly value={value ?? ''} placeholder={placeholder} className={fieldClass} />
}

function statusLabel(status?: string) {
  if (!status) return ''
  return status.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
}

export function BookOrderDetailsForm({
  orderId,
  onClose,
}: {
  orderId: string
  onClose: () => void
}) {
  const mut = useAdminMutation(['book-orders', 'book-order'])
  const [cancelOpen, setCancelOpen] = useState(false)
  const { data: row } = useQuery({
    queryKey: ['book-order', orderId],
    queryFn: async () => (await api.get<BookOrderDetails>(`/admin/book-orders/${orderId}`)).data,
  })

  const items = row?.items.map((i) => `${i.titleSnapshot} ×${i.qty}`).join('\n') ?? ''
  const note = [
    row?.transId ? `Trans. ID: ${row.transId}` : '',
    row?.region ? `Region: ${row.region === 'INSIDE_VALLEY' ? 'Inside valley' : 'Outside valley'}` : '',
    items,
  ]
    .filter(Boolean)
    .join('\n')

  async function setStatus(status: OrderStatus) {
    await mut.mutateAsync(() => api.patch(`/admin/book-orders/${orderId}`, { status }))
    if (status === 'CANCELLED') onClose()
  }

  return (
    <div className="-mx-8 -my-8 min-h-full bg-white px-8 py-8">
      <div className="grid max-w-6xl gap-8">
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2">
          <Field value={row?.publicId} placeholder="Order ID" />
          <Field value={row?.userName} placeholder="User Name" />
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
              value={row?.createdAt ? `${formatDate(row.createdAt)}  ${formatTime(row.createdAt)}` : ''}
              placeholder="Date/Time"
            />
            <Field value={row?.transId} placeholder="Trans. ID" />
            <Field value={statusLabel(row?.status)} placeholder="Status" />
            <Field
              value={row?.region === 'INSIDE_VALLEY' ? 'Inside valley' : row ? 'Outside valley' : ''}
              placeholder="Region"
            />
          </div>
          <textarea readOnly value={note} placeholder="Order details" className={textareaClass} />
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-end gap-3">
        <button type="button" onClick={onClose} className="h-11 rounded-md border border-black/12 px-6 text-sm text-black">
          Back
        </button>
        {STATUSES.filter((s) => s !== row?.status).map((status) => (
          <button
            key={status}
            type="button"
            disabled={mut.isPending}
            className={
              status === 'CANCELLED'
                ? 'h-11 rounded-md border border-rose-200 px-6 text-sm text-rose-600 disabled:opacity-60'
                : 'h-11 rounded-md border border-black/12 px-6 text-sm text-black disabled:opacity-60'
            }
            onClick={() => (status === 'CANCELLED' ? setCancelOpen(true) : void setStatus(status))}
          >
            {statusLabel(status)}
          </button>
        ))}
      </div>

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel order"
        message="Cancel this order? This cannot be undone."
        confirmLabel="Cancel order"
        pending={mut.isPending}
        onClose={() => setCancelOpen(false)}
        onConfirm={async () => {
          await setStatus('CANCELLED')
          setCancelOpen(false)
        }}
      />
    </div>
  )
}
