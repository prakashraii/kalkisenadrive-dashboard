import { useState, type ChangeEventHandler, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Formik } from 'formik'
import { ChevronDown, Pencil, Search } from 'lucide-react'
import * as Yup from 'yup'
import { api, type Paginated, type PaymentRow } from '../../lib/api'
import { cn, formatMoney } from '../../lib/cn'
import { useAdminMutation } from '../../viewmodels/useAdminCrud'
import { Pagination } from '../ui/Pagination'
import { PaymentTable } from '../ui/PaymentTable'
import { PaymentDetailsForm } from '../payments/PaymentDetailsForm'
import { TableFrame } from '../ui/DataTable'
import { Tabs } from '../ui/Tabs'

type User = {
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

type DriverReg = {
  id: string
  licenseNumber: string
  vehicleType: string
  vehicleNumber: string
  status: string
}

type Membership = {
  id: string
  startedAt: string
  expiresAt: string
  status: string
  plan: { name: string; code: string; priceCents: number; durationMonths: number }
}

type UserDetails = User & {
  driverRegistrations?: DriverReg[]
  memberships?: Membership[]
}

type DetailsTab = 'personal' | 'payments' | 'membership'

const DETAILS_TABS: { id: DetailsTab; label: string }[] = [
  { id: 'personal', label: 'Personal Info' },
  { id: 'payments', label: 'Payment History' },
  { id: 'membership', label: 'Membership Details' },
]

function userSchema(requireVehicle: boolean) {
  const vehicleField = () =>
    requireVehicle ? Yup.string().trim().required('Required') : Yup.string()
  return Yup.object({
    name: Yup.string().trim().required('Required'),
    phone: Yup.string().trim().required('Required').matches(/^[0-9]{10}$/, 'Enter a 10-digit phone'),
    email: Yup.string().trim().required('Required').email('Enter a valid email'),
    city: Yup.string().trim().required('Required'),
    countryCode: Yup.string().required('Required'),
    status: Yup.string().required('Required'),
    memberCode: Yup.string(),
    vehicleType: vehicleField(),
    licenseNumber: vehicleField(),
    vehicleNumber: vehicleField(),
  })
}

const fieldClass =
  'h-11 w-full rounded-lg bg-[#E5E5E5] px-4 text-sm text-[#262626] outline-none placeholder:text-[#262626]/70'

const textareaClass =
  'min-h-[168px] w-full resize-none rounded-lg bg-[#E5E5E5] px-4 py-3 text-sm text-[#262626] outline-none placeholder:text-[#262626]/70'

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null
  return (
    <p id={id} className="mt-1 text-xs text-rose-600">
      {error}
    </p>
  )
}

function FilledSelect({
  name,
  value,
  onChange,
  onBlur,
  disabled,
  invalid,
  describedBy,
  children,
}: {
  name: string
  value: string
  onChange?: ChangeEventHandler<HTMLSelectElement>
  onBlur?: ChangeEventHandler<HTMLSelectElement>
  disabled?: boolean
  invalid?: boolean
  describedBy?: string
  children: ReactNode
}) {
  return (
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={cn(fieldClass, 'appearance-none pr-10 disabled:opacity-80')}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#262626]" />
    </div>
  )
}

