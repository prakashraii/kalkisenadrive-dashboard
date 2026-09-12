import { useQuery } from '@tanstack/react-query'
import { Formik } from 'formik'
import { ChevronDown, History } from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ChangeEventHandler,
  type DragEvent,
  type FocusEventHandler,
  type ReactNode,
} from 'react'
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

const TARGET_LINK_TYPES = new Set(['VIDEO', 'BOOK', 'CLINIC'])

type Option = { id: string; title: string }

const schema = Yup.object({
  audience: Yup.string().required('Required'),
  language: Yup.string().required('Required'),
  linkType: Yup.string().required('Required'),
  linkTarget: Yup.string().when('linkType', {
    is: (type: string) => TARGET_LINK_TYPES.has(type),
    then: (s) => s.required('Required'),
    otherwise: (s) => s,
  }),
  title: Yup.string().trim().required('Required'),
  body: Yup.string().trim().required('Required'),
  scheduledAt: Yup.string(),
})

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null
  return (
    <p id={id} className="mt-1 text-xs text-rose-600" role="alert">
      {error}
    </p>
  )
}

function FilledSelect({
  name,
  value,
  onChange,
  onBlur,
  invalid,
  describedBy,
  required,
  children,
}: {
  name: string
  value: string
  onChange?: ChangeEventHandler<HTMLSelectElement>
  onBlur?: FocusEventHandler<HTMLSelectElement>
  invalid?: boolean
  describedBy?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div className="relative">
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        aria-invalid={invalid || undefined}
        aria-required={required || undefined}
        aria-describedby={describedBy}
        className={cn(fieldClass, 'appearance-none pr-10', invalid && 'ring-1 ring-rose-500')}
      >
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
        audience: '',
        language: '',
        linkType: '',
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
        const targetRequired = TARGET_LINK_TYPES.has(fk.values.linkType)
        const showError = (field: keyof typeof fk.values) =>
          Boolean((fk.touched[field] || fk.submitCount > 0) && fk.errors[field])

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
          <form noValidate onSubmit={fk.handleSubmit} className="max-w-6xl">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.7fr)]">
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <FilledSelect
                      name="audience"
                      required
                      value={fk.values.audience}
                      onChange={fk.handleChange}
                      onBlur={fk.handleBlur}
                      invalid={showError('audience')}
                      describedBy={showError('audience') ? 'audience-error' : undefined}
                    >
                      <option value="">Audience</option>
                      <option value="ALL">All users</option>
                      <option value="MEMBERS">Members</option>
                      <option value="DRIVERS">Drivers</option>
                    </FilledSelect>
                    <FieldError id="audience-error" error={showError('audience') ? fk.errors.audience : undefined} />
                  </div>
                  <div>
                    <FilledSelect
                      name="language"
                      required
                      value={fk.values.language}
                      onChange={fk.handleChange}
                      onBlur={fk.handleBlur}
                      invalid={showError('language')}
                      describedBy={showError('language') ? 'language-error' : undefined}
                    >
                      <option value="">Language</option>
                      {LANGUAGES.map((lang) => (
                        <option key={lang.value} value={lang.value}>
                          {lang.label}
                        </option>
                      ))}
                    </FilledSelect>
                    <FieldError id="language-error" error={showError('language') ? fk.errors.language : undefined} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <FilledSelect
                      name="linkType"
                      required
                      value={fk.values.linkType}
                      onChange={(e) => {
                        fk.handleChange(e)
                        void fk.setFieldValue('linkTarget', '')
                      }}
                      onBlur={fk.handleBlur}
                      invalid={showError('linkType')}
                      describedBy={showError('linkType') ? 'linkType-error' : undefined}
                    >
                      <option value="">Select page</option>
                      {LINK_TYPES.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </FilledSelect>
                    <FieldError id="linkType-error" error={showError('linkType') ? fk.errors.linkType : undefined} />
                  </div>
                  <div>
                    <FilledSelect
                      name="linkTarget"
                      required={targetRequired}
                      value={fk.values.linkTarget}
                      onChange={fk.handleChange}
                      onBlur={fk.handleBlur}
                      invalid={showError('linkTarget')}
                      describedBy={showError('linkTarget') ? 'linkTarget-error' : undefined}
                    >
                      <option value="">
                        {fk.values.linkType === 'VIDEO'
                          ? 'Select video'
                          : fk.values.linkType === 'BOOK'
                            ? 'Select book'
                            : fk.values.linkType === 'CLINIC'
                              ? 'Select clinic'
                              : 'None'}
                      </option>
                      {hasTargets &&
                        linkOptions.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.title}
                          </option>
                        ))}
                    </FilledSelect>
                    <FieldError id="linkTarget-error" error={showError('linkTarget') ? fk.errors.linkTarget : undefined} />
                  </div>
                </div>

                <div>
                  <input
                    id="title"
                    name="title"
                    value={fk.values.title}
                    onChange={fk.handleChange}
                    onBlur={fk.handleBlur}
                    placeholder="Title"
                    className={cn(fieldClass, showError('title') && 'ring-1 ring-rose-500')}
                    aria-required="true"
                    aria-invalid={showError('title') || undefined}
                    aria-describedby={showError('title') ? 'title-error' : undefined}
                  />
                  <FieldError id="title-error" error={showError('title') ? fk.errors.title : undefined} />
                </div>

                <div>
                  <textarea
                    id="body"
                    name="body"
                    value={fk.values.body}
                    onChange={fk.handleChange}
                    onBlur={fk.handleBlur}
                    placeholder="Message"
                    className={cn(textareaClass, 'min-h-[180px] flex-1', showError('body') && 'ring-1 ring-rose-500')}
                    aria-required="true"
                    aria-invalid={showError('body') || undefined}
                    aria-describedby={showError('body') ? 'body-error' : undefined}
                  />
                  <FieldError id="body-error" error={showError('body') ? fk.errors.body : undefined} />
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
