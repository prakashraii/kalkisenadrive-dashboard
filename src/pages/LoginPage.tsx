import { Formik } from 'formik'
import * as Yup from 'yup'
import { useLoginViewModel } from '../viewmodels/useLoginViewModel'
import { FormField, TextInput } from '../components/ui/FormField'

const schema = Yup.object({
  email: Yup.string().email('Enter a valid email').required('Required'),
  password: Yup.string().min(8, 'At least 8 characters').required('Required'),
})

export function LoginPage() {
  const vm = useLoginViewModel()

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-[420px] flex-col justify-between bg-sidebar p-10 text-white md:flex">
        <div>
          <img src="/kalki-sena-logo.png" alt="Kalki Sena Drive" className="w-full object-contain" />
          <h1 className="sr-only">KALKI SENA DRIVE</h1>
          <p className="mt-2 text-white/70">Donations, memberships, clinic, books, and driver registrations.</p>
        </div>
        <p className="text-xs text-white/40">Admin dashboard</p>
      </div>
      <div className="flex flex-1 items-center justify-center bg-page p-6">
        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={schema}
          onSubmit={async (values, helpers) => {
            try {
              await vm.submit(values)
            } finally {
              helpers.setSubmitting(false)
            }
          }}
        >
          {(fk) => (
            <form onSubmit={fk.handleSubmit} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-semibold">Sign in</h2>
              <p className="mt-1 text-sm text-slate-500">Enter your admin credentials to continue.</p>
              <div className="mt-6 space-y-4">
                <FormField label="Email" error={fk.touched.email ? fk.errors.email : undefined} required>
                  <TextInput name="email" value={fk.values.email} onChange={fk.handleChange} error={fk.touched.email ? fk.errors.email : undefined} />
                </FormField>
                <FormField label="Password" error={fk.touched.password ? fk.errors.password : undefined} required>
                  <TextInput
                    type="password"
                    name="password"
                    value={fk.values.password}
                    onChange={fk.handleChange}
                    error={fk.touched.password ? fk.errors.password : undefined}
                  />
                </FormField>
              </div>
              {vm.error && <p className="mt-3 text-sm text-rose-600">{vm.error}</p>}
              <button disabled={fk.isSubmitting} className="mt-6 h-10 w-full rounded-lg bg-sidebar font-medium text-white disabled:opacity-60">
                {fk.isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          )}
        </Formik>
      </div>
    </div>
  )
}
