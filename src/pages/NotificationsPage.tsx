import { useState } from 'react'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAdminList, useAdminMutation } from '../viewmodels/useAdminCrud'
import { DataTable } from '../components/ui/DataTable'
import { Pagination } from '../components/ui/Pagination'
import { TableToolbar } from '../components/ui/TableToolbar'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Modal } from '../components/ui/Actions'
import { FormActions, FormField, SelectField, TextInput } from '../components/ui/FormField'
import { formatDateTime } from '../lib/cn'

type Campaign = {
  id: string
  title: string
  body: string
  audience: string
  status: string
  sentAt?: string | null
  sentCount: number
}

type Note = { id: string; title: string; body: string; readAt?: string | null; createdAt: string }

export function NotificationsPage() {
  const list = useAdminList<Campaign>('push', '/admin/push-campaigns')
  const notes = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => (await api.get<{ unread: number; data: Note[] }>('/admin/notifications')).data,
  })
  const mut = useAdminMutation(['push', 'admin-notifications'])
  const [create, setCreate] = useState(false)

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Inbox</h2>
          <button className="h-9 rounded-lg border px-3 text-sm" onClick={() => mut.mutateAsync(() => api.post('/admin/notifications/read-all'))}>
            Mark all read
          </button>
        </div>
        <ul className="divide-y">
          {(notes.data?.data ?? []).map((n) => (
            <li key={n.id} className="flex items-start justify-between gap-3 py-3">
              <div>
                <p className="font-medium">{n.title}</p>
                <p className="text-sm text-slate-500">{n.body}</p>
                <p className="mt-1 text-xs text-slate-400">{formatDateTime(n.createdAt)}</p>
              </div>
              {!n.readAt && (
                <button className="text-xs text-violet-600" onClick={() => mut.mutateAsync(() => api.patch(`/admin/notifications/${n.id}/read`))}>
                  Mark read
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Push campaigns</h2>
          <button onClick={() => setCreate(true)} className="h-9 rounded-lg bg-violet-600 px-3 text-sm font-medium text-white">
            New campaign
          </button>
        </div>
        <TableToolbar search={list.search} onSearch={list.setSearch} />
        <DataTable columns={['Title', 'Audience', 'Status', 'Sent', 'Action']}>
          {(list.data?.data ?? []).map((c) => (
            <tr key={c.id}>
              <td className="px-3 py-3">
                <p className="font-medium">{c.title}</p>
                <p className="text-xs text-slate-500">{c.body}</p>
              </td>
              <td className="px-3 py-3">{c.audience}</td>
              <td className="px-3 py-3">
                <StatusBadge status={c.status} />
              </td>
              <td className="px-3 py-3">{c.sentCount}</td>
              <td className="px-3 py-3">
                {c.status === 'DRAFT' && (
                  <button className="text-sm text-violet-600" onClick={() => mut.mutateAsync(() => api.post(`/admin/push-campaigns/${c.id}/send`))}>
                    Send
                  </button>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
        <Pagination page={list.data?.meta.page ?? 1} pageCount={list.data?.meta.pageCount ?? 1} total={list.data?.meta.total ?? 0} limit={10} onPage={list.setPage} />
      </div>

      <Modal title="New campaign" open={create} onClose={() => setCreate(false)}>
        <Formik
          initialValues={{ title: '', body: '', audience: 'ALL' }}
          validationSchema={Yup.object({ title: Yup.string().required(), body: Yup.string().required() })}
          onSubmit={async (values) => {
            await mut.mutateAsync(() => api.post('/admin/push-campaigns', values))
            setCreate(false)
          }}
        >
          {(fk) => (
            <form onSubmit={fk.handleSubmit} className="space-y-3">
              <FormField label="Title" required>
                <TextInput name="title" value={fk.values.title} onChange={fk.handleChange} />
              </FormField>
              <FormField label="Body" required>
                <TextInput name="body" value={fk.values.body} onChange={fk.handleChange} />
              </FormField>
              <SelectField label="Audience" name="audience" value={fk.values.audience} onChange={fk.handleChange}>
                <option value="ALL">All</option>
                <option value="MEMBERS">Members</option>
                <option value="DRIVERS">Drivers</option>
              </SelectField>
              <FormActions onCancel={() => setCreate(false)} pending={fk.isSubmitting} />
            </form>
          )}
        </Formik>
      </Modal>
    </div>
  )
}
