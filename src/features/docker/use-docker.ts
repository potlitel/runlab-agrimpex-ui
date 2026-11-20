import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { dockerApi, featuresApi } from '@/lib/api'
import { ApiError } from '@/types/contract'
import { useSocket } from '@/hooks/use-socket'
import { useProfileStore } from '@/stores/profileStore'

export interface DockerLogEntry {
  id: number
  at: string
  message: string
  type: 'info' | 'error' | 'success' | 'cmd' | string
}

const MAX_LOGS = 400

function messageOf(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

function isUnavailable(error: unknown) {
  return error instanceof ApiError && (error.status === 403 || error.status === 404)
}

export function useDocker() {
  const queryClient = useQueryClient()
  const activeProfileId = useProfileStore((s) => s.activeProfileId)
  const [logs, setLogs] = useState<DockerLogEntry[]>([])
  const logId = useRef(0)
  const { onDocker } = useSocket(activeProfileId)

  const featuresQuery = useQuery({
    queryKey: ['features', activeProfileId],
    queryFn: () => featuresApi.get(),
    staleTime: 60_000,
    retry: false,
  })

  const enabled = featuresQuery.data?.docker !== false

  const checkQuery = useQuery({
    queryKey: ['docker', activeProfileId, 'check'],
    queryFn: () => dockerApi.check(),
    enabled,
    retry: false,
  })

  const statusQuery = useQuery({
    queryKey: ['docker', activeProfileId, 'status'],
    queryFn: () => dockerApi.status(),
    enabled,
    retry: false,
    refetchInterval: (query) => (query.state.data?.running ? 3000 : false),
  })

  const containersQuery = useQuery({
    queryKey: ['docker', activeProfileId, 'containers'],
    queryFn: () => dockerApi.containers(),
    enabled,
    retry: false,
  })

  const appendLog = useCallback((message: string, type: DockerLogEntry['type'] = 'info') => {
    logId.current += 1
    setLogs((prev) =>
      [...prev, { id: logId.current, at: new Date().toISOString(), message, type }].slice(-MAX_LOGS)
    )
  }, [])

  const refreshStatus = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['docker', activeProfileId] })
  }, [queryClient, activeProfileId])

  useEffect(() => {
    if (!activeProfileId || !enabled) return
    return onDocker({
      started: (event) => {
        appendLog(`Operación iniciada: ${event.action}`, 'cmd')
        refreshStatus()
      },
      log: (event) => {
        appendLog(event.message, event.type ?? 'info')
      },
      exit: (event) => {
        const ok = event.code === 0
        appendLog(
          `Operación finalizada (${event.action}) con código ${event.code}${event.error ? `: ${event.error}` : ''}`,
          ok ? 'success' : 'error'
        )
        refreshStatus()
      },
    })
  }, [activeProfileId, enabled, onDocker, appendLog, refreshStatus])

  const startDesktopMutation = useMutation({
    mutationFn: () => dockerApi.startDesktop(),
    onSuccess: (res) => {
      const ready = (res as { ready?: boolean }).ready
      if (ready) toast.success('Docker está listo')
      else toast.message('Solicitud de inicio enviada')
      refreshStatus()
    },
    onError: (error) => toast.error(messageOf(error, 'No se pudo iniciar Docker')),
  })

  const runMutation = useMutation({
    mutationFn: (action: string) => dockerApi.run(action),
    onSuccess: () => {
      toast.success('Acción Docker iniciada')
      refreshStatus()
    },
    onError: (error) => toast.error(messageOf(error, 'No se pudo ejecutar la acción')),
  })

  const stopMutation = useMutation({
    mutationFn: () => dockerApi.stop(),
    onSuccess: (res) => {
      toast.success(res.stopped ? 'Proceso detenido' : 'No había proceso activo')
      refreshStatus()
    },
    onError: (error) => toast.error(messageOf(error, 'No se pudo detener la operación')),
  })

  const unavailable =
    !enabled ||
    isUnavailable(checkQuery.error) ||
    isUnavailable(statusQuery.error)

  const running = !!statusQuery.data?.running

  return {
    enabled,
    unavailable,
    check: checkQuery.data ?? null,
    checkLoading: checkQuery.isPending,
    checkError:
      checkQuery.error && !isUnavailable(checkQuery.error)
        ? messageOf(checkQuery.error, 'No se pudo verificar Docker')
        : null,
    status: statusQuery.data ?? null,
    statusLoading: statusQuery.isPending,
    statusError:
      statusQuery.error && !isUnavailable(statusQuery.error)
        ? messageOf(statusQuery.error, 'No se pudo obtener el estado')
        : null,
    containers: containersQuery.data as
      | { ok?: boolean; error?: string; containers?: Array<Record<string, unknown>> }
      | null,
    containersLoading: containersQuery.isPending,
    containersError:
      containersQuery.error && !isUnavailable(containersQuery.error)
        ? messageOf(containersQuery.error, 'No se pudieron listar contenedores')
        : null,
    running,
    logs,
    clearLogs: () => setLogs([]),
    startDesktop: () => startDesktopMutation.mutate(),
    startingDesktop: startDesktopMutation.isPending,
    runAction: (action: string) => runMutation.mutate(action),
    runningAction: runMutation.isPending ? runMutation.variables : null,
    stop: () => stopMutation.mutate(),
    stopping: stopMutation.isPending,
    refresh: refreshStatus,
  }
}

export type UseDockerReturn = ReturnType<typeof useDocker>
