import { useQuery } from '@tanstack/react-query'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { api, type Paginated } from '../../lib/api'
import { useAdminMutation } from '../../viewmodels/useAdminCrud'

const fieldClass =
  'h-11 w-full rounded-lg bg-[#E5E5E5] px-4 text-sm text-[#262626] outline-none placeholder:text-[#262626]/70'

type Plan = { id: string; name: string; code: string; priceCents: number; durationMonths: number }

const schema = Yup.object({
  userId: Yup.string().required('Required'),
  planId: Yup.string().required('Required'),
  method: Yup.string().required(),
})

export function MembershipCreateForm({ onClose }: { onClose: () => void }) {
  const mut = useAdminMutation(['memberships', 'plans', 'dashboard-members', 'membership-stats'])
  const plans = useQuery({
    queryKey: ['plans'],
    queryFn: async () => (await api.get<Plan[]>('/admin/membership-plans')).data,
  })
  const users = useQuery({
    queryKey: ['users-mini'],
    queryFn: async () =>
      (await api.get<Paginated<{ id: string; name: string }>>('/admin/users', { params: { limit: 50 } })).data,
  })

  return (
    <div className="-mx-8 -my-8 min-h-full bg-white px-8 py-8">
      <Formik
        initialValues={{ userId: '', planId: '', method: 'BANK' }}
        validationSchema={schema}
        onSubmit={async (values) => {
          try {
            await mut.run(() => api.post('/admin/memberships', values), {
              success: 'Membership added',
              error: 'Could not add membership',
            })
            onClose()
          } catch {
            // Toast already shown
          }
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
              <div>
                <select name="planId" value={fk.values.planId} onChange={fk.handleChange} className={fieldClass}>
                  <option value="">Plan</option>
                  {(plans.data ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {fk.touched.planId && fk.errors.planId && <p className="mt-1 text-xs text-rose-600">{fk.errors.planId}</p>}
              </div>
              <select name="method" value={fk.values.method} onChange={fk.handleChange} className={fieldClass}>
                <option value="BANK">Bank</option>
                <option value="WALLET">Wallet</option>
              </select>
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
