import { Play, Plus, Video as VideoIcon } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { VideoDetailsForm, type Video } from '../components/videos/VideoDetailsForm'
import { ActionButtons } from '../components/ui/Actions'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Pagination } from '../components/ui/Pagination'
import { StatusBadge } from '../components/ui/StatusBadge'
import { TableToolbar } from '../components/ui/TableToolbar'
import { api } from '../lib/api'
import { isUploadedVideo, mediaUrl, videoThumbnail } from '../lib/media'
import { useAdminList, useAdminMutation } from '../viewmodels/useAdminCrud'

export function VideosPage() {
  const [params, setParams] = useSearchParams()
  const viewId = params.get('view')
  const form = params.get('form')
  const list = useAdminList<Video>('videos', '/admin/videos')
  const mut = useAdminMutation(['videos'])
  const [del, setDel] = useState<Video | null>(null)

  if (form === 'new') {
    return <VideoDetailsForm videoId="new" onClose={() => setParams({})} />
  }

  if (viewId) {
    return <VideoDetailsForm videoId={viewId} onClose={() => setParams({})} />
  }

  const total = list.data?.meta.total ?? 0
  const empty = !list.isLoading && total === 0 && !list.search

  function openForm(tab: 'video' | 'link' = 'video') {
    setParams({ form: 'new', tab })
  }

  if (empty) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
        <div className="flex size-40 items-center justify-center rounded-full bg-white shadow-sm">
          <VideoIcon className="size-16 text-[#020B17]" strokeWidth={1.25} />
        </div>
        <button
          type="button"
          onClick={() => openForm('video')}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-[#020B17] px-4 text-sm text-white"
        >
          <Plus className="size-4" />
          Add Video
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-normal text-black">Video List</h2>
          <button
            type="button"
            onClick={() => openForm('video')}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-[#020B17] px-4 text-sm text-white"
          >
            <Plus className="size-4" />
            Add Video
          </button>
        </div>
        <TableToolbar search={list.search} onSearch={list.setSearch} />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {(list.data?.data ?? []).map((v) => {
            const thumb = videoThumbnail(v)
            const fileUrl = isUploadedVideo(v.sourceUrl)
            return (
              <article key={v.id} className="overflow-hidden rounded-xl bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() =>
                    setParams({ view: v.id, tab: fileUrl ? 'video' : 'link' })
                  }
                  className="group relative block aspect-video w-full bg-[#E5E5E5]"
                >
                  {thumb ? (
                    <img src={thumb} alt="" className="h-full w-full object-cover" />
                  ) : fileUrl ? (
                    <video src={mediaUrl(v.sourceUrl)} className="h-full w-full object-cover" muted />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[#262626]/60">
                      {v.title}
                    </div>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition group-hover:opacity-100">
                    <span className="flex size-12 items-center justify-center rounded-full bg-white/90 text-[#020B17]">
                      <Play className="size-5 fill-current" />
                    </span>
                  </span>
                </button>
                <div className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-medium text-[#262626]">{v.title}</h3>
                    <p className="mt-1 text-xs text-[#262626]/60">
                      {fileUrl ? 'Uploaded video' : 'Link'}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <StatusBadge status={v.published ? 'APPROVED' : 'DRAFT'} />
                    <ActionButtons
                      onView={() =>
                        setParams({
                          view: v.id,
                          tab: fileUrl ? 'video' : 'link',
                        })
                      }
                      onDelete={() => setDel(v)}
                    />
                  </div>
                </div>
              </article>
            )
          })}
        </div>
        <Pagination
          page={list.data?.meta.page ?? 1}
          pageCount={list.data?.meta.pageCount ?? 1}
          total={total}
          limit={10}
          onPage={list.setPage}
        />
      </section>
      <ConfirmDialog
        open={!!del}
        title="Remove video"
        message="The video will be archived."
        onClose={() => setDel(null)}
        onConfirm={async () => {
          if (!del) return
          await mut.mutateAsync(() => api.delete(`/admin/videos/${del.id}`))
          setDel(null)
        }}
      />
    </div>
  )
}
