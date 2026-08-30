import { useQuery } from '@tanstack/react-query'
import { Formik } from 'formik'
import { ChevronDown, History } from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent, type ChangeEventHandler, type DragEvent, type ReactNode } from 'react'
import * as Yup from 'yup'
import { toast } from 'sonner'
import { api } from '../../lib/api'
import { cn } from '../../lib/cn'
import { getApiMessage } from '../../lib/toast'
import { useAdminMutation } from '../../viewmodels/useAdminCrud'

const fieldClass =
  'h-11 w-full rounded-lg bg-[#E5E5E5] px-4 text-sm text-[#262626] outline-none placeholder:text-[#262626]/70'

const textareaClass =
  'min-h-[160px] w-full resize-none rounded-lg bg-[#E5E5E5] px-4 py-3 text-sm text-[#262626] outline-none placeholder:text-[#262626]/70'

const imageClass =
  'flex min-h-[420px] w-full flex-1 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg bg-[#E5E5E5] text-sm text-[#262626]/70'

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'np', label: 'Nepali' },
  { value: 'hi', label: 'Hindi' },
]

const LINK_TYPES = [
  { value: 'NONE', label: 'Open page' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'BOOK', label: 'Book' },
  { value: 'MEMBERSHIP', label: 'Membership' },
  { value: 'DONATION', label: 'Donation' },
  { value: 'CLINIC', label: 'Clinic' },
]

type Option = { id: string; title: string }

const schema = Yup.object({
  audience: Yup.string().required(),
  language: Yup.string().required(),
  linkType: Yup.string().required(),
  linkTarget: Yup.string(),
  title: Yup.string().required('Required'),
  body: Yup.string().required('Required'),
  scheduledAt: Yup.string(),
})

function FilledSelect({
  name,
  value,
  onChange,
  children,
}: {
  name: string
  value: string
  onChange?: ChangeEventHandler<HTMLSelectElement>
  children: ReactNode
}) {
  return (
    <div className="relative">
      <select name={name} value={value} onChange={onChange} className={cn(fieldClass, 'appearance-none pr-10')}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#262626]" />
    </div>
  )
}

