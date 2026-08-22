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
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { FormActions, FormField, SelectField, TextInput } from '../components/ui/FormField'

type Clinic = {
  id: string
  name: string
  phone?: string | null
  city: string
  countryCode: string
  address?: string | null
  status: string
  memberCount: number
}

export function ClinicsPage() {
  const list = useAdminList<Clinic>('clinics', '/admin/clinics')
  const mut = useAdminMutation(['clinics'])
  const [edit, setEdit] = useState<Clinic | null | 'new'>(null)
  const [del, setDel] = useState<Clinic | null>(null)

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Kalki Sena Clinic</h2>
        <button onClick={() => setEdit('new')} className="h-9 rounded-lg bg-violet-600 px-3 text-sm font-medium text-white">
          Add clinic
        </button>
      </div>
      <TableToolbar search={list.search} onSearch={list.setSearch} />
      <DataTable columns={['Name', 'City', 'Phone', 'Members', 'Status', 'Action']}>
        {(list.data?.data ?? []).map((c) => (
          <tr key={c.id}>
            <td className="px-3 py-3 font-medium">{c.name}</td>
            <td className="px-3 py-3">{c.city}</td>
            <td className="px-3 py-3">{c.phone}</td>
            <td className="px-3 py-3">{c.memberCount}</td>
            <td className="px-3 py-3">
              <StatusBadge status={c.status} />
            </td>
            <td className="px-3 py-3">
              <ActionButtons onEdit={() => setEdit(c)} onDelete={() => setDel(c)} />
            </td>
          </tr>
        ))}
      </DataTable>
      <Pagination page={list.data?.meta.page ?? 1} pageCount={list.data?.meta.pageCount ?? 1} total={list.data?.meta.total ?? 0} limit={10} onPage={list.setPage} />

      <Modal title={edit === 'new' ? 'Add clinic' : 'Edit clinic'} open={!!edit} onClose={() => setEdit(null)}>
        {edit && (
          <Formik
            initialValues={
              edit === 'new'
                ? { name: '', phone: '', city: '', countryCode: 'NP', address: '', status: 'ACTIVE' }
                : { name: edit.name, phone: edit.phone ?? '', city: edit.city, countryCode: edit.countryCode, address: edit.address ?? '', status: edit.status }
            }
            validationSchema={Yup.object({ name: Yup.string().required(), city: Yup.string().required() })}
            onSubmit={async (values) => {
              if (edit === 'new') await mut.mutateAsync(() => api.post('/admin/clinics', values))
              else await mut.mutateAsync(() => api.patch(`/admin/clinics/${edit.id}`, values))
              setEdit(null)
            }}
          >
            {(fk) => (
              <form onSubmit={fk.handleSubmit} className="space-y-3">
                <FormField label="Name" required>
                  <TextInput name="name" value={fk.values.name} onChange={fk.handleChange} />
                </FormField>
                <FormField label="City" required>
                  <TextInput name="city" value={fk.values.city} onChange={fk.handleChange} />
                </FormField>
                <FormField label="Phone">
                  <TextInput name="phone" value={fk.values.phone} onChange={fk.handleChange} />
                </FormField>
                <FormField label="Address">
                  <TextInput name="address" value={fk.values.address} onChange={fk.handleChange} />
                </FormField>
                <SelectField label="Status" name="status" value={fk.values.status} onChange={fk.handleChange}>
                  <option>ACTIVE</option>
                  <option>INACTIVE</option>
                </SelectField>
                <FormActions onCancel={() => setEdit(null)} pending={fk.isSubmitting} />
              </form>
            )}
          </Formik>
        )}
      </Modal>
      <ConfirmDialog
        open={!!del}
        title="Remove clinic"
        message="The clinic will be archived."
        onClose={() => setDel(null)}
        onConfirm={async () => {
          if (!del) return
          await mut.mutateAsync(() => api.delete(`/admin/clinics/${del.id}`))
          setDel(null)
        }}
      />
    </div>
  )
}
