import { Formik } from 'formik'
import * as Yup from 'yup'
import { api } from '../../lib/api'
import { MAX_PRICE_RUPEES, PRICE_TOO_LARGE_MESSAGE, rupeesFitIntCents } from '../../lib/validation'
import { useAdminMutation } from '../../viewmodels/useAdminCrud'

const fieldClass =
  'h-11 w-full rounded-lg bg-[#E5E5E5] px-4 text-sm text-[#262626] outline-none placeholder:text-[#262626]/70'

const schema = Yup.object({
  name: Yup.string().required('Required'),
  code: Yup.string().required('Required'),
  price: Yup.number()
    .typeError('Enter a valid price')
    .min(0, 'Must be 0 or more')
    .test('fits-int-cents', PRICE_TOO_LARGE_MESSAGE, (value) => value == null || rupeesFitIntCents(value))
    .required('Required'),
  durationMonths: Yup.number().min(1).required('Required'),
})

export function PlanDetailsForm({ onClose }: { onClose: () => void }) {
  const mut = useAdminMutation(['memberships', 'plans', 'dashboard-members', 'membership-stats'])

  return (
    <div className="-mx-8 -my-8 min-h-full bg-white px-8 py-8">
      <Formik
        initialValues={{ name: '', code: '', price: 15000, durationMonths: 12 }}
        validationSchema={schema}
        onSubmit={async (values) => {
          try {
            await mut.run(
              () =>
                api.post('/admin/membership-plans', {
                  name: values.name,
                  code: values.code,
                  priceCents: Math.round(Number(values.price) * 100),
                  durationMonths: Number(values.durationMonths),
                  isActive: true,
                }),
              { success: 'Plan created', error: 'Could not create plan' },
            )
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
                <input name="name" value={fk.values.name} onChange={fk.handleChange} placeholder="Plan Name" className={fieldClass} />
                {fk.touched.name && fk.errors.name && <p className="mt-1 text-xs text-rose-600">{fk.errors.name}</p>}
              </div>
              <div>
                <input name="code" value={fk.values.code} onChange={fk.handleChange} placeholder="Plan Code" className={fieldClass} />
                {fk.touched.code && fk.errors.code && <p className="mt-1 text-xs text-rose-600">{fk.errors.code}</p>}
              </div>
              <div>
                <input
                  id="plan-price"
                  type="number"
                  name="price"
                  min={0}
                  max={MAX_PRICE_RUPEES}
                  step="0.01"
                  value={fk.values.price}
                  onChange={fk.handleChange}
                  placeholder="Price"
                  aria-invalid={Boolean(fk.touched.price && fk.errors.price)}
                  aria-describedby={fk.touched.price && fk.errors.price ? 'plan-price-error' : undefined}
                  className={fieldClass}
                />
                {fk.touched.price && fk.errors.price && (
                  <p id="plan-price-error" role="alert" className="mt-1 text-xs text-rose-600">
                    {fk.errors.price}
                  </p>
                )}
              </div>
              <div>
                <input
                  type="number"
                  name="durationMonths"
                  min={1}
                  value={fk.values.durationMonths}
                  onChange={fk.handleChange}
                  placeholder="Duration (months)"
                  className={fieldClass}
                />
                {fk.touched.durationMonths && fk.errors.durationMonths && (
                  <p className="mt-1 text-xs text-rose-600">{fk.errors.durationMonths}</p>
                )}
              </div>
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
