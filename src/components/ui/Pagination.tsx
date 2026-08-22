import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '../../lib/cn'

function pageItems(page: number, pageCount: number): Array<number | '…'> {
  if (pageCount <= 5) return Array.from({ length: Math.max(pageCount, 1) }, (_, i) => i + 1)
  if (page <= 3) return [1, 2, 3, '…', pageCount]
  if (page >= pageCount - 2) return [1, '…', pageCount - 2, pageCount - 1, pageCount]
  return [1, '…', page, '…', pageCount]
}

function Control({
  disabled,
  onClick,
  children,
}: {
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded-lg border border-[#F1F1F1] bg-white text-[#353537] disabled:opacity-40"
    >
      {children}
    </button>
  )
}

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
  const pages = pageItems(page, pageCount)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-6 py-4">
      <p className="text-[13px] font-semibold leading-5 text-[#353537]">
        Showing {shown} of {total} results
      </p>
      <div className="flex items-center gap-1.5">
        <Control disabled={page <= 1} onClick={() => onPage(1)}>
          <ChevronsLeft className="size-4" />
        </Control>
        <Control disabled={page <= 1} onClick={() => onPage(Math.max(1, page - 1))}>
          <ChevronLeft className="size-4" />
        </Control>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e-${i}`} className="flex size-8 items-center justify-center text-[13px] font-semibold text-[#353537]">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPage(p)}
              className={cn(
                'flex size-8 items-center justify-center rounded-lg text-[13px] font-semibold',
                p === page
                  ? 'bg-[#FF9500] text-black'
                  : 'border border-[#F1F1F1] bg-white text-[#353537]',
              )}
            >
              {p}
            </button>
          ),
        )}
        <Control disabled={page >= pageCount} onClick={() => onPage(Math.min(pageCount, page + 1))}>
          <ChevronRight className="size-4" />
        </Control>
        <Control disabled={page >= pageCount} onClick={() => onPage(pageCount)}>
          <ChevronsRight className="size-4" />
        </Control>
      </div>
    </div>
  )
}
