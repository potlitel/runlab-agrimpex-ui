import { useQuery } from '@tanstack/react-query'
import { systemApi } from '@/lib/api'
import type { HealthBadgeStatus, HealthDetail } from '@/types/contract'

const REFETCH_INTERVAL_MS = 30_000
const STALE_TIME_MS = 10_000

/**
 * Estado del backend para la badge del header. Es informativo: sus errores no
 * se propagan ni condicionan las queries de las vistas de features.
 */
export function useHealth() {
  const query = useQuery<HealthDetail>({
    queryKey: ['health', 'detail'],
    queryFn: () => systemApi.healthDetail(),
    refetchInterval: REFETCH_INTERVAL_MS,
    staleTime: STALE_TIME_MS,
    retry: 1,
  })

  const status: HealthBadgeStatus = query.error
    ? 'offline'
    : (query.data?.status ?? 'offline')

  return {
    status,
    failedChecks: query.data?.failedChecks ?? [],
    data: query.data,
    isLoading: query.isLoading,
    isError: Boolean(query.error),
    refresh: () => {
      void query.refetch()
    },
  }
}
