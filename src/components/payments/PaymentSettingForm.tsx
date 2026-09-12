import { useQuery } from '@tanstack/react-query'
import { Formik } from 'formik'
import { ChevronDown, Landmark } from 'lucide-react'
import type { ChangeEventHandler, FocusEventHandler, ReactNode } from 'react'
import * as Yup from 'yup'
import { api } from '../../lib/api'
import { cn } from '../../lib/cn'
import { ACCOUNT_NUMBER_MESSAGE, accountNumberError } from '../../lib/validation'
import { useAdminMutation } from '../../viewmodels/useAdminCrud'
import { ImageUpload } from '../ui/ImageUpload'

const fieldClass =
  'h-11 w-full rounded-lg bg-[#E5E5E5] px-4 text-sm text-[#262626] outline-none placeholder:text-[#262626]/70'

const textareaClass =
  'min-h-[160px] w-full resize-none rounded-lg bg-[#E5E5E5] px-4 py-3 text-sm text-[#262626] outline-none placeholder:text-[#262626]/70'

const BANKS = [
  'Nabil Bank',
  'NIC Asia',
  'NMB Bank',
  'Global IME',
  'Himalayan Bank',
  'Nepal Investment Mega Bank',
  'Siddhartha Bank',
  'Sanima Bank',
  'Prime Commercial Bank',
  'Rastriya Banijya Bank',
  'Nepal Bank Limited',
  'Machhapuchchhre Bank',
  'Kumari Bank',
  'Laxmi Sunrise',
  'Everest Bank',
]

const BRANCHES = [
  'Durbar Marg',
  'New Road',
  'Thamel',
  'Lazimpat',
  'Baneshwor',
  'Putalisadak',
  'Kalanki',
  'Maharajgunj',
  'Pulchowk',
  'Jawalakhel',
]

export type BankAccount = {
  id: string
  bankName: string
  accountName: string
  accountNumberMasked: string
  branch?: string | null
  notes?: string | null
  qrUrl?: string | null
  isDefault: boolean
}

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null
  return (
    <p id={id} className="mt-1 text-xs text-rose-600" role="alert">
      {error}
    </p>
  )
}

const schema = Yup.object({
  accountName: Yup.string().trim().required('Required'),
  bankName: Yup.string().trim().required('Required'),
  branch: Yup.string().trim().required('Required'),
  accountNumberMasked: Yup.string()
    .required('Required')
    .test('account-number', ACCOUNT_NUMBER_MESSAGE, function accountNumber(value) {
      const message = accountNumberError(value ?? '')
      if (!message || message === 'Required') return true
      return this.createError({ message })
    }),
  isDefault: Yup.string().required(),
  notes: Yup.string(),
  qrUrl: Yup.string(),
})

function FilledSelect({
  name,
  value,
  onChange,
  onBlur,
  disabled,
  invalid,
  describedBy,
  required,
  children,
}: {
  name: string
  value: string
  onChange?: ChangeEventHandler<HTMLSelectElement>
  onBlur?: FocusEventHandler<HTMLSelectElement>
  disabled?: boolean
  invalid?: boolean
  describedBy?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div className="relative">
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-required={required || undefined}
        aria-describedby={describedBy}
        className={cn(fieldClass, 'appearance-none pr-10 disabled:opacity-80', invalid && 'ring-1 ring-rose-500')}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#262626]" />
    </div>
  )
}

