import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { errorsApi, featuresApi } from '@/lib/api'
import { normalizeEvidenceMetadata } from '@/lib/evidence'
import { ApiError, type EvidenceItem } from '@/types/contract'
import { useProfileStore } from '@/stores/profileStore'

function messageOf(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export function useFailureEvidence() {
  const activeProfileId = useProfileStore((s) => s.activeProfileId)
  const [selectedId, setSelectedId] = useState<string | null>(null)

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

  const data = imagesQuery.data ?? null

  const items = useMemo<EvidenceItem[]>(() => {
    if (!data) return []
    if (Array.isArray(data.items) && data.items.length >= 0) {
      return data.items.map(normalizeEvidenceMetadata)
    }
    // Compatibilidad con respuestas legacy
    if (Array.isArray(data.images)) {
      return data.images.map((img) => ({
        id: `folder:${img.name}`,
        name: img.name,
        displayName: img.name,
        kind: 'image' as const,
        source: 'folder' as const,
        mtime: img.mtime,
        timestamp: img.mtime ? new Date(img.mtime).toISOString() : null,
        size: img.size,
        url: errorsApi.fileUrl(img.name),
        downloadUrl: errorsApi.fileUrl(img.name),
      }))
    }
    return []
  }, [data])

  return {
    enabled,
    unavailable,
    loading: featuresQuery.isPending || (enabled && imagesQuery.isPending),
    error:
      imagesQuery.error && !unavailable
        ? messageOf(imagesQuery.error, 'No se pudieron cargar las evidencias')
        : null,
    data,
    items,
    selectedId,
    openItem: (id: string) => setSelectedId(id),
    closeItem: () => setSelectedId(null),
    refresh: () => void imagesQuery.refetch(),
  }
}

export type UseFailureEvidenceReturn = ReturnType<typeof useFailureEvidence>
