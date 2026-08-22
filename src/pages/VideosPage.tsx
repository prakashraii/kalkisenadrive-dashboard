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
import { FormActions, FormField, TextInput } from '../components/ui/FormField'

type Video = {
  id: string
  title: string
  description?: string | null
  sourceUrl: string
  published: boolean
  sortOrder: number
}

export function VideosPage() {
  const list = useAdminList<Video>('videos', '/admin/videos')
  const mut = useAdminMutation(['videos'])
  const [edit, setEdit] = useState<Video | null | 'new'>(null)
  const [del, setDel] = useState<Video | null>(null)

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Videos</h2>
        <button onClick={() => setEdit('new')} className="h-9 rounded-lg bg-violet-600 px-3 text-sm font-medium text-white">
          Add video
        </button>
      </div>
      <TableToolbar search={list.search} onSearch={list.setSearch} />
      <DataTable columns={['Title', 'URL', 'Published', 'Order', 'Action']}>
        {(list.data?.data ?? []).map((v) => (
          <tr key={v.id}>
            <td className="px-3 py-3 font-medium">{v.title}</td>
            <td className="max-w-[240px] truncate px-3 py-3 text-xs">{v.sourceUrl}</td>
            <td className="px-3 py-3">
              <StatusBadge status={v.published ? 'APPROVED' : 'DRAFT'} />
            </td>
            <td className="px-3 py-3">{v.sortOrder}</td>
            <td className="px-3 py-3">
              <ActionButtons onEdit={() => setEdit(v)} onDelete={() => setDel(v)} />
            </td>
          </tr>
        ))}
      </DataTable>
      <Pagination page={list.data?.meta.page ?? 1} pageCount={list.data?.meta.pageCount ?? 1} total={list.data?.meta.total ?? 0} limit={10} onPage={list.setPage} />

      <Modal title={edit === 'new' ? 'Add video' : 'Edit video'} open={!!edit} onClose={() => setEdit(null)}>
        {edit && (
          <Formik
            initialValues={
              edit === 'new'
                ? { title: '', description: '', sourceUrl: '', published: true, sortOrder: 0 }
                : { title: edit.title, description: edit.description ?? '', sourceUrl: edit.sourceUrl, published: edit.published, sortOrder: edit.sortOrder }
            }
            validationSchema={Yup.object({ title: Yup.string().required(), sourceUrl: Yup.string().url().required() })}
            onSubmit={async (values) => {
              if (edit === 'new') await mut.mutateAsync(() => api.post('/admin/videos', values))
              else await mut.mutateAsync(() => api.patch(`/admin/videos/${edit.id}`, values))
              setEdit(null)
            }}
          >
            {(fk) => (
              <form onSubmit={fk.handleSubmit} className="space-y-3">
                <FormField label="Title" required>
                  <TextInput name="title" value={fk.values.title} onChange={fk.handleChange} />
                </FormField>
                <FormField label="Source URL" required>
                  <TextInput name="sourceUrl" value={fk.values.sourceUrl} onChange={fk.handleChange} />
                </FormField>
                <FormField label="Description">
                  <TextInput name="description" value={fk.values.description} onChange={fk.handleChange} />
                </FormField>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="published"
                    checked={fk.values.published}
                    onChange={(e) => void fk.setFieldValue('published', e.target.checked)}
                  />
                  Published
                </label>
                <FormActions onCancel={() => setEdit(null)} pending={fk.isSubmitting} />
              </form>
            )}
          </Formik>
        )}
      </Modal>
      <ConfirmDialog
        open={!!del}
        title="Remove video"
        message="The video will be archived."
        onClose={() => setDel(null)}
        onConfirm={async () => {
          if (!del) return
          await mut.mutateAsync(() => api.delete(`/admin/videos/${del.id}`))
          setDel(null)
        }}
      />
    </div>
  )
}
