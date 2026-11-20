import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { featuresApi } from '@/lib/api'
import { useProfileStore } from '@/stores/profileStore'
import type { FeatureFlags } from '@/types/contract'

function msg(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export function useFeaturesSettings() {
  const queryClient = useQueryClient()
  const activeProfileId = useProfileStore((s) => s.activeProfileId)

  const query = useQuery({
    queryKey: ['features', activeProfileId],
    queryFn: () => featuresApi.get(),
    enabled: !!activeProfileId,
    retry: false,
  })

  const saveMutation = useMutation({
    mutationFn: (flags: Partial<FeatureFlags>) => featuresApi.save(flags),
    onSuccess: (data) => {
      toast.success('Feature flags guardados')
      queryClient.setQueryData(['features', activeProfileId], data)
      void queryClient.invalidateQueries({ queryKey: ['features'] })
    },
    onError: (error) => toast.error(msg(error, 'No se pudieron guardar los flags')),
  })

  return {
    flags: (query.data ?? {}) as FeatureFlags,
    loading: query.isPending,
    error: query.error ? msg(query.error, 'No se pudieron cargar los feature flags') : null,
    refetch: () => void query.refetch(),
    save: (flags: Partial<FeatureFlags>) => saveMutation.mutateAsync(flags),
    saving: saveMutation.isPending,
  }
}
