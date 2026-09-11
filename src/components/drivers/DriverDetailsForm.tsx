import { useEffect, useRef, useState, type ChangeEvent, type ChangeEventHandler, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Formik } from 'formik'
import { ChevronDown, FileText, ImagePlus } from 'lucide-react'
import * as Yup from 'yup'
import { api } from '../../lib/api'
import { assetUrl, cn } from '../../lib/cn'
import {
  NEPAL_VEHICLE_NUMBER_MESSAGE,
  NEPAL_VEHICLE_NUMBER_REGEX,
  normalizeVehicleNumber,
} from '../../lib/validation'
import { getApiMessage } from '../../lib/toast'
import { validateUploadFile } from '../../lib/upload'
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
  phone: Yup.string().matches(/^[0-9]{10}$/, '10-digit phone').required('Required'),
  email: Yup.string().email('Enter a valid email').required('Required'),
  memberCode: Yup.string().trim().required('Required'),
  city: Yup.string().trim().required('Required'),
  licenseNumber: Yup.string().required('Required'),
  vehicleType: Yup.string().required('Required'),
  vehicleNumber: Yup.string()
    .trim()
    .required('Required')
    .matches(NEPAL_VEHICLE_NUMBER_REGEX, NEPAL_VEHICLE_NUMBER_MESSAGE),
})

const DETAILS_FIELDS = ['name', 'email', 'phone', 'memberCode', 'city'] as const
const VEHICLE_FIELDS = ['vehicleType', 'vehicleNumber', 'licenseNumber'] as const

function tabForErrors(errors: Record<string, unknown>): FormTab | null {
  if (DETAILS_FIELDS.some((key) => errors[key])) return 'details'
  if (VEHICLE_FIELDS.some((key) => errors[key])) return 'vehicle'
  return null
}

function submitErrorToast(currentTab: FormTab, errors: Record<string, unknown>) {
  const detailsInvalid = DETAILS_FIELDS.some((key) => errors[key])
  const vehicleInvalid = VEHICLE_FIELDS.some((key) => errors[key])
  if (currentTab === 'details' && vehicleInvalid && !detailsInvalid) return 'Complete Vehicle Details also'
  if (currentTab === 'vehicle' && detailsInvalid && !vehicleInvalid) return 'Complete Driver Details also'
  if (currentTab === 'documents' && detailsInvalid) return 'Complete Driver Details also'
  if (currentTab === 'documents' && vehicleInvalid) return 'Complete Vehicle Details also'
  return null
}

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

function isPdfFile(name?: string | null, url?: string) {
  const value = `${name ?? ''} ${url ?? ''}`.toLowerCase()
  return value.includes('.pdf')
}

