import { useQuery } from '@tanstack/react-query'
import { Formik } from 'formik'
import { ChevronDown, Link2, Pencil, Video } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ChangeEventHandler, type DragEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import * as Yup from 'yup'
import { toast } from 'sonner'
import { api } from '../../lib/api'
import { cn } from '../../lib/cn'
import { isUploadedVideo, mediaUrl, youtubeEmbedUrl, youtubeVideoId } from '../../lib/media'
import { useAdminMutation } from '../../viewmodels/useAdminCrud'
import { ImageUpload } from '../ui/ImageUpload'

const fieldClass =
  'h-11 w-full rounded-lg bg-[#E5E5E5] px-4 text-sm text-[#262626] outline-none placeholder:text-[#262626]/70'

const textareaClass =
  'min-h-[160px] w-full resize-none rounded-lg bg-[#E5E5E5] px-4 py-3 text-sm text-[#262626] outline-none placeholder:text-[#262626]/70'

const dropClass =
  'flex min-h-[420px] w-full flex-1 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg bg-[#E5E5E5] text-sm text-[#262626]/70'

const SORT_OPTIONS = Array.from({ length: 21 }, (_, i) => i)

export type Video = {
  id: string
  title: string
  description?: string | null
  sourceUrl: string
  thumbnailUrl?: string | null
  published: boolean
  sortOrder: number
  createdAt?: string
}

function FilledSelect({
  name,
  value,
  onChange,
  disabled,
  children,
}: {
  name: string
  value: string
  onChange?: ChangeEventHandler<HTMLSelectElement>
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={cn(fieldClass, 'appearance-none pr-10 disabled:opacity-80')}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#262626]" />
    </div>
  )
}

