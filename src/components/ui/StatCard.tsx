import type { ReactNode } from 'react'
import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { cn, formatMoney, formatNumber } from '../../lib/cn'

const tones = {
  violet: 'bg-violet-100 text-violet-600',
  blue: 'bg-sky-100 text-sky-600',
  teal: 'bg-teal-100 text-teal-600',
  pink: 'bg-pink-100 text-pink-600',
  orange: 'bg-orange-100 text-orange-600',
  green: 'bg-emerald-100 text-emerald-600',
  indigo: 'bg-indigo-100 text-indigo-600',
} as const

export type StatTone = keyof typeof tones

function formatTrend(value: number) {
  const abs = Math.abs(value)
  const formatted = abs.toLocaleString('en-NP', {
    maximumFractionDigits: 1,
    minimumFractionDigits: abs % 1 === 0 ? 0 : 1,
  })
  if (value > 0) return `+${formatted}%`
  if (value < 0) return `−${formatted}%`
  return '0%'
}

export function StatCard({
  title,
  value,
  icon,
  money,
  tone = 'violet',
  trend,
}: {
  title: string
  value: number
  icon: ReactNode
  money?: boolean
  tone?: StatTone
  trend?: number
}) {
  const direction = trend == null ? null : trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat'
  const TrendIcon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus

  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-white px-3 py-2.5 shadow-sm">
      <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', tones[tone])}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-medium leading-4 text-slate-500">{title}</p>
        <p className="truncate text-lg font-bold tabular-nums tracking-tight text-slate-900">
          {money ? formatMoney(value) : formatNumber(value)}
        </p>
      </div>
      {trend != null ? (
        <span
          title="vs last month"
          className={cn(
            'inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
            direction === 'up' && 'bg-emerald-50 text-emerald-600',
            direction === 'down' && 'bg-rose-50 text-rose-600',
            direction === 'flat' && 'bg-slate-50 text-slate-400',
          )}
        >
          <TrendIcon className="size-3" strokeWidth={2.5} aria-hidden />
          {formatTrend(trend)}
        </span>
      ) : null}
    </div>
  )
}
