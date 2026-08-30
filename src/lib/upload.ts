import { api } from './api'

export async function uploadImage(file: File, folder?: string) {
  const body = new FormData()
  body.append('file', file)
  if (folder) body.append('folder', folder)
  const { data } = await api.post<{ url: string }>('/admin/uploads/image', body)
  return data.url
}
