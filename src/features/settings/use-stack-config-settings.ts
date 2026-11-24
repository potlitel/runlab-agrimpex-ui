import { useCallback, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { stackConfigApi } from '@/lib/api'
import { ApiError, type StackConfigResponse, type StackConfigSavePayload } from '@/types/contract'

const TOKEN_KEY = 'runlabqa-stack-admin-token'

function readToken(): string {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

function persistToken(token: string): void {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    // sessionStorage puede estar bloqueado: el token sigue vivo en memoria.
  }
}

function msg(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message || fallback
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export function useStackConfigSettings() {
  const queryClient = useQueryClient()
  const [token, setTokenState] = useState(readToken)

  const query = useQuery({
    queryKey: ['system', 'stack-config', token],
    queryFn: () => stackConfigApi.get(token || undefined),
    retry: false,
  })

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['system', 'stack-config'] }),
    [queryClient],
  )

  const saveMutation = useMutation({
    mutationFn: (payload: StackConfigSavePayload) => {
      if (!token) throw new Error('Falta el token de administración.')
      return stackConfigApi.save(token, payload)
    },
    onSuccess: async () => {
      toast.success('Configuración del stack guardada')
      await invalidate()
    },
    onError: (error) => toast.error(msg(error, 'No se pudo guardar la configuración del stack')),
  })

  const restoreMutation = useMutation({
    mutationFn: () => {
      if (!token) throw new Error('Falta el token de administración.')
      return stackConfigApi.restore(token)
    },
    onSuccess: async () => {
      toast.success('Configuración del stack restaurada')
      await invalidate()
    },
    onError: (error) => toast.error(msg(error, 'No se pudo restaurar la configuración')),
  })

  const setToken = useCallback((next: string) => {
    persistToken(next)
    setTokenState(next)
  }, [])

  const status = query.error instanceof ApiError ? query.error.status : 0
  const error = query.error ? msg(query.error, 'No se pudo consultar la configuración del stack') : null

  return {
    data: (query.data ?? null) as StackConfigResponse | null,
    loading: query.isPending,
    error,
    disabled: status === 503,
    needsToken: status === 401,
    refetch: () => void query.refetch(),

    token,
    setToken,

    save: (payload: StackConfigSavePayload) => saveMutation.mutateAsync(payload),
    saving: saveMutation.isPending,
    restore: () => restoreMutation.mutateAsync(),
    restoring: restoreMutation.isPending,
  }
}
