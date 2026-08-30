import { useState } from 'react'
import { BookOpen, Plus } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { BookDetailsForm, type Book } from '../components/books/BookDetailsForm'
import { ActionButtons } from '../components/ui/Actions'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { DataTable, TableFrame } from '../components/ui/DataTable'
import { Pagination } from '../components/ui/Pagination'
import { StatusBadge } from '../components/ui/StatusBadge'
import { TableToolbar } from '../components/ui/TableToolbar'
import { api } from '../lib/api'
import { formatMoney } from '../lib/cn'
import { useAdminList, useAdminMutation } from '../viewmodels/useAdminCrud'

const COLUMNS = ['Title', 'Author', 'Type', 'Price', 'Stock', 'Language', 'Status', 'Membership', 'Action']

const LANGUAGE_LABEL: Record<string, string> = {
  en: 'English',
  np: 'Nepali',
  hi: 'Hindi',
}

export function BooksPage() {
  const [params, setParams] = useSearchParams()
  const viewId = params.get('view')
  const form = params.get('form')
  const list = useAdminList<Book>('books', '/admin/books')
  const mut = useAdminMutation(['books', 'dashboard-summary'])
  const [del, setDel] = useState<Book | null>(null)

  if (form === 'new') {
    return <BookDetailsForm bookId="new" onClose={() => setParams({})} />
  }

  if (form) {
    return <BookDetailsForm key={form} bookId={form} onClose={() => setParams({})} />
  }

  if (viewId) {
    return (
      <BookDetailsForm
        key={`view-${viewId}`}
        bookId={viewId}
        readOnly
        onClose={() => setParams({})}
        onEdit={() => setParams({ form: viewId })}
      />
    )
  }

  const total = list.data?.meta.total ?? 0
  const empty = !list.isLoading && total === 0 && !list.search

  if (empty) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
        <div className="flex size-40 items-center justify-center rounded-full bg-white shadow-sm">
          <BookOpen className="size-16 text-[#020B17]" strokeWidth={1.25} />
        </div>
        <button
          type="button"
          onClick={() => setParams({ form: 'new' })}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-[#020B17] px-4 text-sm text-white"
        >
          <Plus className="size-4" />
          Add Book
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-normal text-black">Book List</h2>
          <button
            type="button"
            onClick={() => setParams({ form: 'new' })}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-[#020B17] px-4 text-sm text-white"
          >
            <Plus className="size-4" />
            Add Book
          </button>
        </div>
        <TableToolbar search={list.search} onSearch={list.setSearch} />
        <TableFrame>
          <DataTable columns={COLUMNS}>
            {(list.data?.data ?? []).map((b) => (
              <tr key={b.id} className="text-[#262626]">
                <td className="px-2.5 py-4 font-medium">{b.title}</td>
                <td className="px-2.5 py-4">{b.author}</td>
                <td className="px-2.5 py-4">{b.type === 'DIGITAL' ? 'Digital' : 'Physical'}</td>
                <td className="px-2.5 py-4">{formatMoney(b.priceCents)}</td>
                <td className="px-2.5 py-4">{b.stock}</td>
                <td className="px-2.5 py-4">{LANGUAGE_LABEL[b.language] ?? b.language}</td>
                <td className="px-2.5 py-4">
                  <StatusBadge status={b.status} />
                </td>
                <td className="px-2.5 py-4">
                  <span className="inline-flex rounded-full bg-[#E8F5E9] px-2 py-1 text-[11px] font-medium text-[#1B5E20]">
                    2 year free
                  </span>
                </td>
                <td className="px-2.5 py-4">
                  <ActionButtons
                    onView={() => setParams({ view: b.id })}
                    onEdit={() => setParams({ form: b.id })}
                    onDelete={() => setDel(b)}
                  />
                </td>
              </tr>
            ))}
          </DataTable>
          <Pagination
            page={list.data?.meta.page ?? 1}
            pageCount={list.data?.meta.pageCount ?? 1}
            total={total}
            limit={10}
            onPage={list.setPage}
          />
        </TableFrame>
      </section>

      <ConfirmDialog
        open={!!del}
        title="Delete book"
        message="Delete this book? This cannot be undone."
        pending={mut.isPending}
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
