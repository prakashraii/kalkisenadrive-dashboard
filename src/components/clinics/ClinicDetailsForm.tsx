import { useQuery } from '@tanstack/react-query'
import { Formik } from 'formik'
import { ChevronDown, Pencil } from 'lucide-react'
import type { ChangeEventHandler, ReactNode } from 'react'
import * as Yup from 'yup'
import { api } from '../../lib/api'
import { cn } from '../../lib/cn'
import { useAdminMutation } from '../../viewmodels/useAdminCrud'

const fieldClass =
  'h-11 w-full rounded-lg bg-[#E5E5E5] px-4 text-sm text-[#262626] outline-none placeholder:text-[#262626]/70'

const textareaClass =
  'min-h-[280px] w-full flex-1 resize-none rounded-lg bg-[#E5E5E5] px-4 py-3 text-sm text-[#262626] outline-none placeholder:text-[#262626]/70'

const CITIES = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Biratnagar', 'London']

export type Clinic = {
  id: string
  publicId?: string
  name: string
  email?: string | null
  phone?: string | null
  city: string
  countryCode: string
  address?: string | null
  mapUrl?: string | null
  status: string
  memberCount?: number
}

function FilledSelect({
  name,
  value,
  onChange,
  disabled,
  children,
}: {
  name: string
  value: string
  onChange?: ChangeEventHandler<HTMLSelectElement>
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={cn(fieldClass, 'appearance-none pr-10 disabled:opacity-80')}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#262626]" />
    </div>
  )
}

function StatusToggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean
  disabled?: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-10 w-[72px] shrink-0 rounded-full border border-black/10 transition',
        checked ? 'bg-[#34C759]' : 'bg-white',
        disabled && 'cursor-default opacity-80',
      )}
    >
      <span
        className={cn(
          'absolute top-1 size-8 rounded-full shadow-sm transition-all',
          checked ? 'right-1 bg-white' : 'left-1 bg-[#E5E5E5]',
        )}
      />
    </button>
  )
}

const schema = Yup.object({
  name: Yup.string().required('Required'),
  email: Yup.string().email('Enter a valid email').nullable(),
  phone: Yup.string(),
  city: Yup.string().required('Required'),
  countryCode: Yup.string().required(),
  address: Yup.string(),
  mapUrl: Yup.string(),
  status: Yup.string().required(),
})

export function ClinicDetailsForm({
  clinicId,
  onClose,
  readOnly = false,
  onEdit,
}: {
  clinicId: string | 'new'
  onClose: () => void
  readOnly?: boolean
  onEdit?: () => void
}) {
  const mut = useAdminMutation(['clinics', 'clinic-stats', 'dashboard-summary'])
  const isNew = clinicId === 'new'

  const { data: clinic } = useQuery({
    queryKey: ['clinic', clinicId],
    queryFn: async () => (await api.get<Clinic>(`/admin/clinics/${clinicId}`)).data,
    enabled: !isNew,
  })

  const initialValues = {
    name: clinic?.name ?? '',
    email: clinic?.email ?? '',
    phone: clinic?.phone ?? '',
    city: clinic?.city ?? '',
    countryCode: clinic?.countryCode ?? 'NP',
    address: clinic?.address ?? '',
    mapUrl: clinic?.mapUrl ?? '',
    status: clinic?.status ?? 'ACTIVE',
    publicId: clinic?.publicId ?? '',
  }

  return (
    <div className="-mx-8 -my-8 min-h-full bg-white px-8 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        {initialValues.publicId ? (
          <p className="text-sm text-black/60">Clinic Registration ID: {initialValues.publicId}</p>
        ) : (
          <span />
        )}
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

      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={schema}
        onSubmit={async (values) => {
          if (readOnly) {
            onClose()
            return
          }
          const payload = {
            name: values.name,
            email: values.email || undefined,
            phone: values.phone || undefined,
            city: values.city,
            countryCode: values.countryCode,
            address: values.address || undefined,
            mapUrl: values.mapUrl || undefined,
            status: values.status,
          }
          try {
            if (isNew) {
              await mut.run(() => api.post('/admin/clinics', payload), {
                success: 'Clinic created',
                error: 'Could not create clinic',
              })
            } else {
              await mut.run(() => api.patch(`/admin/clinics/${clinicId}`, payload), {
                success: 'Clinic updated',
                error: 'Could not update clinic',
              })
            }
            onClose()
          } catch {
            // Toast already shown
          }
        }}
      >
        {(fk) => (
          <form onSubmit={fk.handleSubmit} className="max-w-6xl">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="flex flex-col gap-8">
                <div className="flex items-center gap-6">
                  <div className="min-w-0 flex-1">
                    <input
                      name="name"
                      value={fk.values.name}
                      onChange={fk.handleChange}
                      readOnly={readOnly}
                      placeholder="Clinic Name"
                      className={fieldClass}
                    />
                    {fk.touched.name && fk.errors.name && <p className="mt-1 text-xs text-rose-600">{fk.errors.name}</p>}
                  </div>
                  <StatusToggle
                    checked={fk.values.status === 'ACTIVE'}
                    disabled={readOnly}
                    onChange={(on) => fk.setFieldValue('status', on ? 'ACTIVE' : 'INACTIVE')}
                  />
                </div>

                <div>
                  <input
                    name="email"
                    value={fk.values.email}
                    onChange={fk.handleChange}
                    readOnly={readOnly}
                    placeholder="Email"
                    className={fieldClass}
                  />
                  {fk.touched.email && fk.errors.email && <p className="mt-1 text-xs text-rose-600">{fk.errors.email}</p>}
                </div>

                <input
                  name="phone"
                  value={fk.values.phone}
                  onChange={fk.handleChange}
                  readOnly={readOnly}
                  placeholder="Phone Number"
                  className={fieldClass}
                />

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FilledSelect
                    name="countryCode"
                    value={fk.values.countryCode}
                    onChange={fk.handleChange}
                    disabled={readOnly}
                  >
                    <option value="NP">Nepal</option>
                    <option value="US">USA</option>
                    <option value="GB">UK</option>
                    <option value="IN">India</option>
                  </FilledSelect>
                  <FilledSelect name="city" value={fk.values.city} onChange={fk.handleChange} disabled={readOnly}>
                    <option value="">City</option>
                    {[...CITIES, fk.values.city]
                      .filter((city, i, all) => city && all.indexOf(city) === i)
                      .map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                  </FilledSelect>
                </div>

                <FilledSelect name="status" value={fk.values.status} onChange={fk.handleChange} disabled={readOnly}>
                  <option value="ACTIVE">Approved</option>
                  <option value="INACTIVE">Inactive</option>
                </FilledSelect>

                <input
                  name="mapUrl"
                  value={fk.values.mapUrl}
                  onChange={fk.handleChange}
                  readOnly={readOnly}
                  placeholder="Map Link"
                  className={fieldClass}
                />
              </div>

              <textarea
                name="address"
                value={fk.values.address}
                onChange={fk.handleChange}
                readOnly={readOnly}
                placeholder="Address"
                className={textareaClass}
              />
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="h-11 rounded-md border border-black/12 px-6 text-sm text-black"
              >
                Back
              </button>
              {!readOnly && (
                <button
                  type="submit"
                  disabled={fk.isSubmitting}
                  className="h-11 rounded-md bg-[#001E5E] px-6 text-sm font-medium text-white disabled:opacity-60"
                >
                  {fk.isSubmitting ? 'Saving…' : 'Upload'}
                </button>
              )}
            </div>
          </form>
        )}
      </Formik>
    </div>
  )
}
