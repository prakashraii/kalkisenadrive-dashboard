import { api } from './api'

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

const IMAGE_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'])
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
const DOCUMENT_EXTS = [...IMAGE_EXTS, '.pdf']

function fileExt(name: string) {
  const index = name.lastIndexOf('.')
  return index >= 0 ? name.slice(index).toLowerCase() : ''
}

export function validateUploadFile(file: File, { allowPdf = false }: { allowPdf?: boolean } = {}) {
  const ext = fileExt(file.name)
  const allowedExts = allowPdf ? DOCUMENT_EXTS : IMAGE_EXTS
  const mimeOk = IMAGE_MIMES.has(file.type) || (allowPdf && file.type === 'application/pdf')
  const extOk = allowedExts.includes(ext)
  if (!mimeOk && !extOk) {
    return allowPdf
      ? 'Only JPG, PNG, WebP, GIF or PDF files are allowed'
      : 'Only JPG, PNG, WebP or GIF images are allowed'
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return 'File must be 5 MB or smaller'
  }
  return null
}

export async function uploadImage(file: File, folder?: string) {
  const body = new FormData()
  body.append('file', file)
  if (folder) body.append('folder', folder)
  const { data } = await api.post<{ url: string }>('/admin/uploads/image', body)
  return data.url
}
