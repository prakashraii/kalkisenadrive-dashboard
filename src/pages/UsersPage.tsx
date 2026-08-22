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
import { flagEmoji, countryName } from '../lib/cn'

type User = {
  id: string
  publicId: string
  memberCode: string
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

export function UsersPage() {
  const list = useAdminList<User>('users', '/admin/users')
  const mut = useAdminMutation(['users'])
  const [edit, setEdit] = useState<User | null | 'new'>(null)
  const [del, setDel] = useState<User | null>(null)

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Users</h2>
        <button onClick={() => setEdit('new')} className="h-9 rounded-lg bg-violet-600 px-3 text-sm font-medium text-white">
          Add user
        </button>
      </div>
      <TableToolbar search={list.search} onSearch={list.setSearch} country={list.country} onCountry={list.setCountry} from={list.from} onFrom={list.setFrom} />
      <DataTable columns={['ID', 'Name', 'Contact', 'Member ID', 'Country', 'City', 'Status', 'Action']}>
        {(list.data?.data ?? []).map((u) => (
          <tr key={u.id}>
            <td className="px-3 py-3">{u.publicId}</td>
            <td className="px-3 py-3 font-medium">{u.name}</td>
            <td className="px-3 py-3 text-xs">
              {u.email}
              <br />
              {u.phone}
            </td>
            <td className="px-3 py-3">{u.memberCode}</td>
            <td className="px-3 py-3">
              {flagEmoji(u.countryCode)} {countryName(u.countryCode)}
            </td>
            <td className="px-3 py-3">{u.city}</td>
            <td className="px-3 py-3">
              <StatusBadge status={u.status} />
            </td>
            <td className="px-3 py-3">
              <ActionButtons onEdit={() => setEdit(u)} onDelete={() => setDel(u)} />
            </td>
          </tr>
        ))}
      </DataTable>
      <Pagination page={list.data?.meta.page ?? 1} pageCount={list.data?.meta.pageCount ?? 1} total={list.data?.meta.total ?? 0} limit={10} onPage={list.setPage} />

      <Modal title={edit === 'new' ? 'Add user' : 'Edit user'} open={!!edit} onClose={() => setEdit(null)}>
        {edit && (
          <Formik
            initialValues={
              edit === 'new'
                ? { name: '', phone: '', email: '', city: '', countryCode: 'NP', status: 'ACTIVE' }
                : { name: edit.name, phone: edit.phone, email: edit.email ?? '', city: edit.city ?? '', countryCode: edit.countryCode, status: edit.status }
            }
            validationSchema={schema}
            onSubmit={async (values) => {
              if (edit === 'new') await mut.mutateAsync(() => api.post('/admin/users', values))
              else await mut.mutateAsync(() => api.patch(`/admin/users/${edit.id}`, values))
              setEdit(null)
            }}
          >
            {(fk) => (
              <form onSubmit={fk.handleSubmit} className="space-y-3">
                <FormField label="Name" required error={fk.touched.name ? fk.errors.name : undefined}>
                  <TextInput name="name" value={fk.values.name} onChange={fk.handleChange} />
                </FormField>
                <FormField label="Phone" required error={fk.touched.phone ? fk.errors.phone : undefined}>
                  <TextInput name="phone" value={fk.values.phone} onChange={fk.handleChange} />
                </FormField>
                <FormField label="Email">
                  <TextInput name="email" value={fk.values.email} onChange={fk.handleChange} />
                </FormField>
                <FormField label="City">
                  <TextInput name="city" value={fk.values.city} onChange={fk.handleChange} />
                </FormField>
                <SelectField label="Country" name="countryCode" value={fk.values.countryCode} onChange={fk.handleChange}>
                  <option value="NP">Nepal</option>
                  <option value="US">USA</option>
                  <option value="GB">UK</option>
                </SelectField>
                <SelectField label="Status" name="status" value={fk.values.status} onChange={fk.handleChange}>
                  <option>ACTIVE</option>
                  <option>INACTIVE</option>
                  <option>SUSPENDED</option>
                </SelectField>
                <FormActions onCancel={() => setEdit(null)} pending={fk.isSubmitting} />
              </form>
            )}
          </Formik>
        )}
      </Modal>
      <ConfirmDialog
        open={!!del}
        title="Delete user"
        message="This cannot be undone."
        onClose={() => setDel(null)}
        pending={mut.isPending}
        onConfirm={async () => {
          if (!del) return
          await mut.mutateAsync(() => api.delete(`/admin/users/${del.id}`))
          setDel(null)
        }}
      />
    </div>
  )
}