export function PushNotificationForm() {
  const mut = useAdminMutation(['push', 'admin-notifications'])
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [showSchedule, setShowSchedule] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const modeRef = useRef<'send' | 'schedule'>('send')

  const videos = useQuery({
    queryKey: ['push-video-options'],
    queryFn: async () => (await api.get<{ data: Option[] }>('/admin/videos', { params: { limit: 50 } })).data.data,
  })
  const books = useQuery({
    queryKey: ['push-book-options'],
    queryFn: async () => (await api.get<{ data: Option[] }>('/admin/books', { params: { limit: 50 } })).data.data,
  })
  const clinics = useQuery({
    queryKey: ['push-clinic-options'],
    queryFn: async () =>
      (await api.get<{ data: { id: string; name?: string; title?: string }[] }>('/admin/clinics', { params: { limit: 50 } }))
        .data.data,
  })

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview)
    },
    [preview],
  )

  function pickFile(next?: File | null) {
    if (!next) return
    if (!next.type.startsWith('image/')) {
      toast.error('Choose a JPG, PNG or WebP image')
      return
    }
    if (next.size > 5 * 1024 * 1024) {
      toast.error('Image must be 5 MB or smaller')
      return
    }
    setFile(next)
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(next)
    })
  }

  function optionsFor(linkType: string): Option[] {
    if (linkType === 'VIDEO') return videos.data ?? []
    if (linkType === 'BOOK') return books.data ?? []
    if (linkType === 'CLINIC')
      return (clinics.data ?? []).map((c) => ({ id: c.id, title: c.name || c.title || 'Clinic' }))
    return []
  }

  return (
    <Formik
      initialValues={{
        audience: 'ALL',
        language: 'en',
        linkType: 'NONE',
        linkTarget: '',
        title: '',
        body: '',
        scheduledAt: '',
      }}
      validationSchema={schema}
      onSubmit={async (values, helpers) => {
        const sendNow = modeRef.current === 'send'
        const scheduledAt =
          !sendNow && values.scheduledAt ? new Date(values.scheduledAt).toISOString() : undefined
        try {
          let campaignId = ''
          if (file) {
            const body = new FormData()
            body.append('title', values.title)
            body.append('body', values.body)
            body.append('audience', values.audience)
            body.append('language', values.language)
            body.append('linkType', values.linkType)
            if (values.linkTarget) body.append('linkTarget', values.linkTarget)
            if (scheduledAt) body.append('scheduledAt', scheduledAt)
            body.append('image', file)
            const created = await mut.mutateAsync(() => api.post<{ id: string }>('/admin/push-campaigns', body))
            campaignId = (created as { data: { id: string } }).data.id
          } else {
            const created = await mut.mutateAsync(() =>
              api.post<{ id: string }>('/admin/push-campaigns', {
                title: values.title,
                body: values.body,
                audience: values.audience,
                language: values.language,
                linkType: values.linkType,
                linkTarget: values.linkTarget || undefined,
                scheduledAt,
              }),
            )
            campaignId = (created as { data: { id: string } }).data.id
          }
          if (sendNow && campaignId) {
            await mut.mutateAsync(() => api.post(`/admin/push-campaigns/${campaignId}/send`))
            toast.success('Notification sent')
          } else {
            toast.success('Notification scheduled')
          }
          helpers.resetForm()
          setFile(null)
          setPreview((prev) => {
            if (prev) URL.revokeObjectURL(prev)
            return ''
          })
          setShowSchedule(false)
        } catch (err) {
          toast.error(getApiMessage(err, sendNow ? 'Could not send notification' : 'Could not schedule notification'))
        }
      }}
    >
      {(fk) => {
        const linkOptions = optionsFor(fk.values.linkType)
        const hasTargets = linkOptions.length > 0

        function onDrop(e: DragEvent<HTMLLabelElement>) {
          e.preventDefault()
          pickFile(e.dataTransfer.files?.[0])
        }

        function onFileChange(e: ChangeEvent<HTMLInputElement>) {
          pickFile(e.target.files?.[0])
          e.target.value = ''
        }

        async function scheduleLater() {
          if (!showSchedule) {
            setShowSchedule(true)
            return
          }
          if (!fk.values.scheduledAt) {
            toast.error('Choose a date and time to schedule')
            return
          }
          modeRef.current = 'schedule'
          await fk.submitForm()
        }

        return (
          <form onSubmit={fk.handleSubmit} className="max-w-6xl">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.7fr)]">
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FilledSelect name="audience" value={fk.values.audience} onChange={fk.handleChange}>
                    <option value="ALL">All users</option>
                    <option value="MEMBERS">Members</option>
                    <option value="DRIVERS">Drivers</option>
                  </FilledSelect>
                  <FilledSelect name="language" value={fk.values.language} onChange={fk.handleChange}>
                    {LANGUAGES.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </FilledSelect>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FilledSelect
                    name="linkType"
                    value={fk.values.linkType}
                    onChange={(e) => {
                      void fk.setFieldValue('linkType', e.target.value)
                      void fk.setFieldValue('linkTarget', '')
                    }}
                  >
                    {LINK_TYPES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </FilledSelect>
                  <FilledSelect name="linkTarget" value={fk.values.linkTarget} onChange={fk.handleChange}>
                    <option value="">None</option>
                    {hasTargets &&
                      linkOptions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.title}
                        </option>
                      ))}
                  </FilledSelect>
                </div>

                <div>
                  <input
                    name="title"
                    value={fk.values.title}
                    onChange={fk.handleChange}
                    placeholder="Title"
                    className={fieldClass}
                  />
                  {fk.touched.title && fk.errors.title && (
                    <p className="mt-1 text-xs text-rose-600">{fk.errors.title}</p>
                  )}
                </div>

                <div>
                  <textarea
                    name="body"
                    value={fk.values.body}
                    onChange={fk.handleChange}
                    placeholder="Message"
                    className={cn(textareaClass, 'min-h-[180px] flex-1')}
                  />
                  {fk.touched.body && fk.errors.body && <p className="mt-1 text-xs text-rose-600">{fk.errors.body}</p>}
                </div>
              </div>

              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                className={imageClass}
                onClick={() => fileRef.current?.click()}
              >
                {preview ? (
                  <img src={preview} alt="" className="h-full min-h-[420px] w-full object-cover" />
                ) : (
                  <span>Notification image</span>
                )}
              </label>

              <div className="flex flex-col items-end gap-3">
                {showSchedule && (
                  <input
                    type="datetime-local"
                    name="scheduledAt"
                    value={fk.values.scheduledAt}
                    onChange={fk.handleChange}
                    className={cn(fieldClass, 'max-w-xs')}
                  />
                )}
                <button
                  type="button"
                  onClick={() => void scheduleLater()}
                  disabled={fk.isSubmitting}
                  className="inline-flex h-11 items-center gap-2 rounded-md bg-[#001E5E] px-4 text-sm text-white disabled:opacity-60"
                >
                  <History className="size-4" />
                  Schedule for Later
                </button>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={fk.isSubmitting}
                onClick={() => {
                  modeRef.current = 'send'
                }}
                className="h-11 rounded-md bg-[#001E5E] px-6 text-sm font-medium text-white disabled:opacity-60"
              >
                {fk.isSubmitting ? 'Saving…' : 'Save & Send'}
              </button>
            </div>
          </form>
        )
      }}
    </Formik>
  )
}
