import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { cn, formatMoney, formatNumber } from '../../lib/cn'

const tones = {
  violet: { icon: 'bg-violet-100 text-violet-600', bar: 'bg-violet-400' },
  blue: { icon: 'bg-sky-100 text-sky-600', bar: 'bg-sky-400' },
  teal: { icon: 'bg-teal-100 text-teal-600', bar: 'bg-teal-400' },
  pink: { icon: 'bg-pink-100 text-pink-600', bar: 'bg-pink-400' },
  orange: { icon: 'bg-orange-100 text-orange-600', bar: 'bg-orange-400' },
  green: { icon: 'bg-emerald-100 text-emerald-600', bar: 'bg-emerald-400' },
  indigo: { icon: 'bg-indigo-100 text-indigo-600', bar: 'bg-indigo-400' },
} as const

export type StatTone = keyof typeof tones

export function StatCard({
  title,
  value,
  icon,
  money,
  tone = 'violet',
  trend,
  href,
  loading,
}: {
  title: string
  value: number
  icon: ReactNode
  money?: boolean
  tone?: StatTone
  trend?: number
  href?: string
  loading?: boolean
}) {
  const palette = tones[tone]
  const className = cn(
    'relative flex min-h-[76px] items-center gap-3 overflow-hidden rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-sm',
    href && 'transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009EE8]/40',
  )

  const body = loading ? (
    <>
      <div className="size-9 shrink-0 animate-pulse rounded-lg bg-slate-100" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="h-2.5 w-16 animate-pulse rounded bg-slate-100" />
        <div className="h-5 w-14 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="h-5 w-12 animate-pulse rounded-full bg-slate-100" />
    </>
  ) : (
    <>
      <span className={cn('absolute inset-y-0 left-0 w-0.5', palette.bar)} aria-hidden />
      <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', palette.icon)}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-medium leading-none text-slate-500">{title}</p>
        <p className="mt-1 truncate text-lg font-bold tabular-nums tracking-tight text-slate-900">
          {money ? formatMoney(value) : formatNumber(value)}
        </p>
      </div>
      {trend != null ? <TrendBadge value={trend} /> : null}
    </>
  )

  const label = `${title}: ${money ? formatMoney(value) : formatNumber(value)}`

  if (href) {
    return (
      <Link to={href} className={className} aria-label={label}>
        {body}
      </Link>
    )
  }

  return <div className={className}>{body}</div>
}

function TrendBadge({ value }: { value: number }) {
  const up = value > 0
  const down = value < 0
  const Icon = up ? TrendingUp : down ? TrendingDown : Minus
  const abs = Math.abs(value)
  const label = Number.isInteger(abs) ? String(abs) : abs.toFixed(1)

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
        up && 'bg-emerald-50 text-emerald-600',
        down && 'bg-rose-50 text-rose-600',
        !up && !down && 'bg-slate-50 text-slate-500',
      )}
      title="vs last month"
    >
      <Icon className="size-3" strokeWidth={2.25} />
      {up ? '+' : down ? '−' : ''}
      {label}%
    </span>
  )
}
