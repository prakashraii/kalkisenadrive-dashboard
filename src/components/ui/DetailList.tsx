import type { ReactNode } from 'react'

export function DetailList({
  items,
}: {
  items: { label: string; value: ReactNode }[]
}) {
  return (
    <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200">
      {items.map((item) => (
        <div key={item.label} className="grid grid-cols-[140px_1fr] gap-3 px-3 py-2.5 text-sm">
          <dt className="text-slate-500">{item.label}</dt>
          <dd className="font-medium text-slate-800">{item.value || '—'}</dd>
        </div>
      ))}
    </dl>
  )
}
