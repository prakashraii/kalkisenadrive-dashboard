import { toast } from 'sonner'

export function getApiMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'response' in err) {
    const message = (err as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
    if (Array.isArray(message) && message.length) return message.join(', ')
    if (typeof message === 'string' && message.trim()) return message
  }
  return fallback
}

export async function withToast<T>(
  fn: () => Promise<T>,
  messages: { success: string; error: string },
): Promise<T> {
  try {
    const result = await fn()
    toast.success(messages.success)
    return result
  } catch (err) {
    toast.error(getApiMessage(err, messages.error))
    throw err
  }
}
