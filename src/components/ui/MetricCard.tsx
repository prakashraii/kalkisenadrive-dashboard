import type { ReactNode } from 'react'
import { formatNumber } from '../../lib/cn'

export function MetricCard({
  title,
  value,
  icon,
}: {
  title: string
  value: number
  icon: ReactNode
}) {
  return (
    <div className="flex min-h-[122px] flex-1 flex-col justify-between gap-4 rounded-lg border border-black/12 bg-white px-4 pb-4 pt-3">
      <div className="flex items-center gap-2.5">
        <span className="flex size-6 shrink-0 items-center justify-center">{icon}</span>
        <p className="text-xs font-medium text-black">{title}</p>
      </div>
      <p className="truncate text-4xl leading-[54px] text-black">{formatNumber(value)}</p>
    </div>
  )
}
