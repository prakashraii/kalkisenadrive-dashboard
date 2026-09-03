import { cn } from '../../lib/cn'

const styles: Record<string, string> = {
  APPROVED: 'text-[#34C759]',
  ACTIVE: 'text-[#34C759]',
  PENDING: 'text-amber-500',
  REJECTED: 'text-rose-600',
  CANCELLED: 'text-rose-600',
  INACTIVE: 'text-slate-500',
  SUSPENDED: 'text-rose-600',
  DELIVERED: 'text-[#34C759]',
  SHIPPED: 'text-sky-600',
  AVAILABLE: 'text-[#34C759]',
  OUT_OF_STOCK: 'text-rose-600',
  SENT: 'text-[#34C759]',
  DRAFT: 'text-slate-500',
  SCHEDULED: 'text-sky-600',
  EXPIRED: 'text-slate-500',
}

const labels: Record<string, string> = {
  APPROVED: 'Approved',
  OUT_OF_STOCK: 'Out of stock',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex min-w-[61px] items-center justify-center text-xs font-medium',
        styles[status] ?? 'bg-slate-100 text-slate-600',
      )}
    >
      {labels[status] ?? status.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
    </span>
  )
}
