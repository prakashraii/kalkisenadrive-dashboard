import { useQuery } from '@tanstack/react-query'
import { Formik } from 'formik'
import { ChevronDown, Pencil, Plus } from 'lucide-react'
import { useState, type ChangeEventHandler, type ReactNode } from 'react'
import * as Yup from 'yup'
import { api } from '../../lib/api'
import { cn } from '../../lib/cn'
import { useAdminMutation } from '../../viewmodels/useAdminCrud'

const fieldClass =
  'h-11 w-full rounded-lg bg-[#E5E5E5] px-4 text-sm text-[#262626] outline-none placeholder:text-[#262626]/70'

const textareaClass =
  'min-h-[160px] w-full resize-none rounded-lg bg-[#E5E5E5] px-4 py-3 text-sm text-[#262626] outline-none placeholder:text-[#262626]/70'

const coverClass =
  'min-h-[420px] w-full flex-1 resize-none rounded-lg bg-[#E5E5E5] px-4 py-3 text-sm text-[#262626] outline-none placeholder:text-[#262626]/70'

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'np', label: 'Nepali' },
  { value: 'hi', label: 'Hindi' },
]

export type BookChapter = {
  id?: string
  chapterNo: number
  title: string
  content?: string | null
  contentUrl?: string | null
  language?: string
  sortOrder?: number
}

