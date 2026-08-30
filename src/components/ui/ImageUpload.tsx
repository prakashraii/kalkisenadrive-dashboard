import { ImagePlus, X } from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { toast } from 'sonner'
import { cn } from '../../lib/cn'
import { getApiMessage } from '../../lib/toast'
import { mediaUrl } from '../../lib/media'
import { uploadImage } from '../../lib/upload'

const MAX_BYTES = 5 * 1024 * 1024

export function ImageUpload({
  value,
  onChange,
  disabled,
  label = 'Drop image or click to upload',
  folder,
  className,
}: {
  value?: string
  onChange: (url: string) => void
  disabled?: boolean
  label?: string
  folder?: string
  className?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
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
    if (!file.type.startsWith('image/')) {
      toast.error('Choose a JPG, PNG or WebP image')
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image must be 5 MB or smaller')
      return
    }
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
      toast.error(getApiMessage(err, 'Could not upload image'))
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

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onClick={(e) => {
        if (disabled || busy) return
        if ((e.target as HTMLElement).closest('button')) return
        inputRef.current?.click()
      }}
      className={cn(
        'relative flex min-h-[220px] w-full flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-[#E5E5E5]',
        disabled && 'cursor-default',
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
        className="hidden"
        disabled={disabled || busy}
        onChange={onFileChange}
      />
      {preview ? (
        <img src={preview} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <span className="px-4 text-center text-sm text-[#262626]/70">{busy ? 'Uploading…' : label}</span>
      )}
      {!disabled && (
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-center gap-2">
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
              onClick={() => {
                setLocalPreview((prev) => {
                  if (prev) URL.revokeObjectURL(prev)
                  return ''
                })
                onChange('')
              }}
              className="inline-flex size-9 items-center justify-center rounded-md border border-black/12 bg-white text-black disabled:opacity-60"
              aria-label="Remove image"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
