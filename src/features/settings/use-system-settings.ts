import { useCallback, useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { systemApi } from '@/lib/api'
import { ApiError } from '@/types/contract'
import { useSocket } from '@/hooks/use-socket'

export interface SystemLogEntry {
  id: number
  at: number
  message: string
  type?: string
}

function msg(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message || fallback
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export function useSystemSettings() {
  const [logs, setLogs] = useState<SystemLogEntry[]>([])
  const [, setLogId] = useState(0)
  const { onSystem } = useSocket(null)

  const updatesQuery = useQuery({
    queryKey: ['system', 'updates'],
    queryFn: () => systemApi.updates(),
    retry: false,
  })

  useEffect(() => {
    return onSystem((event) => {
      setLogId((n) => {
        const id = n + 1
        setLogs((prev) =>
          [...prev, { id, at: event.at ?? Date.now(), message: event.message, type: event.type }].slice(-200)
        )
        return id
      })
    })
  }, [onSystem])

  const updateMutation = useMutation({
    mutationFn: (token: string) => systemApi.update(token),
    onSuccess: () => {
      toast.success('Solicitud de actualización procesada')
      void updatesQuery.refetch()
    },
    onError: (error) => {
      toast.error(msg(error, 'No se pudo ejecutar la actualización'))
    },
  })

  const clearLogs = useCallback(() => setLogs([]), [])

  return {
    updates: updatesQuery.data ?? null,
    loading: updatesQuery.isPending,
    error: updatesQuery.error ? msg(updatesQuery.error, 'No se pudo consultar el estado de actualizaciones') : null,
    refetch: () => void updatesQuery.refetch(),

    update: (token: string) => updateMutation.mutateAsync(token),
    updating: updateMutation.isPending,

    logs,
    clearLogs,
  }
}
