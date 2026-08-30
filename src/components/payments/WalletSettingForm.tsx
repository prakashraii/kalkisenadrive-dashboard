import { useQuery } from '@tanstack/react-query'
import { Formik } from 'formik'
import { Check } from 'lucide-react'
import * as Yup from 'yup'
import { api } from '../../lib/api'
import { useAdminMutation } from '../../viewmodels/useAdminCrud'
import { ImageUpload } from '../ui/ImageUpload'

const fieldClass =
  'h-11 w-full rounded-lg bg-[#E5E5E5] px-4 text-sm text-[#262626] outline-none placeholder:text-[#262626]/70'

const detailsClass =
  'min-h-[280px] w-full resize-none rounded-lg bg-[#E5E5E5] px-4 py-3 text-sm text-[#262626] outline-none placeholder:text-[#262626]/70'

export type WalletAccount = {
  id: string
  name: string
  details: string
  qrUrl?: string | null
  isDefault: boolean
}

const schema = Yup.object({
  name: Yup.string().required('Required'),
  details: Yup.string().required('Required'),
})

export function WalletSettingForm({
  walletId,
  onClose,
}: {
  walletId: string | 'new'
  onClose: () => void
}) {
  const mut = useAdminMutation(['wallets', 'banks', 'payments', 'payments-summary'])
  const isNew = walletId === 'new'

  const { data: wallet } = useQuery({
    queryKey: ['wallet-account', walletId],
    queryFn: async () => (await api.get<WalletAccount>(`/admin/wallet-accounts/${walletId}`)).data,
    enabled: !isNew,
  })

  const initialValues = {
    name: wallet?.name ?? '',
    details: wallet?.details ?? '',
    qrUrl: wallet?.qrUrl ?? '',
  }

  return (
    <div className="-mx-8 -my-8 min-h-full bg-white px-8 py-8">
      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={schema}
        onSubmit={async (values) => {
          const payload = {
            name: values.name.trim(),
            details: values.details.trim(),
            qrUrl: values.qrUrl.trim() || undefined,
            isDefault: wallet?.isDefault ?? isNew,
          }
          try {
            if (isNew) {
              await mut.run(() => api.post('/admin/wallet-accounts', payload), {
                success: 'Wallet added',
                error: 'Could not add wallet',
              })
            } else {
              await mut.run(() => api.patch(`/admin/wallet-accounts/${walletId}`, payload), {
                success: 'Wallet updated',
                error: 'Could not update wallet',
              })
            }
            onClose()
          } catch {
            // Toast already shown
          }
        }}
      >
        {(fk) => (
          <form onSubmit={fk.handleSubmit} className="mx-auto flex max-w-3xl flex-col gap-6">
            <div>
              <input
                name="name"
                value={fk.values.name}
                onChange={fk.handleChange}
                placeholder="Wallet name (eSewa, Khalti, …)"
                className={fieldClass}
              />
              {fk.touched.name && fk.errors.name && (
                <p className="mt-1 text-xs text-rose-600">{fk.errors.name}</p>
              )}
            </div>

            <div>
              <textarea
                name="details"
                value={fk.values.details}
                onChange={fk.handleChange}
                placeholder="Wallet ID or payment details"
                className={detailsClass}
              />
              {fk.touched.details && fk.errors.details && (
                <p className="mt-1 text-xs text-rose-600">{fk.errors.details}</p>
              )}
            </div>

            <ImageUpload
              value={fk.values.qrUrl}
              onChange={(url) => void fk.setFieldValue('qrUrl', url)}
              folder="payments"
              label="QR code"
              className="min-h-[220px]"
            />

            <div className="mt-4 flex justify-center gap-3">
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
                className="inline-flex h-11 items-center gap-2 rounded-md bg-[#001E5E] px-8 text-sm font-medium text-white disabled:opacity-60"
              >
                <Check className="size-4" />
                {fk.isSubmitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </Formik>
    </div>
  )
}
