import { Modal } from './Actions'

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  pending,
  onClose,
  onConfirm,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  pending?: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Modal open={open} title={title} onClose={onClose} size="sm">
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="h-10 rounded-lg border border-slate-200 px-4 text-sm text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onConfirm}
          className="h-10 rounded-lg bg-rose-600 px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? 'Please wait…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
