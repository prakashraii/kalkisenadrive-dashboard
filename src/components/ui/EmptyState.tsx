import type { ReactNode } from 'react'
import { SearchX } from 'lucide-react'
import { cn } from '../../lib/cn'

export function EmptyState({
  icon,
  title = 'No records found',
  description,
  query,
  action,
  className,
}: {
  icon?: ReactNode
  title?: string
  description?: string
  query?: string
  action?: ReactNode
  className?: string
}) {
  const q = query?.trim()
  const body =
    description ??
    (q
      ? `No matches for “${q}”. Try a name, phone, email, or ID.`
      : 'There is nothing to show here yet.')

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex flex-col items-center justify-center gap-3 px-4 py-12', className)}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-[#020B17]/[0.06] text-[#020B17]">
        {icon ?? <SearchX className="size-6" strokeWidth={1.5} aria-hidden="true" />}
      </div>
      <div className="max-w-sm text-center">
        <p className="text-sm font-medium text-[#262626]">{title}</p>
        <p className="mt-1 text-xs leading-5 text-black/55">{body}</p>
      </div>
      {action}
    </div>
  )
}

export function EmptyStateAction({
  onClick,
  children,
}: {
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-9 rounded-md border border-black/12 bg-white px-3 text-xs text-[#262626] hover:bg-black/[0.03]"
    >
      {children}
    </button>
  )
}
