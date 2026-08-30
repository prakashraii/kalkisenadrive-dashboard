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

type Plan = { id: string; name: string; code: string; priceCents: number; durationMonths: number; isActive: boolean }

const createSchema = Yup.object({
  userId: Yup.string().required('Required'),
  planId: Yup.string().required('Required'),
  method: Yup.string().required(),
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

function statusLabel(status?: string) {
  if (!status) return ''
  return status.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
}

export function MemberDetailsForm({
  membershipId,
  onClose,
}: {
  membershipId: string | 'new'
  onClose: () => void
}) {
  const isNew = membershipId === 'new'
  const mut = useAdminMutation(['memberships', 'plans', 'dashboard-members', 'membership-stats'])
  const [allDetails, setAllDetails] = useState(false)

  const { data: row } = useQuery({
    queryKey: ['membership', membershipId],
    queryFn: async () => (await api.get<PaymentRow>(`/admin/memberships/${membershipId}`)).data,
    enabled: !isNew,
  })

  const { data: user } = useQuery({
    queryKey: ['user-details', row?.userId],
    queryFn: async () => (await api.get<MemberUser>(`/admin/users/${row!.userId}`)).data,
    enabled: !isNew && !!row?.userId,
  })

  const users = useQuery({
    queryKey: ['users-mini'],
    queryFn: async () => (await api.get<Paginated<{ id: string; name: string }>>('/admin/users', { params: { limit: 50 } })).data,
    enabled: isNew,
  })
  const plans = useQuery({
    queryKey: ['plans'],
    queryFn: async () => (await api.get<Plan[]>('/admin/membership-plans')).data,
    enabled: isNew,
  })

  if (isNew) {
    return (
      <div className="-mx-8 -my-8 min-h-full bg-white px-8 py-8">
        <Formik
          initialValues={{ userId: '', planId: '', method: 'BANK' }}
          validationSchema={createSchema}
          onSubmit={async (values) => {
            await mut.mutateAsync(() => api.post('/admin/memberships', values))
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
                <div>
                  <FilledSelect name="planId" value={fk.values.planId} onChange={fk.handleChange}>
                    <option value="">Plan</option>
                    {(plans.data ?? []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </FilledSelect>
                  {fk.touched.planId && fk.errors.planId && <p className="mt-1 text-xs text-rose-600">{fk.errors.planId}</p>}
                </div>
                <FilledSelect name="method" value={fk.values.method} onChange={fk.handleChange}>
                  <option value="BANK">Bank</option>
                  <option value="WALLET">Wallet</option>
                </FilledSelect>
              </div>
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
