import type { ChangeEventHandler, ReactNode } from 'react'
import { Formik } from 'formik'
import { ChevronDown } from 'lucide-react'
import * as Yup from 'yup'
import { api } from '../../lib/api'
import { cn } from '../../lib/cn'
import { useAdminMutation } from '../../viewmodels/useAdminCrud'

type User = {
  id: string
  name: string
  email?: string | null
  phone: string
  countryCode: string
  city?: string | null
  status: string
}

const schema = Yup.object({
  name: Yup.string().required('Required'),
  phone: Yup.string().matches(/^[0-9]{10}$/, '10-digit phone').required('Required'),
  email: Yup.string().email().nullable(),
  city: Yup.string(),
  countryCode: Yup.string().required(),
  status: Yup.string().required(),
})

const fieldClass =
  'h-11 w-full rounded-lg bg-[#E5E5E5] px-4 text-sm text-[#262626] outline-none placeholder:text-[#262626]/70'

function FilledSelect({
  name,
  value,
  onChange,
  children,
}: {
  name: string
  value: string
  onChange: ChangeEventHandler<HTMLSelectElement>
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

export function UserDetailsForm({
  edit,
  onClose,
}: {
  edit: User | 'new'
  onClose: () => void
}) {
  const mut = useAdminMutation(['users', 'dashboard-summary'])
  const isNew = edit === 'new'

  return (
    <div className="-mx-8 -my-8 min-h-full bg-white px-8 py-8">
      <div className="mb-8">
        <span className="inline-flex h-14 items-center rounded-md bg-[#020B17] px-8 text-base text-white">Personal Info</span>
      </div>
      <Formik
        initialValues={
          isNew
            ? { name: '', phone: '', email: '', city: '', countryCode: 'NP', status: 'ACTIVE' }
            : {
                name: edit.name,
                phone: edit.phone,
                email: edit.email ?? '',
                city: edit.city ?? '',
                countryCode: edit.countryCode,
                status: edit.status,
              }
        }
        validationSchema={schema}
        onSubmit={async (values) => {
          if (isNew) await mut.mutateAsync(() => api.post('/admin/users', values))
          else await mut.mutateAsync(() => api.patch(`/admin/users/${edit.id}`, values))
          onClose()
        }}
      >
        {(fk) => (
          <form onSubmit={fk.handleSubmit} className="grid max-w-5xl grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2">
            <div>
              <input
                name="name"
                value={fk.values.name}
                onChange={fk.handleChange}
                placeholder="Full name"
                className={fieldClass}
              />
              {fk.touched.name && fk.errors.name && <p className="mt-1 text-xs text-rose-600">{fk.errors.name}</p>}
            </div>
            <div>
              <input
                name="phone"
                value={fk.values.phone}
                onChange={fk.handleChange}
                placeholder="Phone"
                className={fieldClass}
              />
              {fk.touched.phone && fk.errors.phone && <p className="mt-1 text-xs text-rose-600">{fk.errors.phone}</p>}
            </div>
            <FilledSelect name="countryCode" value={fk.values.countryCode} onChange={fk.handleChange}>
              <option value="NP">Nepal</option>
              <option value="US">USA</option>
              <option value="GB">UK</option>
              <option value="IN">India</option>
            </FilledSelect>
            <FilledSelect name="status" value={fk.values.status} onChange={fk.handleChange}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </FilledSelect>
            <div>
              <input
                name="email"
                value={fk.values.email}
                onChange={fk.handleChange}
                placeholder="Email"
                className={fieldClass}
              />
              {fk.touched.email && fk.errors.email && <p className="mt-1 text-xs text-rose-600">{fk.errors.email}</p>}
            </div>
            <input
              name="city"
              value={fk.values.city}
              onChange={fk.handleChange}
              placeholder="City"
              className={fieldClass}
            />
            <div className="flex justify-end gap-3 md:col-span-2">
              <button
                type="button"
                onClick={onClose}
                className="h-11 rounded-md border border-black/12 px-6 text-sm text-black"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={fk.isSubmitting}
                className="h-11 rounded-md bg-accent px-6 text-sm font-medium text-black disabled:opacity-60"
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
