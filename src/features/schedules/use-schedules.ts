import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { featuresApi, schedulesApi, testsApi } from '@/lib/api'
import { ApiError, type Schedule } from '@/types/contract'
import { useSocket } from '@/hooks/use-socket'
import { useProfileStore } from '@/stores/profileStore'

export interface ScheduleActivity {
  id: number
  at: number
  type: 'run' | 'log'
  scheduleId?: string
  name?: string
  total?: number
  message?: string
  level?: string
}

const MAX_ACTIVITY = 200

function messageOf(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message || fallback
  if (error instanceof Error && error.message) return error.message
  return fallback
}

function isUnavailable(error: unknown) {
  return error instanceof ApiError && (error.status === 403 || error.status === 404)
}

export function useSchedules() {
  const queryClient = useQueryClient()
  const activeProfileId = useProfileStore((s) => s.activeProfileId)
  const [activity, setActivity] = useState<ScheduleActivity[]>([])
  const activityId = useRef(0)
  const { onSchedule } = useSocket(activeProfileId)

  const featuresQuery = useQuery({
    queryKey: ['features', activeProfileId],
    queryFn: () => featuresApi.get(),
    staleTime: 60_000,
    retry: false,
  })

  const enabled = featuresQuery.data?.schedules !== false

  const schedulesQuery = useQuery({
    queryKey: ['schedules', activeProfileId],
    queryFn: () => schedulesApi.list(),
    enabled,
    retry: false,
  })

  const testsCachedQuery = useQuery({
    queryKey: ['tests', activeProfileId, 'cached'],
    queryFn: () => testsApi.cached(),
    enabled,
    retry: false,
  })

  const collectMutation = useMutation({
    mutationFn: () => testsApi.collect(),
    onSuccess: (data) => {
      queryClient.setQueryData(['tests', activeProfileId, 'cached'], data)
      toast.success(
        data.total > 0 ? `Catálogo actualizado: ${data.total} tests` : 'Sin tests en el proyecto'
      )
    },
    onError: (error) => toast.error(messageOf(error, 'No se pudo actualizar el catálogo')),
  })

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['schedules', activeProfileId] })
  }, [queryClient, activeProfileId])

  useEffect(() => {
    if (!activeProfileId || !enabled) return
    return onSchedule({
      run: (event) => {
        activityId.current += 1
        setActivity((prev) =>
          [
            ...prev,
            {
              id: activityId.current,
              at: Date.now(),
              type: 'run' as const,
              scheduleId: event.id,
              name: event.name,
              total: event.total,
            },
          ].slice(-MAX_ACTIVITY)
        )
        refresh()
      },
      log: (event) => {
        activityId.current += 1
        setActivity((prev) =>
          [
            ...prev,
            {
              id: activityId.current,
              at: event.ts ?? Date.now(),
              type: 'log' as const,
              message: event.message,
              level: event.type,
            },
          ].slice(-MAX_ACTIVITY)
        )
        refresh()
      },
    })
  }, [activeProfileId, enabled, onSchedule, refresh])

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Schedule>) => schedulesApi.create(payload),
    onSuccess: () => {
      toast.success('Programación creada')
      refresh()
    },
    onError: (error) => toast.error(messageOf(error, 'No se pudo crear la programación')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Schedule> }) =>
      schedulesApi.update(id, payload),
    onSuccess: () => {
      toast.success('Programación actualizada')
      refresh()
    },
    onError: (error) => toast.error(messageOf(error, 'No se pudo actualizar la programación')),
  })

  const toggleMutation = useMutation({
    mutationFn: (id: string) => schedulesApi.toggle(id),
    onSuccess: () => {
      toast.success('Estado actualizado')
      refresh()
    },
    onError: (error) => toast.error(messageOf(error, 'No se pudo cambiar el estado')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => schedulesApi.delete(id),
    onSuccess: () => {
      toast.success('Programación eliminada')
      refresh()
    },
    onError: (error) => toast.error(messageOf(error, 'No se pudo eliminar la programación')),
  })

  const runNowMutation = useMutation({
    mutationFn: (id: string) => schedulesApi.runNow(id),
    onSuccess: () => {
      toast.success('Ejecución solicitada')
      refresh()
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        toast.error(error.message || 'Hay una ejecución en curso o no se puede iniciar ahora')
      } else {
        toast.error(messageOf(error, 'No se pudo ejecutar la programación'))
      }
    },
  })

  const unavailable =
    !enabled || isUnavailable(schedulesQuery.error)

  return {
    enabled,
    unavailable,
    schedules: schedulesQuery.data?.schedules ?? [],
    loading: featuresQuery.isPending || schedulesQuery.isPending,
    error:
      schedulesQuery.error && !isUnavailable(schedulesQuery.error)
        ? messageOf(schedulesQuery.error, 'No se pudieron cargar las programaciones')
        : null,

    testsTree: testsCachedQuery.data,
    testsLoading: testsCachedQuery.isPending,
    collectTests: () => collectMutation.mutate(),
    collectingTests: collectMutation.isPending,

    activity,
    clearActivity: () => setActivity([]),

    create: (payload: Partial<Schedule>) => createMutation.mutateAsync(payload),
    creating: createMutation.isPending,
    update: (id: string, payload: Partial<Schedule>) => updateMutation.mutateAsync({ id, payload }),
    updating: updateMutation.isPending,
    toggle: (id: string) => toggleMutation.mutate(id),
    togglingId: toggleMutation.isPending ? toggleMutation.variables : null,
    remove: (id: string) => deleteMutation.mutate(id),
    removingId: deleteMutation.isPending ? deleteMutation.variables : null,
    runNow: (id: string) => runNowMutation.mutate(id),
    runningNowId: runNowMutation.isPending ? runNowMutation.variables : null,

    refresh,
  }
}

export type UseSchedulesReturn = ReturnType<typeof useSchedules>
