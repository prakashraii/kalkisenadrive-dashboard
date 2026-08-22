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
import { formatMoney } from '../lib/cn'

type Book = {
  id: string
  title: string
  author: string
  priceCents: number
  stock: number
  status: string
}

export function BooksPage() {
  const list = useAdminList<Book>('books', '/admin/books')
  const mut = useAdminMutation(['books'])
  const [edit, setEdit] = useState<Book | null | 'new'>(null)
  const [del, setDel] = useState<Book | null>(null)

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Book list</h2>
        <button onClick={() => setEdit('new')} className="h-9 rounded-lg bg-violet-600 px-3 text-sm font-medium text-white">
          Add book
        </button>
      </div>
      <TableToolbar search={list.search} onSearch={list.setSearch} />
      <DataTable columns={['Title', 'Author', 'Price', 'Stock', 'Status', 'Action']}>
        {(list.data?.data ?? []).map((b) => (
          <tr key={b.id}>
            <td className="px-3 py-3 font-medium">{b.title}</td>
            <td className="px-3 py-3">{b.author}</td>
            <td className="px-3 py-3">{formatMoney(b.priceCents)}</td>
            <td className="px-3 py-3">{b.stock}</td>
            <td className="px-3 py-3">
              <StatusBadge status={b.status} />
            </td>
            <td className="px-3 py-3">
              <ActionButtons onEdit={() => setEdit(b)} onDelete={() => setDel(b)} />
            </td>
          </tr>
        ))}
      </DataTable>
      <Pagination page={list.data?.meta.page ?? 1} pageCount={list.data?.meta.pageCount ?? 1} total={list.data?.meta.total ?? 0} limit={10} onPage={list.setPage} />

      <Modal title={edit === 'new' ? 'Add book' : 'Edit book'} open={!!edit} onClose={() => setEdit(null)}>
        {edit && (
          <Formik
            initialValues={
              edit === 'new'
                ? { title: '', author: '', priceCents: 50000, stock: 10, status: 'AVAILABLE' }
                : { title: edit.title, author: edit.author, priceCents: edit.priceCents, stock: edit.stock, status: edit.status }
            }
            validationSchema={Yup.object({ title: Yup.string().required(), author: Yup.string().required() })}
            onSubmit={async (values) => {
              if (edit === 'new') await mut.mutateAsync(() => api.post('/admin/books', values))
              else await mut.mutateAsync(() => api.patch(`/admin/books/${edit.id}`, values))
              setEdit(null)
            }}
          >
            {(fk) => (
              <form onSubmit={fk.handleSubmit} className="space-y-3">
                <FormField label="Title" required>
                  <TextInput name="title" value={fk.values.title} onChange={fk.handleChange} />
                </FormField>
                <FormField label="Author" required>
                  <TextInput name="author" value={fk.values.author} onChange={fk.handleChange} />
                </FormField>
                <FormField label="Price (paisa)">
                  <TextInput type="number" name="priceCents" value={fk.values.priceCents} onChange={fk.handleChange} />
                </FormField>
                <FormField label="Stock">
                  <TextInput type="number" name="stock" value={fk.values.stock} onChange={fk.handleChange} />
                </FormField>
                <SelectField label="Status" name="status" value={fk.values.status} onChange={fk.handleChange}>
                  <option>AVAILABLE</option>
                  <option>OUT_OF_STOCK</option>
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
        title="Remove book"
        message="The book will be archived."
        onClose={() => setDel(null)}
        onConfirm={async () => {
          if (!del) return
          await mut.mutateAsync(() => api.delete(`/admin/books/${del.id}`))
          setDel(null)
        }}
      />
    </div>
  )
}
