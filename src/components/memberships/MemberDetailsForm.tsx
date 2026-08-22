import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, type PaymentRow } from '../../lib/api'
import { countryName, formatDate, formatMoney, formatTime } from '../../lib/cn'
import { UserDetailsForm } from '../users/UserDetailsForm'

const fieldClass =
  'h-11 w-full rounded-lg bg-[#E5E5E5] px-4 text-sm text-[#262626] outline-none placeholder:text-[#262626]/70'

const textareaClass =
  'min-h-[168px] w-full resize-none rounded-lg bg-[#E5E5E5] px-4 py-3 text-sm text-[#262626] outline-none placeholder:text-[#262626]/70'

type MemberUser = {
  id: string
  publicId?: string
  memberCode?: string
  name: string
  email?: string | null
  phone: string
  countryCode: string
  city?: string | null
  status: string
}

function Field({ value, placeholder }: { value?: string | null; placeholder: string }) {
  return <input readOnly value={value ?? ''} placeholder={placeholder} className={fieldClass} />
}

function statusLabel(status?: string) {
  if (!status) return ''
  return status.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
}

export function MemberDetailsForm({
  membershipId,
  onClose,
}: {
  membershipId: string
  onClose: () => void
}) {
  const [allDetails, setAllDetails] = useState(false)

  const { data: row } = useQuery({
    queryKey: ['membership', membershipId],
    queryFn: async () => (await api.get<PaymentRow>(`/admin/memberships/${membershipId}`)).data,
  })

  const { data: user } = useQuery({
    queryKey: ['user-details', row?.userId],
    queryFn: async () => (await api.get<MemberUser>(`/admin/users/${row!.userId}`)).data,
    enabled: !!row?.userId,
  })

  if (allDetails && user) {
    return <UserDetailsForm edit={user} onClose={onClose} readOnly />
  }

  const note = [
    row?.transId ? `Trans. ID: ${row.transId}` : '',
    row?.plan ? `Plan: ${row.plan}` : '',
    row?.planCode ? `Code: ${row.planCode}` : '',
    row?.durationMonths ? `Duration: ${row.durationMonths} months` : '',
    row?.startedAt ? `Start: ${formatDate(row.startedAt)}` : '',
    row?.expiresAt ? `Expiry: ${formatDate(row.expiresAt)}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  return (
    <div className="-mx-8 -my-8 min-h-full bg-white px-8 py-8">
      <div className="mb-8 flex justify-end">
        <button
          type="button"
          onClick={() => (user ? setAllDetails(true) : undefined)}
          disabled={!user}
          className="h-11 rounded-md bg-[#020B17] px-4 text-sm text-white disabled:opacity-50"
        >
          See All Details
        </button>
      </div>

      <div className="grid max-w-6xl gap-8">
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2">
          <Field value={row?.memberId} placeholder="Member ID" />
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
              value={row ? `${formatDate(row.date)}  ${formatTime(row.date)}` : ''}
              placeholder="Date/Time"
            />
            <Field value={row?.transId} placeholder="Trans. ID" />
            <Field value={statusLabel(row?.status)} placeholder="Status" />
            <Field value={statusLabel(row?.membershipStatus)} placeholder="Membership Status" />
          </div>
          <textarea readOnly value={note} placeholder="Membership details" className={textareaClass} />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button type="button" onClick={onClose} className="h-11 rounded-md border border-black/12 px-6 text-sm text-black">
          Back
        </button>
      </div>
    </div>
  )
}
