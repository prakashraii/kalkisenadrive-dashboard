import { cn } from '../../lib/cn'

const styles: Record<string, string> = {
  APPROVED: 'bg-emerald-100 text-emerald-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  REJECTED: 'bg-rose-100 text-rose-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
  INACTIVE: 'bg-slate-200 text-slate-600',
  SUSPENDED: 'bg-rose-100 text-rose-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  SHIPPED: 'bg-sky-100 text-sky-700',
  AVAILABLE: 'bg-emerald-100 text-emerald-700',
  OUT_OF_STOCK: 'bg-rose-100 text-rose-700',
  SENT: 'bg-emerald-100 text-emerald-700',
  DRAFT: 'bg-slate-200 text-slate-600',
  EXPIRED: 'bg-slate-200 text-slate-600',
}

const labels: Record<string, string> = {
  APPROVED: 'Approved',
  OUT_OF_STOCK: 'Out of stock',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex min-w-[78px] items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium',
        styles[status] ?? 'bg-slate-100 text-slate-600',
      )}
    >
      {labels[status] ?? status.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
    </span>
  )
}
