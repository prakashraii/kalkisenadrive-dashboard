import { useQuery } from '@tanstack/react-query'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { api, type Paginated } from '../../lib/api'
import { useAdminMutation } from '../../viewmodels/useAdminCrud'

const fieldClass =
  'h-11 w-full rounded-lg bg-[#E5E5E5] px-4 text-sm text-[#262626] outline-none placeholder:text-[#262626]/70'

const schema = Yup.object({
  userId: Yup.string().required('Required'),
  type: Yup.string().required(),
  amount: Yup.number().min(1, 'Must be 1 or more').required('Required'),
  method: Yup.string().required(),
  note: Yup.string(),
})

export function DonationRecordForm({
  defaultType = 'DOWRY',
  onClose,
}: {
  defaultType?: string
  onClose: () => void
}) {
  const mut = useAdminMutation(['donations', 'donation-stats', 'dashboard-summary', 'dashboard-donated'])
  const users = useQuery({
    queryKey: ['users-mini'],
    queryFn: async () =>
      (await api.get<Paginated<{ id: string; name: string }>>('/admin/users', { params: { limit: 50 } })).data,
  })

  return (
    <div className="-mx-8 -my-8 min-h-full bg-white px-8 py-8">
      <Formik
        initialValues={{ userId: '', type: defaultType, amount: 150, method: 'BANK', note: '' }}
        validationSchema={schema}
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
          <form onSubmit={fk.handleSubmit} className="max-w-3xl">
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2">
              <div>
                <select name="userId" value={fk.values.userId} onChange={fk.handleChange} className={fieldClass}>
                  <option value="">User</option>
                  {(users.data?.data ?? []).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                {fk.touched.userId && fk.errors.userId && <p className="mt-1 text-xs text-rose-600">{fk.errors.userId}</p>}
              </div>
              <select name="type" value={fk.values.type} onChange={fk.handleChange} className={fieldClass}>
                <option value="DOWRY">Dowry</option>
                <option value="DOCTOR">Doctor</option>
                <option value="GENERAL">General</option>
              </select>
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
              <select name="method" value={fk.values.method} onChange={fk.handleChange} className={fieldClass}>
                <option value="BANK">Bank</option>
                <option value="WALLET">Wallet</option>
              </select>
              <textarea
                name="note"
                value={fk.values.note}
                onChange={fk.handleChange}
                placeholder="Note"
                className="min-h-[120px] w-full resize-none rounded-lg bg-[#E5E5E5] px-4 py-3 text-sm outline-none md:col-span-2"
              />
            </div>
            <div className="mt-8 flex justify-end gap-3">
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
