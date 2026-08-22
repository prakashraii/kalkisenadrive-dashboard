import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export function FormField({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </label>
  )
}

export function TextInput({
  error,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <input
      {...props}
      className={cn(
        'h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition',
        error ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-slate-400',
        className,
      )}
    />
  )
}

export function SelectField({
  label,
  required,
  error,
  hint,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  required?: boolean
  error?: string
  hint?: string
}) {
  return (
    <FormField label={label} required={required} error={error} hint={hint}>
      <select
        {...props}
        className={cn(
          'h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none transition',
          error ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-slate-400',
          props.className,
        )}
      >
        {children}
      </select>
    </FormField>
  )
}

export function FormActions({
  onCancel,
  submitLabel = 'Save',
  pending,
}: {
  onCancel: () => void
  submitLabel?: string
  pending?: boolean
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="h-10 rounded-lg border border-slate-200 px-4 text-sm text-slate-700 hover:bg-slate-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={pending}
        className="h-10 rounded-lg bg-violet-600 px-4 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? 'Saving…' : submitLabel}
      </button>
    </div>
  )
}
