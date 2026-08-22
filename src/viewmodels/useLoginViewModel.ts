import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../store/auth'

export function useLoginViewModel() {
  const navigate = useNavigate()
  const setAdmin = useAuth((s) => s.setAdmin)

  const mutation = useMutation({
    mutationFn: async (values: { email: string; password: string }) => {
      const { data } = await api.post('/admin/auth/login', values)
      return data
    },
    onSuccess: (data) => {
      setAdmin(data.admin)
      navigate('/')
    },
  })

  return {
    submit: (values: { email: string; password: string }) => mutation.mutateAsync(values),
    loading: mutation.isPending,
    error: mutation.error ? 'Invalid credentials' : null,
  }
}