export function VideoDetailsForm({
  videoId,
  onClose,
  readOnly: startReadOnly = false,
  onEdit,
}: {
  videoId: string | 'new'
  onClose: () => void
  readOnly?: boolean
  onEdit?: () => void
}) {
  const mut = useAdminMutation(['videos'])
  const [params, setParams] = useSearchParams()
  const isNew = videoId === 'new'
  const [editing, setEditing] = useState(isNew || !startReadOnly)
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const readOnly = !editing
  const tab = params.get('tab') === 'link' ? 'link' : 'video'

  const { data: video } = useQuery({
    queryKey: ['video', videoId],
    queryFn: async () => (await api.get<Video>(`/admin/videos/${videoId}`)).data,
    enabled: !isNew,
  })

  useEffect(() => {
    if (!video || params.get('tab')) return
    if (!isUploadedVideo(video.sourceUrl)) {
      const next = new URLSearchParams(params)
      next.set('tab', 'link')
      setParams(next, { replace: true })
    }
  }, [params, setParams, video])

  const initialValues = {
    title: video?.title ?? '',
    description: video?.description ?? '',
    sourceUrl: video?.sourceUrl ?? '',
    thumbnailUrl: video?.thumbnailUrl ?? '',
    published: video?.published ?? true,
    sortOrder: video?.sortOrder ?? 0,
  }

  const schema = useMemo(
    () =>
      Yup.object({
        title: Yup.string().required('Required'),
        description: Yup.string(),
        thumbnailUrl: Yup.string(),
        sourceUrl:
          tab === 'link'
            ? Yup.string().url('Enter a valid URL').required('Required')
            : Yup.string(),
      }),
    [tab],
  )

  function setTab(next: 'video' | 'link') {
    const nextParams = new URLSearchParams(params)
    nextParams.set('tab', next)
    setParams(nextParams, { replace: true })
  }

  function pickFile(next?: File | null) {
    if (!next) return
    if (!next.type.startsWith('video/') && !/\.(mp4|webm|mov|m4v|mkv)$/i.test(next.name)) {
      const message = 'Choose an MP4, WebM or MOV video file'
      setError(message)
      toast.error(message)
      return
    }
    if (next.size > 200 * 1024 * 1024) {
      const message = 'Video must be 200 MB or smaller'
      setError(message)
      toast.error(message)
      return
    }
    setError('')
    setFile(next)
    setFilePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(next)
    })
  }

  useEffect(() => () => {
    if (filePreview) URL.revokeObjectURL(filePreview)
  }, [filePreview])

  const existingFileUrl = video && isUploadedVideo(video.sourceUrl) ? mediaUrl(video.sourceUrl) : ''

  return (
    <div className="-mx-8 -my-8 min-h-full bg-white px-8 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setTab('video')}
            className={cn(
              'inline-flex h-11 items-center gap-2 rounded-md px-4 text-sm',
              tab === 'video'
                ? 'bg-[#020B17] text-white'
                : 'border border-black/12 bg-white text-black',
            )}
          >
            <Video className="size-4" />
            Video
          </button>
          <button
            type="button"
            onClick={() => setTab('link')}
            className={cn(
              'inline-flex h-11 items-center gap-2 rounded-md px-4 text-sm',
              tab === 'link'
                ? 'bg-[#020B17] text-white'
                : 'border border-black/12 bg-white text-black',
            )}
          >
            <Link2 className="size-4" />
            Link
          </button>
        </div>
        {!isNew && (
          <button
            type="button"
            onClick={() => (onEdit ? onEdit() : setEditing(true))}
            disabled={editing}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-black/12 px-3 text-sm text-black disabled:opacity-50"
          >
            <Pencil className="size-4" />
            Edit Details
          </button>
        )}
      </div>

      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={schema}
        onSubmit={async (values) => {
          if (readOnly) {
            onClose()
            return
          }
          setError('')
          try {
            if (tab === 'video') {
              if (isNew && !file) {
                const message = 'Choose a video file to upload'
                setError(message)
                toast.error(message)
                return
              }
              if (file || isNew) {
                const body = new FormData()
                body.append('title', values.title)
                if (values.description) body.append('description', values.description)
                if (values.thumbnailUrl) body.append('thumbnailUrl', values.thumbnailUrl)
                body.append('published', String(values.published))
                body.append('sortOrder', String(values.sortOrder))
                if (file) body.append('file', file)
                if (isNew) {
                  await mut.run(() => api.post('/admin/videos/upload', body), {
                    success: 'Video uploaded',
                    error: 'Could not upload video',
                  })
                } else {
                  await mut.run(() => api.post(`/admin/videos/${videoId}/upload`, body), {
                    success: 'Video uploaded',
                    error: 'Could not upload video',
                  })
                }
              } else {
                await mut.run(
                  () =>
                    api.patch(`/admin/videos/${videoId}`, {
                      title: values.title,
                      description: values.description || undefined,
                      sourceUrl: values.sourceUrl,
                      thumbnailUrl: values.thumbnailUrl || undefined,
                      published: values.published,
                      sortOrder: Number(values.sortOrder),
                    }),
                  { success: 'Video updated', error: 'Could not update video' },
                )
              }
            } else {
              const payload = {
                title: values.title,
                description: values.description || undefined,
                sourceUrl: values.sourceUrl,
                thumbnailUrl: values.thumbnailUrl || undefined,
                published: values.published,
                sortOrder: Number(values.sortOrder),
              }
              if (isNew) {
                await mut.run(() => api.post('/admin/videos', payload), {
                  success: 'Video added',
                  error: 'Could not add video',
                })
              } else {
                await mut.run(() => api.patch(`/admin/videos/${videoId}`, payload), {
                  success: 'Video updated',
                  error: 'Could not update video',
                })
              }
            }
            onClose()
          } catch {
            // Toast already shown by mut.run
          }
        }}
      >
        {(fk) => {
          const embed = youtubeEmbedUrl(fk.values.sourceUrl)
          const ytThumb = youtubeVideoId(fk.values.sourceUrl)
            ? `https://img.youtube.com/vi/${youtubeVideoId(fk.values.sourceUrl)}/hqdefault.jpg`
            : ''
          const previewImage = fk.values.thumbnailUrl ? mediaUrl(fk.values.thumbnailUrl) : ytThumb

          function onDrop(e: DragEvent<HTMLLabelElement>) {
            e.preventDefault()
            if (readOnly) return
            pickFile(e.dataTransfer.files?.[0])
          }

          function onFileChange(e: ChangeEvent<HTMLInputElement>) {
            pickFile(e.target.files?.[0])
            e.target.value = ''
          }

          return (
            <form onSubmit={fk.handleSubmit} className="max-w-6xl">
              {tab === 'video' ? (
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1fr)]">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v,.mkv"
                    className="hidden"
                    disabled={readOnly}
                    onChange={onFileChange}
                  />
                  <label
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDrop}
                    className={dropClass}
                    onClick={() => !readOnly && fileRef.current?.click()}
                  >
                    {filePreview || existingFileUrl ? (
                      <video
                        src={filePreview || existingFileUrl}
                        controls
                        className="h-full min-h-[420px] w-full object-cover"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span>{readOnly ? 'No video file' : 'Drop video or click to upload'}</span>
                    )}
                  </label>

                  <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <FilledSelect
                        name="published"
                        value={fk.values.published ? 'true' : 'false'}
                        onChange={(e) => void fk.setFieldValue('published', e.target.value === 'true')}
                        disabled={readOnly}
                      >
                        <option value="true">Published</option>
                        <option value="false">Draft</option>
                      </FilledSelect>
                      <FilledSelect
                        name="sortOrder"
                        value={String(fk.values.sortOrder)}
                        onChange={fk.handleChange}
                        disabled={readOnly}
                      >
                        {SORT_OPTIONS.map((n) => (
                          <option key={n} value={n}>
                            Order {n}
                          </option>
                        ))}
                      </FilledSelect>
                    </div>
                    <div>
                      <input
                        name="title"
                        value={fk.values.title}
                        onChange={fk.handleChange}
                        readOnly={readOnly}
                        placeholder="Title"
                        className={fieldClass}
                      />
                      {fk.touched.title && fk.errors.title && (
                        <p className="mt-1 text-xs text-rose-600">{fk.errors.title}</p>
                      )}
                    </div>
                    <ImageUpload
                      value={fk.values.thumbnailUrl}
                      onChange={(url) => void fk.setFieldValue('thumbnailUrl', url)}
                      disabled={readOnly}
                      folder="videos"
                      label="Thumbnail"
                      className="min-h-[140px]"
                    />
                    <textarea
                      name="description"
                      value={fk.values.description}
                      onChange={fk.handleChange}
                      readOnly={readOnly}
                      placeholder="Description"
                      className={cn(textareaClass, 'min-h-[180px] flex-1')}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.7fr)]">
                  <div className="flex flex-col gap-6">
                    <div>
                      <input
                        name="sourceUrl"
                        value={fk.values.sourceUrl}
                        onChange={fk.handleChange}
                        readOnly={readOnly}
                        placeholder="Video URL"
                        className={fieldClass}
                      />
                      {fk.touched.sourceUrl && fk.errors.sourceUrl && (
                        <p className="mt-1 text-xs text-rose-600">{fk.errors.sourceUrl}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <FilledSelect
                        name="published"
                        value={fk.values.published ? 'true' : 'false'}
                        onChange={(e) => void fk.setFieldValue('published', e.target.value === 'true')}
                        disabled={readOnly}
                      >
                        <option value="true">Published</option>
                        <option value="false">Draft</option>
                      </FilledSelect>
                      <FilledSelect
                        name="sortOrder"
                        value={String(fk.values.sortOrder)}
                        onChange={fk.handleChange}
                        disabled={readOnly}
                      >
                        {SORT_OPTIONS.map((n) => (
                          <option key={n} value={n}>
                            Order {n}
                          </option>
                        ))}
                      </FilledSelect>
                    </div>
                    <div>
                      <input
                        name="title"
                        value={fk.values.title}
                        onChange={fk.handleChange}
                        readOnly={readOnly}
                        placeholder="Title"
                        className={fieldClass}
                      />
                      {fk.touched.title && fk.errors.title && (
                        <p className="mt-1 text-xs text-rose-600">{fk.errors.title}</p>
                      )}
                    </div>
                    <ImageUpload
                      value={fk.values.thumbnailUrl}
                      onChange={(url) => void fk.setFieldValue('thumbnailUrl', url)}
                      disabled={readOnly}
                      folder="videos"
                      label="Thumbnail"
                      className="min-h-[140px]"
                    />
                    <textarea
                      name="description"
                      value={fk.values.description}
                      onChange={fk.handleChange}
                      readOnly={readOnly}
                      placeholder="Description"
                      className={cn(textareaClass, 'min-h-[180px]')}
                    />
                  </div>
                  <div className="min-h-[420px] overflow-hidden rounded-lg bg-[#E5E5E5]">
                    {embed ? (
                      <iframe
                        title="Video preview"
                        src={embed}
                        className="h-full min-h-[420px] w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : previewImage ? (
                      <img src={previewImage} alt="" className="h-full min-h-[420px] w-full object-cover" />
                    ) : (
                      <div className="flex h-full min-h-[420px] items-center justify-center px-4 text-sm text-[#262626]/70">
                        Preview
                      </div>
                    )}
                  </div>
                </div>
              )}

              {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-11 rounded-md border border-black/12 px-6 text-sm text-black"
                >
                  Back
                </button>
                {!readOnly && (
                  <button
                    type="submit"
                    disabled={fk.isSubmitting}
                    className="h-11 rounded-md bg-[#001E5E] px-6 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {fk.isSubmitting ? 'Uploading…' : 'Upload'}
                  </button>
                )}
              </div>
            </form>
          )
        }}
      </Formik>
    </div>
  )
}