export type Book = {
  id: string
  title: string
  author: string
  coverUrl?: string | null
  priceCents: number
  stock: number
  type: string
  description?: string | null
  shortDetails?: string | null
  language: string
  status: string
  membershipBonus?: string
  chapters?: BookChapter[]
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

const emptyChapter = (chapterNo: number, language: string): BookChapter => ({
  chapterNo,
  title: '',
  content: '',
  contentUrl: '',
  language,
  sortOrder: chapterNo - 1,
})

const schema = Yup.object({
  title: Yup.string().required('Required'),
  author: Yup.string().required('Required'),
  price: Yup.number().min(0, 'Must be 0 or more').required('Required'),
  stock: Yup.number().min(0, 'Must be 0 or more').required('Required'),
  type: Yup.string().required(),
  description: Yup.string(),
  shortDetails: Yup.string(),
  language: Yup.string().required(),
  status: Yup.string().required(),
  coverUrl: Yup.string(),
  chapters: Yup.array().of(
    Yup.object({
      chapterNo: Yup.number().min(1).required(),
      title: Yup.string(),
      content: Yup.string(),
      contentUrl: Yup.string(),
      language: Yup.string(),
    }),
  ),
})

export function BookDetailsForm({
  bookId,
  onClose,
}: {
  bookId: string | 'new'
  onClose: () => void
}) {
  const mut = useAdminMutation(['books', 'dashboard-summary'])
  const isNew = bookId === 'new'
  const [editing, setEditing] = useState(isNew)
  const [step, setStep] = useState<'details' | 'chapters'>('details')
  const [chapterIndex, setChapterIndex] = useState(0)
  const readOnly = !editing

  const { data: book } = useQuery({
    queryKey: ['book', bookId],
    queryFn: async () => (await api.get<Book>(`/admin/books/${bookId}`)).data,
    enabled: !isNew,
  })

  const initialChapters = book?.chapters?.length ? book.chapters : [emptyChapter(1, book?.language ?? 'en')]

  const initialValues = {
    title: book?.title ?? '',
    author: book?.author ?? '',
    price: book ? book.priceCents / 100 : 0,
    stock: book?.stock ?? 0,
    type: book?.type ?? 'PHYSICAL',
    description: book?.description ?? '',
    shortDetails: book?.shortDetails ?? '',
    language: book?.language ?? 'en',
    status: book?.status ?? 'AVAILABLE',
    coverUrl: book?.coverUrl ?? '',
    chapters: initialChapters,
  }

  return (
    <div className="-mx-8 -my-8 min-h-full bg-white px-8 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <span className="inline-flex items-center rounded-md bg-[#E8F5E9] px-3 py-1.5 text-xs font-medium text-[#1B5E20]">
          2 year membership free
        </span>
        {!isNew && (
          <button
            type="button"
            onClick={() => setEditing(true)}
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
          const chapters = values.chapters
            .filter((c) => c.title.trim())
            .map((c, i) => ({
              chapterNo: c.chapterNo || i + 1,
              title: c.title.trim(),
              content: c.content || undefined,
              contentUrl: c.contentUrl || undefined,
              language: c.language || values.language,
              sortOrder: i,
            }))
          const payload = {
            title: values.title,
            author: values.author,
            priceCents: Math.round(Number(values.price) * 100),
            stock: Number(values.stock),
            type: values.type,
            description: values.description || undefined,
            shortDetails: values.shortDetails || undefined,
            language: values.language,
            status: values.status,
            coverUrl: values.coverUrl || undefined,
            chapters,
          }
          if (isNew) await mut.mutateAsync(() => api.post('/admin/books', payload))
          else await mut.mutateAsync(() => api.patch(`/admin/books/${bookId}`, payload))
          onClose()
        }}
      >
        {(fk) => {
          const chapters = fk.values.chapters
          const safeIndex = Math.min(chapterIndex, Math.max(0, chapters.length - 1))
          const chapter = chapters[safeIndex] ?? emptyChapter(1, fk.values.language)

          function setChapter(patch: Partial<BookChapter>) {
            const next = chapters.map((c, i) => (i === safeIndex ? { ...c, ...patch } : c))
            void fk.setFieldValue('chapters', next)
          }

          return (
            <form onSubmit={fk.handleSubmit} className="max-w-6xl">
              {step === 'chapters' && (
                <div className="mb-6">
                  <span className="inline-flex h-10 items-center rounded-md bg-[#020B17] px-4 text-sm text-white">
                    Chapter Details
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.7fr)]">
                {step === 'details' ? (
                  <div className="flex flex-col gap-6">
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

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <input
                          name="author"
                          value={fk.values.author}
                          onChange={fk.handleChange}
                          readOnly={readOnly}
                          placeholder="Author"
                          className={fieldClass}
                        />
                        {fk.touched.author && fk.errors.author && (
                          <p className="mt-1 text-xs text-rose-600">{fk.errors.author}</p>
                        )}
                      </div>
                      <FilledSelect
                        name="type"
                        value={fk.values.type}
                        onChange={fk.handleChange}
                        disabled={readOnly}
                      >
                        <option value="PHYSICAL">Physical</option>
                        <option value="DIGITAL">Digital</option>
                      </FilledSelect>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <input
                        type="number"
                        name="price"
                        min={0}
                        value={fk.values.price}
                        onChange={fk.handleChange}
                        readOnly={readOnly}
                        placeholder="Price"
                        className={fieldClass}
                      />
                      <input
                        type="number"
                        name="stock"
                        min={0}
                        value={fk.values.stock}
                        onChange={fk.handleChange}
                        readOnly={readOnly}
                        placeholder="Stock"
                        className={fieldClass}
                      />
                    </div>

                    <textarea
                      name="description"
                      value={fk.values.description}
                      onChange={fk.handleChange}
                      readOnly={readOnly}
                      placeholder="Description"
                      className={textareaClass}
                    />

                    <textarea
                      name="shortDetails"
                      value={fk.values.shortDetails}
                      onChange={fk.handleChange}
                      readOnly={readOnly}
                      placeholder="Short details"
                      className={textareaClass}
                    />

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <FilledSelect
                        name="status"
                        value={fk.values.status}
                        onChange={fk.handleChange}
                        disabled={readOnly}
                      >
                        <option value="AVAILABLE">Available</option>
                        <option value="OUT_OF_STOCK">Out of stock</option>
                        <option value="INACTIVE">Inactive</option>
                      </FilledSelect>
                      <FilledSelect
                        name="language"
                        value={fk.values.language}
                        onChange={fk.handleChange}
                        disabled={readOnly}
                      >
                        {LANGUAGES.map((lang) => (
                          <option key={lang.value} value={lang.value}>
                            {lang.label}
                          </option>
                        ))}
                      </FilledSelect>
                    </div>

                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (!fk.values.title || !fk.values.author) {
                            void fk.setTouched({ title: true, author: true })
                            return
                          }
                          setStep('chapters')
                        }}
                        className="inline-flex h-11 items-center gap-2 rounded-md bg-[#020B17] px-4 text-sm text-white"
                      >
                        <Plus className="size-4" />
                        Add Details
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <FilledSelect
                        name={`chapters.${safeIndex}.chapterNo`}
                        value={String(chapter.chapterNo)}
                        onChange={(e) => {
                          const nextNo = Number(e.target.value)
                          const found = chapters.findIndex((c) => c.chapterNo === nextNo)
                          if (found >= 0) setChapterIndex(found)
                        }}
                        disabled={readOnly && chapters.length <= 1}
                      >
                        {chapters.map((c) => (
                          <option key={c.chapterNo} value={c.chapterNo}>
                            Chapter {c.chapterNo}
                          </option>
                        ))}
                      </FilledSelect>
                      <FilledSelect
                        name={`chapters.${safeIndex}.language`}
                        value={chapter.language ?? fk.values.language}
                        onChange={(e) => setChapter({ language: e.target.value })}
                        disabled={readOnly}
                      >
                        {LANGUAGES.map((lang) => (
                          <option key={lang.value} value={lang.value}>
                            {lang.label}
                          </option>
                        ))}
                      </FilledSelect>
                    </div>

                    <input
                      name={`chapters.${safeIndex}.title`}
                      value={chapter.title}
                      onChange={(e) => setChapter({ title: e.target.value })}
                      readOnly={readOnly}
                      placeholder="Chapter title"
                      className={fieldClass}
                    />

                    <textarea
                      name={`chapters.${safeIndex}.content`}
                      value={chapter.content ?? ''}
                      onChange={(e) => setChapter({ content: e.target.value })}
                      readOnly={readOnly}
                      placeholder="Chapter content"
                      className={cn(textareaClass, 'min-h-[220px]')}
                    />

                    {!readOnly && (
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const nextNo = (chapters[chapters.length - 1]?.chapterNo ?? 0) + 1
                            void fk.setFieldValue('chapters', [
                              ...chapters,
                              emptyChapter(nextNo, chapter.language ?? fk.values.language),
                            ])
                            setChapterIndex(chapters.length)
                          }}
                          className="inline-flex h-11 items-center gap-2 rounded-md bg-[#020B17] px-4 text-sm text-white"
                        >
                          <Plus className="size-4" />
                          Add Chapter
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {step === 'details' ? (
                  <textarea
                    name="coverUrl"
                    value={fk.values.coverUrl}
                    onChange={fk.handleChange}
                    readOnly={readOnly}
                    placeholder="Cover image URL"
                    className={coverClass}
                  />
                ) : (
                  <textarea
                    name={`chapters.${safeIndex}.contentUrl`}
                    value={chapter.contentUrl ?? ''}
                    onChange={(e) => setChapter({ contentUrl: e.target.value })}
                    readOnly={readOnly}
                    placeholder="Chapter image or file URL"
                    className={coverClass}
                  />
                )}
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (step === 'chapters') setStep('details')
                    else onClose()
                  }}
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
                    {fk.isSubmitting ? 'Saving…' : step === 'chapters' ? 'Upload' : 'Save'}
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
