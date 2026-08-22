import { Eye, Pencil, Trash2, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function ActionButtons({
  onView,
  onEdit,
  onDelete,
}: {
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
}) {
  return (
    <div className="flex items-center justify-center gap-2 text-slate-500">
      {onView && (
        <button
          type="button"
          onClick={onView}
          className="flex size-6 items-center justify-center rounded bg-[#F3E9FF] text-[#9747FF] hover:bg-[#e8d6ff]"
          title="View"
        >
          <Eye className="size-4" />
        </button>
      )}
      {onEdit && (
        <button type="button" onClick={onEdit} className="rounded p-1 hover:bg-slate-100" title="Edit">
          <Pencil className="size-4" />
        </button>
      )}
      {onDelete && (
        <button type="button" onClick={onDelete} className="rounded p-1 hover:bg-rose-50 hover:text-rose-600" title="Delete">
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  )
}

const modalSizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({
  title,
  open,
  onClose,
  children,
  size = 'md',
  footer,
}: {
  title: string
  open: boolean
  onClose: () => void
  children: ReactNode
  size?: keyof typeof modalSizes
  footer?: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={cn('flex max-h-[90vh] w-full flex-col rounded-xl bg-white p-5 shadow-xl', modalSizes[size])}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button type="button" onClick={onClose}>
            <X className="size-5 text-slate-400" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer}
      </div>
    </div>
  )
}
