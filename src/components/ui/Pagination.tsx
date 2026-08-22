import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Pagination({
  page,
  pageCount,
  total,
  limit,
  onPage,
}: {
  page: number
  pageCount: number
  total: number
  limit: number
  onPage: (page: number) => void
}) {
  const shown = Math.min(limit, total)
  const pages: number[] = []
  const max = Math.min(pageCount, 10)
  for (let i = 1; i <= max; i++) pages.push(i)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-3 text-sm text-slate-500">
      <p>
        Showing {shown} of {total} results
      </p>
      <div className="flex items-center gap-1">
        <button className="rounded p-1 hover:bg-slate-100" onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}>
          <ChevronLeft className="size-4" />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`size-8 rounded-full text-xs ${p === page ? 'bg-violet-600 text-white' : 'hover:bg-slate-100'}`}
          >
            {p}
          </button>
        ))}
        {pageCount > 10 && <span className="px-1">…</span>}
        <button
          className="rounded p-1 hover:bg-slate-100"
          onClick={() => onPage(Math.min(pageCount, page + 1))}
          disabled={page === pageCount}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
