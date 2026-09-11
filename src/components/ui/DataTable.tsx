import { Children, type ReactNode } from 'react'
import { EmptyState, EmptyStateAction } from './EmptyState'

export function TableFrame({ children }: { children: ReactNode }) {
  return <div className="overflow-hidden rounded-lg border border-black/12 bg-white">{children}</div>
}

function TableLoading({ columns }: { columns: number }) {
  return (
    <>
      {Array.from({ length: 4 }).map((_, row) => (
        <tr key={row}>
          {Array.from({ length: columns }).map((_, col) => (
            <td key={col} className="px-2.5 py-4">
              <div className="mx-auto h-3 w-16 animate-pulse rounded bg-black/8" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export function DataTable({
  columns,
  children,
  empty,
  loading,
  query,
  onClearSearch,
}: {
  columns: string[]
  children: ReactNode
  empty?: ReactNode
  loading?: boolean
  query?: string
  onClearSearch?: () => void
}) {
  const hasRows = Children.toArray(children).length > 0

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-center text-xs tracking-[0.112px]" aria-busy={loading || undefined}>
        <thead>
          <tr className="border-b border-[#E7E7E7]">
            {columns.map((c) => (
              <th
                key={c}
                className="whitespace-nowrap bg-[#020B17] px-2.5 py-4 font-normal text-white"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr:nth-child(even)]:bg-[rgba(2,11,23,0.06)]">
          {loading && !hasRows ? (
            <TableLoading columns={columns.length} />
          ) : hasRows ? (
            children
          ) : (
            <tr>
              <td colSpan={columns.length} className="p-0">
                {empty ?? (
                  <EmptyState
                    query={query}
                    action={
                      query?.trim() && onClearSearch ? (
                        <EmptyStateAction onClick={onClearSearch}>Clear search</EmptyStateAction>
                      ) : undefined
                    }
                  />
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
