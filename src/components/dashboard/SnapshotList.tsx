import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn, formatNumber } from '../../lib/cn'
import { StatusBadge } from '../ui/StatusBadge'

const tones = {
  violet: 'bg-violet-100 text-violet-600',
  blue: 'bg-sky-100 text-sky-600',
  teal: 'bg-teal-100 text-teal-600',
  pink: 'bg-pink-100 text-pink-600',
  orange: 'bg-orange-100 text-orange-600',
  green: 'bg-emerald-100 text-emerald-600',
} as const

const chipTones: Record<string, string> = {
  DOCTOR: 'bg-violet-50 text-violet-700',
  DOWRY: 'bg-sky-50 text-sky-700',
  GENERAL: 'bg-emerald-50 text-emerald-700',
}

export type SnapshotTone = keyof typeof tones

export type SnapshotItem = {
  id: string
  name: string
  secondary: string
  highlight?: string
  status?: string
  chip?: string
  href?: string
}

export function SnapshotList({
  title,
  icon,
  tone = 'violet',
  total,
  viewAllTo,
  emptyText,
  items,
  loading,
}: {
  title: string
  icon: ReactNode
  tone?: SnapshotTone
  total?: number
  viewAllTo: string
  emptyText: string
  items: SnapshotItem[]
  loading?: boolean
}) {
  return (
    <section className="flex flex-col rounded-2xl bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', tones[tone])}>{icon}</div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500">{formatNumber(total ?? 0)} total</p>
          </div>
        </div>
        <Link to={viewAllTo} className="shrink-0 text-xs font-medium text-[#009EE8] hover:underline">
          View all
        </Link>
      </header>

      {loading ? (
        <ul className="divide-y divide-slate-100">
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i} className="flex items-center gap-3 py-2.5">
              <div className="size-9 shrink-0 animate-pulse rounded-full bg-slate-100" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
                <div className="h-2.5 w-36 animate-pulse rounded bg-slate-100" />
              </div>
              <div className="h-8 w-16 animate-pulse rounded bg-slate-100" />
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <p className="flex flex-1 items-center justify-center py-10 text-sm text-slate-400">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((item) => {
            const content = (
              <>
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                    tones[tone],
                  )}
                >
                  {initials(item.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-slate-900">{item.name}</span>
                    {item.chip ? (
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                          chipTones[item.chip] ?? 'bg-slate-100 text-slate-600',
                        )}
                      >
                        {item.chip.replaceAll('_', ' ').toLowerCase()}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">{item.secondary}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                  {item.highlight ? (
                    <span className="text-sm font-semibold tabular-nums text-slate-900">{item.highlight}</span>
                  ) : null}
                  {item.status ? <StatusBadge status={item.status} /> : null}
                </span>
              </>
            )

            const rowClass =
              'flex w-full items-center gap-3 rounded-xl px-1 py-2.5 text-left transition-colors hover:bg-slate-50'

            return (
              <li key={item.id}>
                {item.href ? (
                  <Link to={item.href} className={rowClass}>
                    {content}
                  </Link>
                ) : (
                  <div className={rowClass}>{content}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}
