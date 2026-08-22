import { Copy, Globe, Link2, Lock, Share2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '../../lib/cn'
import { isUploadedVideo, mediaUrl, videoThumbnail } from '../../lib/media'
import type { Video } from './VideoDetailsForm'

function formatCardDate(value: string) {
  return new Date(value)
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .replace(/ (\d{4})$/, ', $1')
}

function formatCardTime(value: string) {
  return new Date(value)
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toLowerCase()
}

function formatDaysAgo(value: string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000))
  return `${days} Day${days === 1 ? '' : 's'}`
}

function shareUrl(video: Video) {
  if (isUploadedVideo(video.sourceUrl)) return mediaUrl(video.sourceUrl)
  return video.sourceUrl
}

async function copyText(value: string, ok: string) {
  try {
    await navigator.clipboard.writeText(value)
    toast.success(ok)
  } catch {
    toast.error('Could not copy link')
  }
}

export function VideoListCard({
  video,
  onOpen,
}: {
  video: Video
  onOpen: () => void
}) {
  const fileUrl = isUploadedVideo(video.sourceUrl)
  const thumb = videoThumbnail(video)
  const href = shareUrl(video)
  const kind = fileUrl ? 'Video' : 'Link'

  async function share() {
    if (!href) {
      toast.error('No video link')
      return
    }
    if (navigator.share) {
      try {
        await navigator.share({ title: video.title, url: href })
        return
      } catch {
        /* dismissed */
      }
    }
    await copyText(href, 'Link copied')
  }

  return (
    <article className="grid grid-cols-1 items-center gap-4 rounded-xl bg-white px-4 py-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] lg:grid-cols-[140px_minmax(0,1.4fr)_120px_100px_80px_56px_228px] lg:gap-5 lg:px-5">
      <button
        type="button"
        onClick={onOpen}
        className="h-[86px] w-[140px] overflow-hidden rounded-lg bg-[#E5E5E5]"
      >
        {thumb ? (
          <img src={thumb} alt="" className="h-full w-full object-cover" />
        ) : fileUrl ? (
          <video src={mediaUrl(video.sourceUrl)} className="h-full w-full object-cover" muted />
        ) : (
          <span className="flex h-full items-center justify-center px-2 text-center text-[11px] text-[#262626]/50">
            {video.title}
          </span>
        )}
      </button>

      <div className="min-w-0">
        <button type="button" onClick={onOpen} className="block w-full text-left">
          <h3 className="truncate text-[15px] font-semibold text-black">{video.title}</h3>
        </button>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-[#2F80ED] hover:underline"
          >
            <Link2 className="size-3.5" />
            Video Link
          </a>
        ) : (
          <span className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-[#262626]/40">
            <Link2 className="size-3.5" />
            Video Link
          </span>
        )}
      </div>

      {video.createdAt ? (
        <div className="text-sm leading-5 text-black">
          <p>{formatCardDate(video.createdAt)}</p>
          <p>{formatCardTime(video.createdAt)}</p>
        </div>
      ) : (
        <div className="text-sm text-[#262626]/40">—</div>
      )}

      <div className="flex items-center gap-2 text-sm text-black">
        {video.published ? <Globe className="size-4 shrink-0" /> : <Lock className="size-4 shrink-0" />}
        {video.published ? 'Public' : 'Private'}
      </div>

      <p className="text-sm text-black">{video.createdAt ? formatDaysAgo(video.createdAt) : '—'}</p>

      <p className={cn('text-sm font-medium', kind === 'Video' ? 'text-[#00A419]' : 'text-[#9747FF]')}>
        {kind}
      </p>

      <div className="flex w-full flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => void share()}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-black/15 bg-white text-xs text-black"
          >
            <Share2 className="size-3.5" />
            Share
          </button>
          <button
            type="button"
            onClick={() => {
              if (!href) {
                toast.error('No video link')
                return
              }
              void copyText(href, 'Link copied')
            }}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-black/15 bg-white text-xs text-black"
          >
            <Copy className="size-3.5" />
            Copy Link
          </button>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-[#020B17] text-xs text-white"
        >
          <Upload className="size-3.5" />
          Upload Now
        </button>
      </div>
    </article>
  )
}
