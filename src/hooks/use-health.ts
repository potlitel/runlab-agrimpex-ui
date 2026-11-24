import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { systemApi } from '@/lib/api'
import type {
  HealthBadgeStatus,
  HealthDetail,
  HealthHistoryPoint,
} from '@/types/contract'

const REFETCH_INTERVAL_MS = 30_000
const STALE_TIME_MS = 10_000
const HISTORY_LIMIT = 20

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

  const [history, setHistory] = useState<HealthHistoryPoint[]>([])
  const lastRecordedAt = useRef(0)

  // El historial se deriva de las respuestas ya recibidas; no es un endpoint
  // nuevo ni un sondeo adicional. Cada actualización aporta un único punto.
  useEffect(() => {
    const data = query.data
    const at = query.dataUpdatedAt
    if (!data || !at || lastRecordedAt.current === at) return
    lastRecordedAt.current = at

    const checks = [...data.checks.critical, ...data.checks.informational]
    const ok = checks.filter((check) => check.status === 'ok').length
    const point: HealthHistoryPoint = {
      at,
      uptimeSeconds: data.uptimeSeconds,
      okPercentage: checks.length ? Math.round((ok / checks.length) * 100) : 0,
    }
    setHistory((previous) => [...previous, point].slice(-HISTORY_LIMIT))
  }, [query.data, query.dataUpdatedAt])

  const status: HealthBadgeStatus = query.error
    ? 'offline'
    : (query.data?.status ?? 'offline')

  const checks = query.data
    ? [...query.data.checks.critical, ...query.data.checks.informational]
    : []
  const okChecks = checks.filter((check) => check.status === 'ok').length
  const healthPercentage = checks.length
    ? Math.round((okChecks / checks.length) * 100)
    : 0

  return {
    status,
    failedChecks: query.data?.failedChecks ?? [],
    data: query.data,
    isLoading: query.isLoading,
    isError: Boolean(query.error),
    isFetching: query.isFetching,
    dataUpdatedAt: query.dataUpdatedAt,
    history,
    healthPercentage,
    refresh: () => {
      void query.refetch()
    },
  }
}