function formatDate(value?: string) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function UserDetailsForm({
  edit,
  onClose,
  readOnly = false,
  onEdit,
}: {
  edit: User | 'new'
  onClose: () => void
  readOnly?: boolean
  onEdit?: () => void
}) {
  const mut = useAdminMutation(['users', 'drivers', 'dashboard-summary'])
  const isNew = edit === 'new'
  const userId = isNew ? '' : edit.id
  const [tab, setTab] = useState<DetailsTab>('personal')
  const [payPage, setPayPage] = useState(1)
  const [paySearch, setPaySearch] = useState('')
  const [payMethod, setPayMethod] = useState<'WALLET' | 'BANK' | ''>('WALLET')
  const [viewPay, setViewPay] = useState<PaymentRow | null>(null)

  const { data: details } = useQuery({
    queryKey: ['user-details', userId],
    queryFn: async () => (await api.get<UserDetails>(`/admin/users/${userId}`)).data,
    enabled: !!userId,
  })

  const payments = useQuery({
    queryKey: ['user-payments', userId, payPage, paySearch, payMethod],
    queryFn: async () =>
      (
        await api.get<Paginated<PaymentRow>>('/admin/payments', {
          params: {
            userId,
            page: payPage,
            limit: 10,
            search: paySearch || undefined,
            method: payMethod || undefined,
          },
        })
      ).data,
    enabled: !!userId && tab === 'payments',
  })

  if (viewPay) {
    return <PaymentDetailsForm paymentId={viewPay.id} onClose={() => setViewPay(null)} />
  }

  const driver = details?.driverRegistrations?.[0]
  const membership = details?.memberships?.[0]
  const memberCode = details?.memberCode ?? (!isNew ? edit.memberCode : '') ?? ''
  const isDriver = Boolean(driver)

  const initialValues = isNew
    ? {
        name: '',
        phone: '',
        email: '',
        city: '',
        countryCode: '',
        status: '',
        memberCode: '',
        vehicleType: '',
        licenseNumber: '',
        vehicleNumber: '',
      }
    : {
        name: details?.name ?? edit.name,
        phone: details?.phone ?? edit.phone,
        email: details?.email ?? edit.email ?? '',
        city: details?.city ?? edit.city ?? '',
        countryCode: details?.countryCode ?? edit.countryCode,
        status: details?.status ?? edit.status,
        memberCode,
        vehicleType: driver?.vehicleType ?? '',
        licenseNumber: driver?.licenseNumber ?? '',
        vehicleNumber: driver?.vehicleNumber ?? '',
      }

  return (
    <div className="-mx-8 -my-8 min-h-full bg-white px-8 py-8">
      {(isDriver || memberCode) && (
        <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
          {isDriver && <p className="text-[#009EE8]">(Registered Driver)</p>}
          {memberCode && <p className="text-black/60">Member ID: {memberCode}</p>}
        </div>
      )}
      <div className="mb-8 flex items-center justify-between gap-3">
        <Tabs tabs={DETAILS_TABS} value={tab} onChange={setTab} />
        {readOnly && onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-black/12 px-3 text-sm text-black"
          >
            <Pencil className="size-4" />
            Edit Details
          </button>
        )}
      </div>

      {tab === 'personal' && (
        <Formik
          enableReinitialize
          initialValues={initialValues}
          validationSchema={userSchema(isNew || isDriver)}
          onSubmit={async (values) => {
            if (readOnly) return
            try {
              const payload = {
                name: values.name.trim(),
                phone: values.phone.trim(),
                email: values.email.trim(),
                city: values.city.trim(),
                countryCode: values.countryCode,
                status: values.status,
              }
              if (isNew) {
                await mut.run(() => api.post('/admin/users', payload), {
                  success: 'User created',
                  error: 'Could not create user',
                })
              } else {
                await mut.run(
                  async () => {
                    await api.patch(`/admin/users/${edit.id}`, payload)
                    if (driver) {
                      await api.patch(`/admin/drivers/${driver.id}`, {
                        name: values.name.trim(),
                        phone: values.phone.trim(),
                        email: values.email.trim(),
                        city: values.city.trim(),
                        countryCode: values.countryCode,
                        licenseNumber: values.licenseNumber.trim(),
                        vehicleType: values.vehicleType,
                        vehicleNumber: values.vehicleNumber.trim(),
                      })
                    }
                  },
                  { success: 'User updated', error: 'Could not update user' },
                )
              }
              onClose()
            } catch {
              // Toast already shown
            }
          }}
        >
          {(fk) => {
            const showError = (field: keyof typeof fk.values) =>
              Boolean((fk.touched[field] || fk.submitCount > 0) && fk.errors[field])
            const errorId = (field: string) => (showError(field as keyof typeof fk.values) ? `${field}-error` : undefined)

            async function submitForm(e: { preventDefault: () => void }) {
              e.preventDefault()
              if (readOnly) return
              const errors = await fk.validateForm()
              await fk.setTouched(
                Object.fromEntries(Object.keys(fk.values).map((key) => [key, true])) as typeof fk.touched,
              )
              const first = (
                [
                  'name',
                  'phone',
                  'countryCode',
                  'vehicleType',
                  'email',
                  'licenseNumber',
                  'vehicleNumber',
                  'city',
                  'status',
                ] as const
              ).find((key) => errors[key])
              if (first) {
                document.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
                return
              }
              await fk.submitForm()
            }

            return (
            <form onSubmit={(e) => void submitForm(e)} className="grid max-w-5xl grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2">
              <div>
                <input
                  name="name"
                  value={fk.values.name}
                  onChange={fk.handleChange}
                  onBlur={fk.handleBlur}
                  readOnly={readOnly}
                  placeholder="User Name"
                  aria-invalid={showError('name') || undefined}
                  aria-describedby={errorId('name')}
                  className={fieldClass}
                />
                <FieldError id="name-error" error={showError('name') ? fk.errors.name : undefined} />
              </div>
              <div>
                <input
                  name="phone"
                  value={fk.values.phone}
                  onChange={fk.handleChange}
                  onBlur={fk.handleBlur}
                  readOnly={readOnly}
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="Phone Number"
                  aria-invalid={showError('phone') || undefined}
                  aria-describedby={errorId('phone')}
                  className={fieldClass}
                />
                <FieldError id="phone-error" error={showError('phone') ? fk.errors.phone : undefined} />
              </div>
              <div>
                <FilledSelect
                  name="countryCode"
                  value={fk.values.countryCode}
                  onChange={fk.handleChange}
                  onBlur={fk.handleBlur}
                  disabled={readOnly}
                  invalid={showError('countryCode')}
                  describedBy={errorId('countryCode')}
                >
                  <option value="">Country</option>
                  <option value="NP">Nepal</option>
                  <option value="US">USA</option>
                  <option value="GB">UK</option>
                  <option value="IN">India</option>
                </FilledSelect>
                <FieldError id="countryCode-error" error={showError('countryCode') ? fk.errors.countryCode : undefined} />
              </div>
              <div>
                <FilledSelect
                  name="vehicleType"
                  value={fk.values.vehicleType}
                  onChange={fk.handleChange}
                  onBlur={fk.handleBlur}
                  disabled={readOnly}
                  invalid={showError('vehicleType')}
                  describedBy={errorId('vehicleType')}
                >
                  <option value="">Vehicle Type</option>
                  <option value="Bike">Bike</option>
                  <option value="Car">Car</option>
                  <option value="Scooter">Scooter</option>
                </FilledSelect>
                <FieldError id="vehicleType-error" error={showError('vehicleType') ? fk.errors.vehicleType : undefined} />
              </div>
              <div>
                <input
                  name="email"
                  value={fk.values.email}
                  onChange={fk.handleChange}
                  onBlur={fk.handleBlur}
                  readOnly={readOnly}
                  placeholder="Email"
                  aria-invalid={showError('email') || undefined}
                  aria-describedby={errorId('email')}
                  className={fieldClass}
                />
                <FieldError id="email-error" error={showError('email') ? fk.errors.email : undefined} />
              </div>
              <div>
                <input
                  name="licenseNumber"
                  value={fk.values.licenseNumber}
                  onChange={fk.handleChange}
                  onBlur={fk.handleBlur}
                  readOnly={readOnly}
                  placeholder="License Number"
                  aria-invalid={showError('licenseNumber') || undefined}
                  aria-describedby={errorId('licenseNumber')}
                  className={fieldClass}
                />
                <FieldError id="licenseNumber-error" error={showError('licenseNumber') ? fk.errors.licenseNumber : undefined} />
              </div>
              <div className="md:col-span-2">
                <input
                  name="vehicleNumber"
                  value={fk.values.vehicleNumber}
                  onChange={fk.handleChange}
                  onBlur={fk.handleBlur}
                  readOnly={readOnly}
                  placeholder="Vehicle Number"
                  aria-invalid={showError('vehicleNumber') || undefined}
                  aria-describedby={errorId('vehicleNumber')}
                  className={fieldClass}
                />
                <FieldError id="vehicleNumber-error" error={showError('vehicleNumber') ? fk.errors.vehicleNumber : undefined} />
              </div>
              <div>
                <FilledSelect
                  name="city"
                  value={fk.values.city}
                  onChange={fk.handleChange}
                  onBlur={fk.handleBlur}
                  disabled={readOnly}
                  invalid={showError('city')}
                  describedBy={errorId('city')}
                >
                  <option value="">City</option>
                  {['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'London', fk.values.city]
                    .filter((city, i, all) => city && all.indexOf(city) === i)
                    .map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                </FilledSelect>
                <FieldError id="city-error" error={showError('city') ? fk.errors.city : undefined} />
              </div>
              <div>
                <FilledSelect
                  name="status"
                  value={fk.values.status}
                  onChange={fk.handleChange}
                  onBlur={fk.handleBlur}
                  disabled={readOnly}
                  invalid={showError('status')}
                  describedBy={errorId('status')}
                >
                  <option value="">Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="SUSPENDED">Suspended</option>
                </FilledSelect>
                <FieldError id="status-error" error={showError('status') ? fk.errors.status : undefined} />
              </div>
              <div className="flex justify-end gap-3 md:col-span-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-11 rounded-md border border-black/12 px-6 text-sm text-black"
                >
                  {readOnly ? 'Back' : 'Cancel'}
                </button>
                {!readOnly && (
                  <button
                    type="submit"
                    disabled={fk.isSubmitting}
                    className="h-11 rounded-md bg-accent px-6 text-sm font-medium text-black disabled:opacity-60"
                  >
                    {fk.isSubmitting ? 'Saving…' : 'Save'}
                  </button>
                )}
              </div>
            </form>
            )
          }}
        </Formik>
      )}

      {tab === 'payments' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setPayMethod('WALLET')
                setPayPage(1)
              }}
              className={cn(
                'h-11 rounded-md px-6 text-sm',
                payMethod === 'WALLET' ? 'bg-[#020B17] text-white' : 'border border-black/12 bg-white text-black',
              )}
            >
              Wallet
            </button>
            <button
              type="button"
              onClick={() => {
                setPayMethod('BANK')
                setPayPage(1)
              }}
              className={cn(
                'h-11 rounded-md px-6 text-sm',
                payMethod === 'BANK' ? 'bg-[#020B17] text-white' : 'border border-black/12 bg-white text-black',
              )}
            >
              Bank
            </button>
          </div>
          <label className="flex h-11 max-w-md items-center gap-2.5 rounded-md border border-black/10 bg-white px-4">
            <Search className="size-5 text-black/60" />
            <input
              value={paySearch}
              onChange={(e) => {
                setPaySearch(e.target.value)
                setPayPage(1)
              }}
              placeholder="Type to search..."
              className="w-full bg-transparent text-xs text-black outline-none placeholder:text-black/60"
            />
          </label>
          <TableFrame>
            <PaymentTable
              rows={payments.data?.data ?? []}
              onView={setViewPay}
              nameHeader="Buyer Name"
            />
            <Pagination
              page={payments.data?.meta.page ?? 1}
              pageCount={payments.data?.meta.pageCount ?? 1}
              total={payments.data?.meta.total ?? 0}
              limit={10}
              onPage={setPayPage}
            />
          </TableFrame>
        </div>
      )}

      {tab === 'membership' && (
        <div className="grid max-w-5xl grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2">
          <div className="flex flex-col gap-8">
            <input readOnly value={membership?.plan.name ?? ''} placeholder="Plan Name" className={fieldClass} />
            <input readOnly value={formatDate(membership?.startedAt)} placeholder="Start Date" className={fieldClass} />
            <input readOnly value={formatDate(membership?.expiresAt)} placeholder="Expiry Date" className={fieldClass} />
            <input
              readOnly
              value={membership?.status ? membership.status.replaceAll('_', ' ') : ''}
              placeholder="Status"
              className={fieldClass}
            />
          </div>
          <div className="flex flex-col gap-8">
            <input
              readOnly
              value={membership ? `${formatMoney(membership.plan.priceCents).replace('रू ', '')}/-` : ''}
              placeholder="Amount"
              className={fieldClass}
            />
            <textarea
              readOnly
              value={
                membership
                  ? `${membership.plan.code} · ${membership.plan.durationMonths} months`
                  : ''
              }
              placeholder="Membership Details"
              className={textareaClass}
            />
          </div>
        </div>
      )}

    </div>
  )
}
