import { ImagePlus, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { toast } from 'sonner'
import { cn } from '../../lib/cn'
import { getApiMessage } from '../../lib/toast'
import { mediaUrl } from '../../lib/media'
import { uploadImage, validateUploadFile } from '../../lib/upload'

export function ImageUpload({
  value,
  onChange,
  disabled,
  label = 'Drop image or click to upload',
  folder,
  className,
  shape = 'rounded',
}: {
  value?: string
  onChange: (url: string) => void
  disabled?: boolean
  label?: string
  folder?: string
  className?: string
  shape?: 'rounded' | 'circle'
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const errorId = useId()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [localPreview, setLocalPreview] = useState('')
  const preview = localPreview || (value ? mediaUrl(value) : '')

  useEffect(
    () => () => {
      if (localPreview) URL.revokeObjectURL(localPreview)
    },
    [localPreview],
  )

  async function pick(file?: File | null) {
    if (!file || disabled || busy) return
    const message = validateUploadFile(file)
    if (message) {
      setError(message)
      return
    }
    setError('')
    setLocalPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
    setBusy(true)
    try {
      const url = await uploadImage(file, folder)
      onChange(url)
      toast.success('Image uploaded')
    } catch (err) {
      const uploadError = getApiMessage(err, 'Could not upload image')
      setError(uploadError)
      toast.error(uploadError)
      setLocalPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return ''
      })
    } finally {
      setBusy(false)
    }
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    void pick(e.target.files?.[0])
    e.target.value = ''
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    if (disabled) return
    void pick(e.dataTransfer.files?.[0])
  }

  function clearImage() {
    setError('')
    setLocalPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return ''
    })
    onChange('')
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={(e) => {
          if (disabled || busy) return
          if ((e.target as HTMLElement).closest('button')) return
          inputRef.current?.click()
        }}
        className={cn(
          'relative flex min-h-[220px] w-full flex-1 items-center justify-center overflow-hidden bg-[#E5E5E5]',
          shape === 'circle' ? 'rounded-full' : 'rounded-lg',
          disabled ? 'cursor-default' : 'cursor-pointer',
          error && 'ring-1 ring-rose-500',
          className,
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
          aria-label={label}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          disabled={disabled || busy}
          onChange={onFileChange}
          className="sr-only"
        />
        {preview ? (
          <img src={preview} alt="" className="pointer-events-none absolute inset-0 size-full object-cover" />
        ) : (
          <span className="pointer-events-none px-4 text-center text-sm text-[#262626]/70">
            {busy ? 'Uploading…' : label}
          </span>
        )}
        {!disabled && shape === 'circle' && value && (
          <button
            type="button"
            disabled={busy}
            onClick={clearImage}
            className="absolute right-1 top-1 z-20 inline-flex size-7 items-center justify-center rounded-full border border-black/12 bg-white text-black disabled:opacity-60"
            aria-label="Remove image"
          >
            <X className="size-3.5" />
          </button>
        )}
        {!disabled && shape !== 'circle' && (
          <div className="absolute inset-x-3 bottom-3 z-20 flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-header px-3 text-xs font-medium text-white disabled:opacity-60"
            >
              <ImagePlus className="size-3.5" />
              {preview ? 'Change' : 'Upload'}
            </button>
            {value && (
              <button
                type="button"
                disabled={busy}
                onClick={clearImage}
                className="inline-flex size-9 items-center justify-center rounded-md border border-black/12 bg-white text-black disabled:opacity-60"
                aria-label="Remove image"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  )
}
