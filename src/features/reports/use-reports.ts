import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { featuresApi, reportsApi } from '@/lib/api'
import { ApiError } from '@/types/contract'
import { useProfileStore } from '@/stores/profileStore'

function messageOf(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

function isUnavailable(error: unknown) {
  return error instanceof ApiError && (error.status === 403 || error.status === 404)
}

export function useReports() {
  const queryClient = useQueryClient()
  const activeProfileId = useProfileStore((s) => s.activeProfileId)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const featuresQuery = useQuery({
    queryKey: ['features', activeProfileId],
    queryFn: () => featuresApi.get(),
    staleTime: 60_000,
    retry: false,
  })

  const reportsEnabled = featuresQuery.data?.reports !== false

  const listQuery = useQuery({
    queryKey: ['reports', activeProfileId, 'list'],
    queryFn: () => reportsApi.list(),
    enabled: reportsEnabled,
    retry: false,
  })

  const analyticsQuery = useQuery({
    queryKey: ['reports', activeProfileId, 'analytics'],
    queryFn: () => reportsApi.analytics(),
    enabled: reportsEnabled,
    retry: false,
  })

  const detailQuery = useQuery({
    queryKey: ['reports', activeProfileId, 'detail', selectedId],
    queryFn: () => reportsApi.get(selectedId as string),
    enabled: reportsEnabled && !!selectedId,
    retry: false,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reportsApi.delete(id),
    onSuccess: (_data, id) => {
      toast.success('Reporte eliminado')
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      setSelectedId((current) => (current === id ? null : current))
    },
    onError: (error) => {
      toast.error(messageOf(error, 'No se pudo eliminar el reporte'))
    },
  })

  const listUnavailable = reportsEnabled && isUnavailable(listQuery.error)
  const analyticsUnavailable = reportsEnabled && isUnavailable(analyticsQuery.error)
  const unavailable =
    !reportsEnabled ||
    (reportsEnabled && listUnavailable && (analyticsUnavailable || !analyticsQuery.data))

  return {
    reportsEnabled,
    unavailable,
    featuresError: featuresQuery.error
      ? messageOf(featuresQuery.error, 'No se pudieron consultar los módulos disponibles')
      : null,

    reports: listQuery.data ?? [],
    listLoading: featuresQuery.isPending || (reportsEnabled && listQuery.isPending),
    listError:
      listQuery.error && !listUnavailable
        ? messageOf(listQuery.error, 'No se pudieron cargar los reportes')
        : null,

    analytics: analyticsQuery.data ?? null,
    analyticsLoading: reportsEnabled && analyticsQuery.isPending,
    analyticsError:
      analyticsQuery.error && !analyticsUnavailable
        ? messageOf(analyticsQuery.error, 'No se pudo cargar la analítica')
        : null,

    selectedId,
    selectReport: (id: string | null) => setSelectedId(id),
    detail: detailQuery.data ?? null,
    detailLoading: detailQuery.isPending,
    detailError: detailQuery.error
      ? messageOf(detailQuery.error, 'No se pudo cargar el detalle del reporte')
      : null,

    deleteReport: (id: string) => deleteMutation.mutate(id),
    deletingId: deleteMutation.isPending ? deleteMutation.variables : null,

    refresh: () => {
      void queryClient.invalidateQueries({ queryKey: ['reports'] })
      void featuresQuery.refetch()
    },
  }
}

export type UseReportsReturn = ReturnType<typeof useReports>
