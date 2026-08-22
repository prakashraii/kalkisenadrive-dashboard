import { useState } from 'react'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { api } from '../lib/api'
import { useAdminList, useAdminMutation } from '../viewmodels/useAdminCrud'
import { DataTable } from '../components/ui/DataTable'
import { Pagination } from '../components/ui/Pagination'
import { TableToolbar } from '../components/ui/TableToolbar'
import { StatusBadge } from '../components/ui/StatusBadge'
import { ActionButtons, Modal } from '../components/ui/Actions'
import { FormActions, FormField, SelectField, TextInput } from '../components/ui/FormField'

type Driver = {
  id: string
  publicId: string
  name: string
  phone: string
  licenseNumber: string
  vehicleType: string
  vehicleNumber: string
  city?: string | null
  status: string
}

export function DriversPage() {
  const list = useAdminList<Driver>('drivers', '/admin/drivers')
  const mut = useAdminMutation(['drivers'])
  const [create, setCreate] = useState(false)
  const [view, setView] = useState<Driver | null>(null)

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Driver Registration</h2>
        <button onClick={() => setCreate(true)} className="h-9 rounded-lg bg-violet-600 px-3 text-sm font-medium text-white">
          Add registration
        </button>
      </div>
      <TableToolbar search={list.search} onSearch={list.setSearch} country={list.country} onCountry={list.setCountry} />
      <DataTable columns={['ID', 'Name', 'Phone', 'License', 'Vehicle', 'City', 'Status', 'Action']}>
        {(list.data?.data ?? []).map((d) => (
          <tr key={d.id}>
            <td className="px-3 py-3">{d.publicId}</td>
            <td className="px-3 py-3 font-medium">{d.name}</td>
            <td className="px-3 py-3">{d.phone}</td>
            <td className="px-3 py-3">{d.licenseNumber}</td>
            <td className="px-3 py-3">
              {d.vehicleType} · {d.vehicleNumber}
            </td>
            <td className="px-3 py-3">{d.city}</td>
            <td className="px-3 py-3">
              <StatusBadge status={d.status} />
            </td>
            <td className="px-3 py-3">
              <ActionButtons onView={() => setView(d)} />
            </td>
          </tr>
        ))}
      </DataTable>
      <Pagination page={list.data?.meta.page ?? 1} pageCount={list.data?.meta.pageCount ?? 1} total={list.data?.meta.total ?? 0} limit={10} onPage={list.setPage} />

      <Modal title="Driver" open={!!view} onClose={() => setView(null)}>
        {view && (
          <div className="space-y-3">
            <p className="text-sm">
              {view.name} · {view.vehicleType} {view.vehicleNumber}
            </p>
            {view.status === 'PENDING' && (
              <div className="flex justify-end gap-2">
                <button className="h-9 rounded-lg border px-3 text-sm" onClick={() => mut.mutateAsync(() => api.patch(`/admin/drivers/${view.id}/reject`)).then(() => setView(null))}>
                  Reject
                </button>
                <button className="h-9 rounded-lg bg-emerald-600 px-3 text-sm text-white" onClick={() => mut.mutateAsync(() => api.patch(`/admin/drivers/${view.id}/approve`)).then(() => setView(null))}>
                  Approve
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal title="Add registration" open={create} onClose={() => setCreate(false)}>
        <Formik
          initialValues={{ name: '', phone: '', licenseNumber: '', vehicleType: 'Bike', vehicleNumber: '', city: '', countryCode: 'NP' }}
          validationSchema={Yup.object({ name: Yup.string().required(), phone: Yup.string().required(), licenseNumber: Yup.string().required(), vehicleNumber: Yup.string().required() })}
          onSubmit={async (values) => {
            await mut.mutateAsync(() => api.post('/admin/drivers', values))
            setCreate(false)
          }}
        >
          {(fk) => (
            <form onSubmit={fk.handleSubmit} className="space-y-3">
              <FormField label="Name" required>
                <TextInput name="name" value={fk.values.name} onChange={fk.handleChange} />
              </FormField>
              <FormField label="Phone" required>
                <TextInput name="phone" value={fk.values.phone} onChange={fk.handleChange} />
              </FormField>
              <FormField label="License" required>
                <TextInput name="licenseNumber" value={fk.values.licenseNumber} onChange={fk.handleChange} />
              </FormField>
              <SelectField label="Vehicle type" name="vehicleType" value={fk.values.vehicleType} onChange={fk.handleChange}>
                <option>Bike</option>
                <option>Car</option>
                <option>Scooter</option>
              </SelectField>
              <FormField label="Vehicle number" required>
                <TextInput name="vehicleNumber" value={fk.values.vehicleNumber} onChange={fk.handleChange} />
              </FormField>
              <FormField label="City">
                <TextInput name="city" value={fk.values.city} onChange={fk.handleChange} />
              </FormField>
              <FormActions onCancel={() => setCreate(false)} pending={fk.isSubmitting} />
            </form>
          )}
        </Formik>
      </Modal>
    </div>
  )
}
