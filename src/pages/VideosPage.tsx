import { Plus, Video as VideoIcon } from 'lucide-react'
import { useState } from 'react'
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
  const [visibilityId, setVisibilityId] = useState<string | null>(null)

  if (form === 'new') {
    return <VideoDetailsForm videoId="new" onClose={() => setParams({})} />
  }

  if (form) {
    return <VideoDetailsForm videoId={form} onClose={() => setParams({})} />
  }

  if (viewId) {
    return (
      <VideoDetailsForm
        videoId={viewId}
        readOnly
        onClose={() => setParams({})}
        onEdit={() =>
          setParams({
            form: viewId,
            tab: params.get('tab') === 'link' ? 'link' : 'video',
          })
        }
      />
    )
  }

  const total = list.data?.meta.total ?? 0
  const empty = !list.isLoading && total === 0 && !list.search

  function openNew(tab: 'video' | 'link' = 'video') {
    setParams({ form: 'new', tab })
  }

  function videoTab(video: Video) {
    return isUploadedVideo(video.sourceUrl) ? 'video' : 'link'
  }

  if (empty) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
        <div className="flex size-40 items-center justify-center rounded-full bg-white shadow-sm">
          <VideoIcon className="size-16 text-[#020B17]" strokeWidth={1.25} />
        </div>
        <button
          type="button"
          onClick={() => openNew('video')}
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
          onClick={() => openNew('video')}
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
            onView={() => setParams({ view: v.id, tab: videoTab(v) })}
            onEdit={() => setParams({ form: v.id, tab: videoTab(v) })}
            onDelete={() => setDel(v)}
            visibilityPending={visibilityId === v.id}
            onVisibilityChange={async (published) => {
              setVisibilityId(v.id)
              try {
                await mut.run(() => api.patch(`/admin/videos/${v.id}`, { published }), {
                  success: published ? 'Video is now public' : 'Video is now private',
                  error: 'Could not update visibility',
                })
              } catch {
                // Toast already shown
              } finally {
                setVisibilityId(null)
              }
            }}
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
        message="This cannot be undone."
        onClose={() => setDel(null)}
        pending={mut.isPending}
        onConfirm={async () => {
          if (!del) return
          try {
            await mut.run(() => api.delete(`/admin/videos/${del.id}`), {
              success: 'Video deleted',
              error: 'Could not delete video',
            })
            setDel(null)
          } catch {
            // Keep dialog open after a failed delete
          }
        }}
      />
    </div>
  )
}
