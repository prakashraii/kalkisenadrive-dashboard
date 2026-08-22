import type { ReactNode } from 'react'

export function TableFrame({ children }: { children: ReactNode }) {
  return <div className="overflow-hidden rounded-lg border border-black/12 bg-white">{children}</div>
}

export function DataTable({
  columns,
  children,
}: {
  columns: string[]
  children: ReactNode
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-center text-xs tracking-[0.112px]">
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
        <tbody className="[&>tr:nth-child(even)]:bg-[rgba(2,11,23,0.06)]">{children}</tbody>
      </table>
    </div>
  )
}
