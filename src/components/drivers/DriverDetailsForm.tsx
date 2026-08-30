import { useRef, useState, type ChangeEvent, type ChangeEventHandler, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Formik } from 'formik'
import { ChevronDown } from 'lucide-react'
import * as Yup from 'yup'
import { api } from '../../lib/api'
import { assetUrl, cn } from '../../lib/cn'
import { getApiMessage } from '../../lib/toast'
import { useAdminMutation } from '../../viewmodels/useAdminCrud'
import { toast } from 'sonner'
import { Tabs } from '../ui/Tabs'

export type DriverDocumentKind =
  | 'PROFILE_PHOTO'
  | 'CITIZENSHIP_FRONT'
  | 'CITIZENSHIP_BACK'
  | 'LICENSE_PHOTO'
  | 'VEHICLE_FRONT'
  | 'VEHICLE_BACK'
  | 'VEHICLE_SIDE'
  | 'VEHICLE_RC'
  | 'DOC_CITIZENSHIP'
  | 'DOC_LICENSE'
  | 'DOC_BLUEBOOK'
  | 'DOC_INSURANCE'
  | 'DOC_PHOTO'
  | 'DOC_ADDRESS'
  | 'DOC_PAN'
  | 'DOC_FITNESS'

export type DriverDocument = {
  id: string
  kind: DriverDocumentKind
  fileUrl: string
  fileName?: string | null
}

export type DriverDetails = {
  id: string
  publicId: string
  userId?: string | null
  name: string
  phone: string
  email?: string | null
  licenseNumber: string
  vehicleType: string
  vehicleNumber: string
  vehicleModel?: string | null
  vehicleColor?: string | null
  vehicleYear?: string | null
  insuranceNumber?: string | null
  city?: string | null
  countryCode: string
  status: string
  user?: { id: string; memberCode?: string | null } | null
  documents?: DriverDocument[]
}

type FormTab = 'details' | 'vehicle' | 'documents'

const FORM_TABS: { id: FormTab; label: string }[] = [
  { id: 'details', label: 'Driver Details' },
  { id: 'vehicle', label: 'Vehicle Details' },
  { id: 'documents', label: 'Documents' },
]

const DRIVER_PHOTOS: { kind: DriverDocumentKind; label: string }[] = [
  { kind: 'PROFILE_PHOTO', label: 'Profile Photo' },
  { kind: 'CITIZENSHIP_FRONT', label: 'Citizenship Front' },
  { kind: 'CITIZENSHIP_BACK', label: 'Citizenship Back' },
  { kind: 'LICENSE_PHOTO', label: 'License Photo' },
]

const VEHICLE_PHOTOS: { kind: DriverDocumentKind; label: string }[] = [
  { kind: 'VEHICLE_FRONT', label: 'Vehicle Front' },
  { kind: 'VEHICLE_BACK', label: 'Vehicle Back' },
  { kind: 'VEHICLE_SIDE', label: 'Vehicle Side' },
  { kind: 'VEHICLE_RC', label: 'Registration / Bluebook' },
]

const DOCUMENT_SLOTS: { kind: DriverDocumentKind; label: string }[] = [
  { kind: 'DOC_CITIZENSHIP', label: 'Citizenship' },
  { kind: 'DOC_LICENSE', label: 'Driving License' },
  { kind: 'DOC_BLUEBOOK', label: 'Vehicle Bluebook' },
  { kind: 'DOC_INSURANCE', label: 'Insurance' },
  { kind: 'DOC_PHOTO', label: 'Passport Photo' },
  { kind: 'DOC_ADDRESS', label: 'Address Proof' },
  { kind: 'DOC_PAN', label: 'PAN' },
  { kind: 'DOC_FITNESS', label: 'Fitness Certificate' },
]

const fieldClass =
  'h-11 w-full rounded-lg bg-[#E5E5E5] px-4 text-sm text-[#262626] outline-none placeholder:text-[#262626]/70'

const schema = Yup.object({
  name: Yup.string().required('Required'),
  phone: Yup.string().required('Required'),
  email: Yup.string().email().nullable(),
  licenseNumber: Yup.string().required('Required'),
  vehicleType: Yup.string().required('Required'),
  vehicleNumber: Yup.string().required('Required'),
})

