import { useState } from 'react'
import { Plus, Video as VideoIcon } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { VideoDetailsForm, type Video } from '../components/videos/VideoDetailsForm'
import { VideoListCard } from '../components/videos/VideoListCard'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Pagination } from '../components/ui/Pagination'
import { api } from '../lib/api'
import { isUploadedVideo } from '../lib/media'
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" className="h-11 min-w-[72px] rounded-md bg-[#020B17] px-5 text-sm text-white">
          All
        </button>
        <button
          type="button"
          onClick={() => openForm('video')}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-[#020B17] px-4 text-sm text-white"
        >
          <Plus className="size-4" />
          Add Video
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {(list.data?.data ?? []).map((v) => (
          <VideoListCard
            key={v.id}
            video={v}
            onEdit={() =>
              setParams({
                view: v.id,
                tab: isUploadedVideo(v.sourceUrl) ? 'video' : 'link',
              })
            }
            onDelete={() => setDel(v)}
          />
        ))}
      </div>

      <div className="overflow-hidden rounded-xl">
        <Pagination
          page={list.data?.meta.page ?? 1}
          pageCount={list.data?.meta.pageCount ?? 1}
          total={total}
          limit={10}
          onPage={list.setPage}
        />
      </div>

      <ConfirmDialog
        open={!!del}
        title="Delete video"
        message="Delete this video? This cannot be undone."
        pending={mut.isPending}
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
