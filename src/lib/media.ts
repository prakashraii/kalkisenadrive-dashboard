export function mediaUrl(path?: string | null) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3011/api/v1'
  const origin = base.replace(/\/api\/v1\/?$/, '')
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`
}

export function youtubeVideoId(url?: string | null) {
  if (!url) return null
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([A-Za-z0-9_-]{11})/,
  )
  return match?.[1] ?? null
}

export function youtubeEmbedUrl(url?: string | null) {
  const id = youtubeVideoId(url)
  return id ? `https://www.youtube.com/embed/${id}` : ''
}

export function videoThumbnail(video: { sourceUrl: string; thumbnailUrl?: string | null }) {
  if (video.thumbnailUrl) return mediaUrl(video.thumbnailUrl)
  const id = youtubeVideoId(video.sourceUrl)
  if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
  return ''
}

export function isUploadedVideo(url?: string | null) {
  return Boolean(url && (url.startsWith('/uploads/') || url.includes('/uploads/videos/')))
}