export function PaymentSettingForm({
  bankId,
  onClose,
}: {
  bankId: string | 'new'
  onClose: () => void
}) {
  const mut = useAdminMutation(['banks', 'payments'])
  const isNew = bankId === 'new'

  const { data: bank } = useQuery({
    queryKey: ['bank', bankId],
    queryFn: async () => (await api.get<BankAccount>(`/admin/bank-accounts/${bankId}`)).data,
    enabled: !isNew,
  })

  const initialValues = {
    accountName: bank?.accountName ?? '',
    bankName: bank?.bankName ?? '',
    branch: bank?.branch ?? '',
    accountNumberMasked: bank?.accountNumberMasked ?? '',
    isDefault: bank?.isDefault ? 'yes' : 'no',
    notes: bank?.notes ?? '',
    qrUrl: bank?.qrUrl ?? '',
  }

  const bankOptions = [initialValues.bankName, ...BANKS].filter((name, i, all) => name && all.indexOf(name) === i)
  const branchOptions = [initialValues.branch, ...BRANCHES].filter((name, i, all) => name && all.indexOf(name) === i)

  return (
    <div className="-mx-8 -my-8 min-h-full bg-white px-8 py-8">
      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={schema}
        onSubmit={async (values) => {
          if (!values.branch.trim()) return
          const payload = {
            accountName: values.accountName.trim(),
            bankName: values.bankName.trim(),
            branch: values.branch.trim(),
            accountNumberMasked: values.accountNumberMasked.trim(),
            isDefault: values.isDefault === 'yes',
            notes: values.notes.trim() || undefined,
            qrUrl: values.qrUrl.trim() || undefined,
          }
          try {
            if (isNew) {
              await mut.run(() => api.post('/admin/bank-accounts', payload), {
                success: 'Bank account added',
                error: 'Could not add bank account',
              })
            } else {
              await mut.run(() => api.patch(`/admin/bank-accounts/${bankId}`, payload), {
                success: 'Bank account updated',
                error: 'Could not update bank account',
              })
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
          return (
          <form noValidate onSubmit={fk.handleSubmit} className="max-w-6xl">
            <div className="mb-6">
              <span className="inline-flex h-10 items-center gap-2 rounded-md bg-[#020B17] px-4 text-sm text-white">
                <Landmark className="size-4" />
                Bank
              </span>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.7fr)]">
              <div className="flex flex-col gap-6">
                <div>
                  <input
                    id="accountName"
                    name="accountName"
                    value={fk.values.accountName}
                    onChange={fk.handleChange}
                    onBlur={fk.handleBlur}
                    placeholder="Account Name"
                    className={cn(fieldClass, showError('accountName') && 'ring-1 ring-rose-500')}
                    aria-required="true"
                    aria-invalid={showError('accountName') || undefined}
                    aria-describedby={showError('accountName') ? 'accountName-error' : undefined}
                  />
                  <FieldError id="accountName-error" error={showError('accountName') ? fk.errors.accountName : undefined} />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <FilledSelect
                      name="bankName"
                      required
                      value={fk.values.bankName}
                      onChange={fk.handleChange}
                      onBlur={fk.handleBlur}
                      invalid={showError('bankName')}
                      describedBy={showError('bankName') ? 'bankName-error' : undefined}
                    >
                      <option value="">Bank Name</option>
                      {bankOptions.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </FilledSelect>
                    <FieldError id="bankName-error" error={showError('bankName') ? fk.errors.bankName : undefined} />
                  </div>
                  <div>
                    <FilledSelect
                      name="branch"
                      required
                      value={fk.values.branch}
                      onChange={fk.handleChange}
                      onBlur={fk.handleBlur}
                      invalid={showError('branch')}
                      describedBy={showError('branch') ? 'branch-error' : undefined}
                    >
                      <option value="">Branch</option>
                      {branchOptions.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </FilledSelect>
                    <FieldError id="branch-error" error={showError('branch') ? fk.errors.branch : undefined} />
                  </div>
                </div>

                <div>
                  <input
                    id="account-number"
                    name="accountNumberMasked"
                    value={fk.values.accountNumberMasked}
                    onChange={fk.handleChange}
                    onBlur={fk.handleBlur}
                    inputMode="numeric"
                    maxLength={16}
                    placeholder="Account Number"
                    className={cn(fieldClass, showError('accountNumberMasked') && 'ring-1 ring-rose-500')}
                    autoComplete="off"
                    aria-required="true"
                    aria-invalid={showError('accountNumberMasked') || undefined}
                    aria-describedby={showError('accountNumberMasked') ? 'account-number-error' : undefined}
                  />
                  <FieldError
                    id="account-number-error"
                    error={showError('accountNumberMasked') ? fk.errors.accountNumberMasked : undefined}
                  />
                </div>

                <FilledSelect name="isDefault" value={fk.values.isDefault} onChange={fk.handleChange}>
                  <option value="yes">Default account</option>
                  <option value="no">Secondary account</option>
                </FilledSelect>

                <textarea
                  name="notes"
                  value={fk.values.notes}
                  onChange={fk.handleChange}
                  placeholder="Payment instructions"
                  className={textareaClass}
                />
              </div>

              <ImageUpload
                value={fk.values.qrUrl}
                onChange={(url) => void fk.setFieldValue('qrUrl', url)}
                folder="payments"
                label="QR code"
                className="min-h-[420px]"
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
              <button
                type="submit"
                disabled={fk.isSubmitting}
                className="h-11 rounded-md bg-[#001E5E] px-6 text-sm font-medium text-white disabled:opacity-60"
              >
                {fk.isSubmitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
          )
        }}
      </Formik>
    </div>
  )
}