function MediaSlot({
  label,
  kind,
  url,
  fileName,
  driverId,
  tall,
  onQueued,
}: {
  label: string
  kind: DriverDocumentKind
  url?: string
  fileName?: string | null
  driverId?: string
  tall?: boolean
  onQueued?: (kind: DriverDocumentKind, file: File) => void
}) {
  const inputId = `driver-doc-${kind}`
  const errorId = `${inputId}-error`
  const qc = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [localName, setLocalName] = useState('')
  const [localPreview, setLocalPreview] = useState('')

  useEffect(
    () => () => {
      if (localPreview) URL.revokeObjectURL(localPreview)
    },
    [localPreview],
  )

  const hasLocal = Boolean(localName)
  const isPdf = hasLocal ? localName.toLowerCase().endsWith('.pdf') : isPdfFile(fileName, url)
  const preview = !isPdf ? localPreview || (url ? assetUrl(url) : '') : ''
  const displayName = localName || fileName || label

  async function applyFile(file: File) {
    const message = validateUploadFile(file, { allowPdf: true })
    if (message) {
      setError(message)
      return
    }
    setError('')
    setLocalName(file.name)
    setLocalPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
    })
    if (!driverId) {
      onQueued?.(kind, file)
      return
    }
    const body = new FormData()
    body.append('file', file)
    setBusy(true)
    try {
      await api.post(`/admin/drivers/${driverId}/documents/${kind}`, body)
      await qc.invalidateQueries({ queryKey: ['driver', driverId] })
      toast.success('Document uploaded')
    } catch (err) {
      const uploadError = getApiMessage(err, 'Could not upload document')
      setError(uploadError)
      toast.error(uploadError)
    } finally {
      setBusy(false)
    }
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) void applyFile(file)
  }

  return (
    <div className="flex min-w-0 flex-col">
      <label
        htmlFor={inputId}
        className={cn(
          'relative flex cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-[#E5E5E5] text-sm text-[#262626]',
          tall ? 'min-h-[168px]' : 'aspect-square min-h-[140px]',
          busy && 'opacity-80',
          error && 'ring-1 ring-rose-500',
        )}
      >
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.jpg,.jpeg,.png,.webp,.gif,.pdf"
          aria-label={label}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          disabled={busy}
          onChange={onChange}
          className="sr-only"
        />
        {preview && !isPdf ? (
          <img src={preview} alt={label} className="pointer-events-none absolute inset-0 size-full object-cover" />
        ) : url || localName ? (
          <span className="pointer-events-none flex flex-col items-center gap-1 px-3 text-center">
            <FileText className="size-5 text-[#262626]/60" />
            <span className="line-clamp-2 break-all">{busy ? 'Uploading…' : displayName}</span>
          </span>
        ) : (
          <span className="pointer-events-none flex flex-col items-center gap-1 px-3 text-center text-[#262626]/80">
            <ImagePlus className="size-5 text-[#262626]/50" />
            <span>{busy ? 'Uploading…' : label}</span>
          </span>
        )}
      </label>
      {error ? (
        <p id={errorId} role="alert" className="mt-1 text-xs text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
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
  const queuedFiles = useRef<Partial<Record<DriverDocumentKind, File>>>({})

  function queueFile(kind: DriverDocumentKind, file: File) {
    queuedFiles.current[kind] = file
  }

  async function uploadQueued(id: string) {
    const entries = Object.entries(queuedFiles.current) as [DriverDocumentKind, File][]
    for (const [kind, file] of entries) {
      const body = new FormData()
      body.append('file', file)
      await api.post(`/admin/drivers/${id}/documents/${kind}`, body)
    }
    queuedFiles.current = {}
  }

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
            email: values.email,
            memberCode: values.memberCode.trim(),
            city: values.city.trim(),
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
              if (!id) {
                onClose()
                return
              }
              try {
                await uploadQueued(id)
              } catch (err) {
                toast.error(getApiMessage(err, 'Driver saved, but some documents failed to upload'))
              }
              onCreated?.(id)
              return
            }
            await mut.run(() => api.patch(`/admin/drivers/${driverId}`, payload), {
              success: 'Driver updated',
              error: 'Could not update driver',
            })
            try {
              await uploadQueued(driverId)
            } catch (err) {
              toast.error(getApiMessage(err, 'Details saved, but some documents failed to upload'))
            }
          } catch {
            // Toast already shown
          }
        }}
      >
        {(fk) => {
          const showError = (field: keyof typeof fk.values) =>
            (fk.touched[field] || fk.submitCount > 0) && fk.errors[field]

          async function submitForm(e: { preventDefault: () => void }) {
            e.preventDefault()
            const errors = await fk.validateForm()
            await fk.setTouched(
              Object.fromEntries(Object.keys(fk.values).map((key) => [key, true])) as typeof fk.touched,
              false,
            )
            if (Object.keys(errors).length) {
              const nextTab = tabForErrors(errors)
              if (nextTab && nextTab !== tab) setTab(nextTab)
              const message = submitErrorToast(tab, errors)
              if (message) toast.error(message)
              return
            }
            await fk.submitForm()
          }

          return (
          <form onSubmit={(e) => void submitForm(e)} className="flex flex-col gap-8">
            {tab === 'details' && (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <div className="flex flex-col gap-6">
                  <div>
                    <input name="name" value={fk.values.name} onChange={fk.handleChange} onBlur={fk.handleBlur} placeholder="Driver Name" className={fieldClass} />
                    {showError('name') && <p className="mt-1 text-xs text-rose-600">{fk.errors.name}</p>}
                  </div>
                  <div>
                    <input name="email" value={fk.values.email} onChange={fk.handleChange} onBlur={fk.handleBlur} placeholder="Email" className={fieldClass} />
                    {showError('email') && <p className="mt-1 text-xs text-rose-600">{fk.errors.email}</p>}
                  </div>
                  <div>
                    <input name="phone" value={fk.values.phone} onChange={fk.handleChange} onBlur={fk.handleBlur} placeholder="Phone" className={fieldClass} />
                    {showError('phone') && <p className="mt-1 text-xs text-rose-600">{fk.errors.phone}</p>}
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <input name="memberCode" value={fk.values.memberCode} onChange={fk.handleChange} onBlur={fk.handleBlur} placeholder="Member ID" className={fieldClass} />
                      {showError('memberCode') && (
                        <p className="mt-1 text-xs text-rose-600">{fk.errors.memberCode}</p>
                      )}
                    </div>
                    <FilledSelect name="countryCode" value={fk.values.countryCode} onChange={fk.handleChange}>
                      <option value="NP">Nepal</option>
                      <option value="US">USA</option>
                      <option value="GB">UK</option>
                      <option value="IN">India</option>
                    </FilledSelect>
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <input name="city" value={fk.values.city} onChange={fk.handleChange} onBlur={fk.handleBlur} placeholder="City" className={fieldClass} />
                      {showError('city') && <p className="mt-1 text-xs text-rose-600">{fk.errors.city}</p>}
                    </div>
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
                      onQueued={queueFile}
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
                      onChange={(e) => fk.setFieldValue('vehicleNumber', normalizeVehicleNumber(e.target.value))}
                      onBlur={fk.handleBlur}
                      maxLength={20}
                      autoCapitalize="characters"
                      spellCheck={false}
                      placeholder="Vehicle Number"
                      aria-invalid={showError('vehicleNumber') ? true : undefined}
                      aria-describedby={showError('vehicleNumber') ? 'vehicleNumber-error' : undefined}
                      className={fieldClass}
                    />
                    {showError('vehicleNumber') && (
                      <p id="vehicleNumber-error" role="alert" className="mt-1 text-xs text-rose-600">
                        {fk.errors.vehicleNumber}
                      </p>
                    )}
                  </div>
                  <div>
                    <input
                      name="licenseNumber"
                      value={fk.values.licenseNumber}
                      onChange={fk.handleChange}
                      onBlur={fk.handleBlur}
                      placeholder="License Number"
                      className={fieldClass}
                    />
                    {showError('licenseNumber') && (
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
                      onQueued={queueFile}
                    />
                  ))}
                </div>
              </div>
            )}

            {tab === 'documents' && (
              <div>
                <p className="mb-3 text-xs text-[#262626]/70">JPG, PNG, WebP, GIF or PDF · max 5 MB</p>
                <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                  {DOCUMENT_SLOTS.map((slot) => (
                    <MediaSlot
                      key={slot.kind}
                      tall
                      label={slot.label}
                      kind={slot.kind}
                      url={docMap[slot.kind]?.fileUrl}
                      fileName={docMap[slot.kind]?.fileName}
                      driverId={driverId}
                      onQueued={queueFile}
                    />
                  ))}
                </div>
              </div>
            )}

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
          </form>
          )
        }}
      </Formik>
    </div>
  )
}