function tabFromParam(value: string | null): FormTab {
  return FORM_TABS.some((t) => t.id === value) ? (value as FormTab) : 'details'
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

function MediaSlot({
  label,
  kind,
  url,
  fileName,
  driverId,
  tall,
}: {
  label: string
  kind: DriverDocumentKind
  url?: string
  fileName?: string | null
  driverId?: string
  tall?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const qc = useQueryClient()
  const [busy, setBusy] = useState(false)
  const isPdf = Boolean(url && (url.toLowerCase().endsWith('.pdf') || fileName?.toLowerCase().endsWith('.pdf')))

  async function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !driverId) return
    const body = new FormData()
    body.append('file', file)
    setBusy(true)
    try {
      await api.post(`/admin/drivers/${driverId}/documents/${kind}`, body)
      await qc.invalidateQueries({ queryKey: ['driver', driverId] })
      toast.success('Document uploaded')
    } catch (err) {
      toast.error(getApiMessage(err, 'Could not upload document'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      disabled={!driverId || busy}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-lg bg-[#E5E5E5] text-sm text-[#262626] disabled:cursor-not-allowed',
        tall ? 'min-h-[168px]' : 'aspect-square min-h-[140px]',
      )}
    >
      {url && !isPdf ? (
        <img src={assetUrl(url)} alt={label} className="absolute inset-0 size-full object-cover" />
      ) : (
        <span className="px-3 text-center">{busy ? 'Uploading…' : url ? fileName || label : label}</span>
      )}
      <input ref={inputRef} type="file" accept="image/*,.pdf,application/pdf" className="hidden" onChange={onChange} />
    </button>
  )
}

export function DriverDetailsForm({
  driverId,
  onClose,
  onCreated,
}: {
  driverId?: string
  onClose: () => void
  onCreated?: (id: string) => void
}) {
  const [params, setParams] = useSearchParams()
  const tab = tabFromParam(params.get('tab'))
  const mut = useAdminMutation(['drivers', 'driver', 'driver-stats', 'dashboard-summary'])
  const isNew = !driverId

  const { data } = useQuery({
    queryKey: ['driver', driverId],
    queryFn: async () => (await api.get<DriverDetails>(`/admin/drivers/${driverId}`)).data,
    enabled: !!driverId,
  })

  const docs = data?.documents ?? []
  const docMap = Object.fromEntries(docs.map((d) => [d.kind, d])) as Partial<Record<DriverDocumentKind, DriverDocument>>

  function setTab(next: FormTab) {
    const nextParams = new URLSearchParams(params)
    nextParams.set('tab', next)
    setParams(nextParams, { replace: true })
  }

  const initialValues = {
    name: data?.name ?? '',
    email: data?.email ?? '',
    phone: data?.phone ?? '',
    memberCode: data?.user?.memberCode ?? '',
    countryCode: data?.countryCode ?? 'NP',
    city: data?.city ?? '',
    status: data?.status ?? 'PENDING',
    vehicleType: data?.vehicleType ?? 'Bike',
    vehicleNumber: data?.vehicleNumber ?? '',
    licenseNumber: data?.licenseNumber ?? '',
    vehicleModel: data?.vehicleModel ?? '',
    vehicleColor: data?.vehicleColor ?? '',
    vehicleYear: data?.vehicleYear ?? '',
    insuranceNumber: data?.insuranceNumber ?? '',
  }

  return (
    <div className="-mx-8 -my-8 min-h-full bg-white px-8 py-8">
      <div className="mb-8">
        <Tabs tabs={FORM_TABS} value={tab} onChange={setTab} />
      </div>

      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={schema}
        onSubmit={async (values) => {
          const payload = {
            name: values.name,
            phone: values.phone,
            email: values.email || undefined,
            city: values.city || undefined,
            countryCode: values.countryCode,
            status: values.status,
            licenseNumber: values.licenseNumber,
            vehicleType: values.vehicleType,
            vehicleNumber: values.vehicleNumber,
            vehicleModel: values.vehicleModel || undefined,
            vehicleColor: values.vehicleColor || undefined,
            vehicleYear: values.vehicleYear || undefined,
            insuranceNumber: values.insuranceNumber || undefined,
          }
          try {
            if (isNew) {
              const created = await mut.run(() => api.post<DriverDetails>('/admin/drivers', payload), {
                success: 'Driver created',
                error: 'Could not create driver',
              })
              const id = (created as { data?: DriverDetails }).data?.id
              if (id) onCreated?.(id)
              else onClose()
              return
            }
            await mut.run(() => api.patch(`/admin/drivers/${driverId}`, payload), {
              success: 'Driver updated',
              error: 'Could not update driver',
            })
          } catch {
            // Toast already shown
          }
        }}
      >
        {(fk) => (
          <form onSubmit={fk.handleSubmit} className="flex flex-col gap-8">
            {tab === 'details' && (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <div className="flex flex-col gap-6">
                  <div>
                    <input name="name" value={fk.values.name} onChange={fk.handleChange} placeholder="Driver Name" className={fieldClass} />
                    {fk.touched.name && fk.errors.name && <p className="mt-1 text-xs text-rose-600">{fk.errors.name}</p>}
                  </div>
                  <div>
                    <input name="email" value={fk.values.email} onChange={fk.handleChange} placeholder="Email" className={fieldClass} />
                    {fk.touched.email && fk.errors.email && <p className="mt-1 text-xs text-rose-600">{fk.errors.email}</p>}
                  </div>
                  <div>
                    <input name="phone" value={fk.values.phone} onChange={fk.handleChange} placeholder="Phone" className={fieldClass} />
                    {fk.touched.phone && fk.errors.phone && <p className="mt-1 text-xs text-rose-600">{fk.errors.phone}</p>}
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <input name="memberCode" value={fk.values.memberCode} readOnly placeholder="Member ID" className={fieldClass} />
                    <FilledSelect name="countryCode" value={fk.values.countryCode} onChange={fk.handleChange}>
                      <option value="NP">Nepal</option>
                      <option value="US">USA</option>
                      <option value="GB">UK</option>
                      <option value="IN">India</option>
                    </FilledSelect>
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <input name="city" value={fk.values.city} onChange={fk.handleChange} placeholder="City" className={fieldClass} />
                    <FilledSelect name="status" value={fk.values.status} onChange={fk.handleChange}>
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                    </FilledSelect>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {DRIVER_PHOTOS.map((slot) => (
                    <MediaSlot
                      key={slot.kind}
                      label={slot.label}
                      kind={slot.kind}
                      url={docMap[slot.kind]?.fileUrl}
                      fileName={docMap[slot.kind]?.fileName}
                      driverId={driverId}
                    />
                  ))}
                </div>
              </div>
            )}

            {tab === 'vehicle' && (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <div className="flex flex-col gap-6">
                  <FilledSelect name="vehicleType" value={fk.values.vehicleType} onChange={fk.handleChange}>
                    <option value="Bike">Vehicle Type — Bike</option>
                    <option value="Car">Vehicle Type — Car</option>
                    <option value="Scooter">Vehicle Type — Scooter</option>
                  </FilledSelect>
                  <div>
                    <input
                      name="vehicleNumber"
                      value={fk.values.vehicleNumber}
                      onChange={fk.handleChange}
                      placeholder="Vehicle Number"
                      className={fieldClass}
                    />
                    {fk.touched.vehicleNumber && fk.errors.vehicleNumber && (
                      <p className="mt-1 text-xs text-rose-600">{fk.errors.vehicleNumber}</p>
                    )}
                  </div>
                  <div>
                    <input
                      name="licenseNumber"
                      value={fk.values.licenseNumber}
                      onChange={fk.handleChange}
                      placeholder="License Number"
                      className={fieldClass}
                    />
                    {fk.touched.licenseNumber && fk.errors.licenseNumber && (
                      <p className="mt-1 text-xs text-rose-600">{fk.errors.licenseNumber}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <input
                      name="vehicleModel"
                      value={fk.values.vehicleModel}
                      onChange={fk.handleChange}
                      placeholder="Vehicle Model"
                      className={fieldClass}
                    />
                    <input
                      name="vehicleColor"
                      value={fk.values.vehicleColor}
                      onChange={fk.handleChange}
                      placeholder="Vehicle Color"
                      className={fieldClass}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <input
                      name="vehicleYear"
                      value={fk.values.vehicleYear}
                      onChange={fk.handleChange}
                      placeholder="Vehicle Year"
                      className={fieldClass}
                    />
                    <input
                      name="insuranceNumber"
                      value={fk.values.insuranceNumber}
                      onChange={fk.handleChange}
                      placeholder="Insurance Number"
                      className={fieldClass}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {VEHICLE_PHOTOS.map((slot) => (
                    <MediaSlot
                      key={slot.kind}
                      label={slot.label}
                      kind={slot.kind}
                      url={docMap[slot.kind]?.fileUrl}
                      fileName={docMap[slot.kind]?.fileName}
                      driverId={driverId}
                    />
                  ))}
                </div>
              </div>
            )}

            {tab === 'documents' && (
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                {DOCUMENT_SLOTS.map((slot) => (
                  <MediaSlot
                    key={slot.kind}
                    tall
                    label={isNew ? 'Save driver details first' : slot.label}
                    kind={slot.kind}
                    url={docMap[slot.kind]?.fileUrl}
                    fileName={docMap[slot.kind]?.fileName}
                    driverId={driverId}
                  />
                ))}
              </div>
            )}

            {tab !== 'documents' && (
              <div className="flex flex-wrap justify-end gap-3">
                <button type="button" onClick={onClose} className="h-11 rounded-md border border-black/12 px-6 text-sm text-black">
                  Back
                </button>
                {driverId && data?.status === 'PENDING' && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        void mut
                          .run(() => api.patch(`/admin/drivers/${driverId}/reject`), {
                            success: 'Driver rejected',
                            error: 'Could not reject driver',
                          })
                          .catch(() => undefined)
                      }
                      className="h-11 rounded-md border border-rose-200 px-6 text-sm text-rose-600"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void mut
                          .run(() => api.patch(`/admin/drivers/${driverId}/approve`), {
                            success: 'Driver approved',
                            error: 'Could not approve driver',
                          })
                          .catch(() => undefined)
                      }
                      className="h-11 rounded-md bg-emerald-600 px-6 text-sm text-white"
                    >
                      Approve
                    </button>
                  </>
                )}
                <button
                  type="submit"
                  disabled={fk.isSubmitting}
                  className="h-11 rounded-md bg-accent px-6 text-sm font-medium text-black disabled:opacity-60"
                >
                  {fk.isSubmitting ? 'Saving…' : isNew ? 'Create' : 'Save'}
                </button>
              </div>
            )}

            {tab === 'documents' && (
              <div className="flex justify-end">
                <button type="button" onClick={onClose} className="h-11 rounded-md border border-black/12 px-6 text-sm text-black">
                  Back
                </button>
              </div>
            )}
          </form>
        )}
      </Formik>
    </div>
  )
}
