import type { ReactNode } from 'react'
import { cn, formatMoney, formatNumber } from '../../lib/cn'

const tones: Record<string, string> = {
  violet: 'bg-violet-100 text-violet-600',
  blue: 'bg-sky-100 text-sky-600',
  teal: 'bg-teal-100 text-teal-600',
  pink: 'bg-pink-100 text-pink-600',
  orange: 'bg-orange-100 text-orange-600',
  green: 'bg-emerald-100 text-emerald-600',
  indigo: 'bg-indigo-100 text-indigo-600',
}

export function StatCard({
  title,
  value,
  icon,
  money,
  tone = 'violet',
}: {
  title: string
  value: number
  icon: ReactNode
  money?: boolean
  tone?: keyof typeof tones
}) {
  return (
    <div className="flex min-h-[92px] items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
      <div className={cn('flex size-12 shrink-0 items-center justify-center rounded-xl', tones[tone])}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{title}</p>
        <p className="mt-1 truncate text-xl font-semibold tracking-tight text-slate-900">
          {money ? formatMoney(value) : formatNumber(value)}
        </p>
      </div>
    </div>
  )
}
