import { useEffect, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { profileAdminApi } from '@/lib/api'
import { profileStore, useProfileStore } from '@/stores/profileStore'
import { useSocket } from '@/hooks/use-socket'

export function ProfileSessionProvider({ children }: { children: ReactNode }) {
  const query = useQuery({
    queryKey: ['profiles'],
    queryFn: () => profileAdminApi.list(),
    staleTime: Infinity,
    retry: 1,
  })

  const activeProfileId = useProfileStore((s) => s.activeProfileId)
  const { onProfileStatus } = useSocket(activeProfileId)

  useEffect(() => {
    const store = profileStore.getState()
    store.setLoading(query.isPending)
    store.setError(
      query.error
        ? query.error instanceof Error
          ? query.error.message
          : 'No se pudieron cargar los perfiles'
        : null
    )
  }, [query.isPending, query.error])

  useEffect(() => {
    if (!query.data) return
    const store = profileStore.getState()
    store.setProfiles(query.data.profiles ?? [])
    if (query.data.activeProfileId) {
      store.setActive(query.data.activeProfileId)
    }
    store.setHydrated(true)
  }, [query.data])

  useEffect(() => {
    return onProfileStatus((statuses) => {
      profileStore.getState().setStatuses(statuses ?? [])
    })
  }, [onProfileStatus])

  return <>{children}</>
}
