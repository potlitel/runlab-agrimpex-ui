import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { errorsApi, featuresApi } from '@/lib/api'
import { ApiError } from '@/types/contract'
import { useProfileStore } from '@/stores/profileStore'

function messageOf(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export function useFailureEvidence() {
  const activeProfileId = useProfileStore((s) => s.activeProfileId)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const featuresQuery = useQuery({
    queryKey: ['features', activeProfileId],
    queryFn: () => featuresApi.get(),
    staleTime: 60_000,
    retry: false,
  })

  const enabled = featuresQuery.data?.errorImages !== false

  const imagesQuery = useQuery({
    queryKey: ['errors', activeProfileId, 'images'],
    queryFn: () => errorsApi.images(),
    enabled,
    retry: false,
  })

  const unavailable =
    !enabled ||
    (imagesQuery.error instanceof ApiError &&
      (imagesQuery.error.status === 403 || imagesQuery.error.status === 404))

  return {
    enabled,
    unavailable,
    loading: featuresQuery.isPending || (enabled && imagesQuery.isPending),
    error:
      imagesQuery.error && !unavailable
        ? messageOf(imagesQuery.error, 'No se pudieron cargar las evidencias')
        : null,
    data: imagesQuery.data ?? null,
    selectedImage,
    openImage: (name: string) => setSelectedImage(name),
    closeImage: () => setSelectedImage(null),
    refresh: () => void imagesQuery.refetch(),
  }
}

export type UseFailureEvidenceReturn = ReturnType<typeof useFailureEvidence>
