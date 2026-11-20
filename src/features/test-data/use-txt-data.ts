import { useQuery } from '@tanstack/react-query'
import { txtDataApi, featuresApi } from '@/lib/api'
import { ApiError } from '@/types/contract'
import { useProfileStore } from '@/stores/profileStore'

function messageOf(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export function useTxtData() {
  const activeProfileId = useProfileStore((s) => s.activeProfileId)

  const featuresQuery = useQuery({
    queryKey: ['features', activeProfileId],
    queryFn: () => featuresApi.get(),
    staleTime: 60_000,
    retry: false,
  })

  const enabled = featuresQuery.data?.txtData !== false

  const dataQuery = useQuery({
    queryKey: ['txtdata', activeProfileId],
    queryFn: () => txtDataApi.get(),
    enabled,
    retry: false,
  })

  const unavailable =
    !enabled ||
    (dataQuery.error instanceof ApiError &&
      (dataQuery.error.status === 403 || dataQuery.error.status === 404))

  return {
    enabled,
    unavailable,
    loading: featuresQuery.isPending || (enabled && dataQuery.isPending),
    error:
      dataQuery.error && !unavailable
        ? messageOf(dataQuery.error, 'No se pudieron cargar los datos TXT')
        : null,
    data: dataQuery.data ?? null,
    refresh: () => void dataQuery.refetch(),
  }
}
