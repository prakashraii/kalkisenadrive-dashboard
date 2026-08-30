import { useState, type ChangeEventHandler, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Formik } from 'formik'
import { ChevronDown } from 'lucide-react'
import * as Yup from 'yup'
import { api, type Paginated, type PaymentRow } from '../../lib/api'
import { cn, countryName, formatDate, formatMoney, formatTime } from '../../lib/cn'
import { useAdminMutation } from '../../viewmodels/useAdminCrud'
import { UserDetailsForm } from '../users/UserDetailsForm'

const fieldClass =
  'h-11 w-full rounded-lg bg-[#E5E5E5] px-4 text-sm text-[#262626] outline-none placeholder:text-[#262626]/70'

const textareaClass =
  'min-h-[168px] w-full resize-none rounded-lg bg-[#E5E5E5] px-4 py-3 text-sm text-[#262626] outline-none placeholder:text-[#262626]/70'

type DonorUser = {
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

const createSchema = Yup.object({
  userId: Yup.string().required('Required'),
  type: Yup.string().required(),
  amount: Yup.number().min(1, 'Must be more than 0').required('Required'),
  method: Yup.string().required(),
  note: Yup.string(),
})

function Field({ value, placeholder }: { value?: string | null; placeholder: string }) {
  return <input readOnly value={value ?? ''} placeholder={placeholder} className={fieldClass} />
}

function FilledSelect({
  name,
  value,
  onChange,
  children,
}: {
  name: string
  value: string
  onChange?: ChangeEventHandler<HTMLSelectElement>
  children: ReactNode
}) {
  return (
    <div className="relative">
      <select name={name} value={value} onChange={onChange} className={cn(fieldClass, 'appearance-none pr-10')}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#262626]" />
    </div>
  )
}

export function DonorDetailsForm({
  donationId,
  defaultType = 'DOWRY',
  onClose,
}: {
  donationId: string | 'new'
  defaultType?: 'DOWRY' | 'DOCTOR' | 'GENERAL'
  onClose: () => void
}) {
  const isNew = donationId === 'new'
  const mut = useAdminMutation(['donations', 'donation-stats', 'dashboard-summary', 'dashboard-donated'])
  const [allDetails, setAllDetails] = useState(false)

  const { data: row } = useQuery({
    queryKey: ['donation', donationId],
    queryFn: async () => (await api.get<PaymentRow>(`/admin/donations/${donationId}`)).data,
    enabled: !isNew,
  })

  const { data: user } = useQuery({
    queryKey: ['user-details', row?.userId],
    queryFn: async () => (await api.get<DonorUser>(`/admin/users/${row!.userId}`)).data,
    enabled: !isNew && !!row?.userId,
  })

  const users = useQuery({
    queryKey: ['users-mini'],
    queryFn: async () => (await api.get<Paginated<{ id: string; name: string }>>('/admin/users', { params: { limit: 50 } })).data,
    enabled: isNew,
  })

  if (!isNew && allDetails && user) {
    return <UserDetailsForm edit={user} onClose={onClose} />
  }

  if (isNew) {
    return (
      <div className="-mx-8 -my-8 min-h-full bg-white px-8 py-8">
        <Formik
          initialValues={{ userId: '', type: defaultType, amount: 150, method: 'BANK', note: '' }}
          validationSchema={createSchema}
          onSubmit={async (values) => {
            await mut.mutateAsync(() =>
              api.post('/admin/donations', {
                userId: values.userId,
                type: values.type,
                amountCents: Math.round(Number(values.amount) * 100),
                method: values.method,
                note: values.note || undefined,
              }),
            )
            onClose()
          }}
        >
          {(fk) => (
            <form onSubmit={fk.handleSubmit} className="grid max-w-6xl gap-8">
              <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2">
                <div>
                  <FilledSelect name="userId" value={fk.values.userId} onChange={fk.handleChange}>
                    <option value="">User Name</option>
                    {(users.data?.data ?? []).map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </FilledSelect>
                  {fk.touched.userId && fk.errors.userId && <p className="mt-1 text-xs text-rose-600">{fk.errors.userId}</p>}
                </div>
                <FilledSelect name="type" value={fk.values.type} onChange={fk.handleChange}>
                  <option value="DOWRY">Dowry Donation</option>
                  <option value="DOCTOR">Doctor Donation</option>
                  <option value="GENERAL">General Donation</option>
                </FilledSelect>
                <div>
                  <input
                    type="number"
                    name="amount"
                    min={1}
                    value={fk.values.amount}
                    onChange={fk.handleChange}
                    placeholder="Amount"
                    className={fieldClass}
                  />
                  {fk.touched.amount && fk.errors.amount && <p className="mt-1 text-xs text-rose-600">{fk.errors.amount}</p>}
                </div>
                <FilledSelect name="method" value={fk.values.method} onChange={fk.handleChange}>
                  <option value="BANK">Bank</option>
                  <option value="WALLET">Wallet</option>
                </FilledSelect>
              </div>
              <textarea name="note" value={fk.values.note} onChange={fk.handleChange} placeholder="Donation details" className={textareaClass} />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={onClose} className="h-11 rounded-md border border-black/12 px-6 text-sm text-black">
                  Back
                </button>
                <button
                  type="submit"
                  disabled={fk.isSubmitting}
                  className="h-11 rounded-md bg-[#001E5E] px-6 text-sm font-medium text-white disabled:opacity-60"
                >
                  {fk.isSubmitting ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          )}
        </Formik>
      </div>
    )
  }

  const note = [
    row?.transId ? `Trans. ID: ${row.transId}` : '',
    row?.type ? `Donation: ${row.type.replaceAll('_', ' ')}` : '',
    row?.note ?? '',
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
          <Field value={row?.userName} placeholder="User Name" />
          <Field value={row?.phone} placeholder="Phone" />
          <Field value={row?.email} placeholder="Email" />
          <Field value={row?.memberId} placeholder="Member ID" />
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
            <Field
              value={row?.status ? row.status.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : ''}
              placeholder="Status"
            />
          </div>
          <textarea readOnly value={note} placeholder="Donation details" className={textareaClass} />
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="h-11 rounded-md border border-black/12 px-6 text-sm text-black">
          Back
        </button>
        {row?.status === 'PENDING' && row.donationId && (
          <>
            <button
              type="button"
              className="h-11 rounded-md border border-black/12 px-6 text-sm"
              onClick={() =>
                mut.mutateAsync(() => api.patch(`/admin/donations/${row.donationId}/reject`)).then(onClose)
              }
            >
              Reject
            </button>
            <button
              type="button"
              className="h-11 rounded-md bg-emerald-600 px-6 text-sm text-white"
              onClick={() =>
                mut.mutateAsync(() => api.patch(`/admin/donations/${row.donationId}/approve`)).then(onClose)
              }
            >
              Approve
            </button>
          </>
        )}
      </div>
    </div>
  )
}
