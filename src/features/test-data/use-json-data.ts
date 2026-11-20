import { useCallback, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { featuresApi, jsonDataApi } from '@/lib/api'
import { ApiError } from '@/types/contract'
import { useProfileStore } from '@/stores/profileStore'

function messageOf(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

function isUnavailable(error: unknown) {
  return error instanceof ApiError && (error.status === 403 || error.status === 404)
}

export type JsonSelection = { folder: string; file: string } | null

export function useJsonData() {
  const queryClient = useQueryClient()
  const activeProfileId = useProfileStore((s) => s.activeProfileId)
  const [selection, setSelection] = useState<JsonSelection>(null)

  const featuresQuery = useQuery({
    queryKey: ['features', activeProfileId],
    queryFn: () => featuresApi.get(),
    staleTime: 60_000,
    retry: false,
  })

  const enabled = featuresQuery.data?.jsonData !== false

  const treeQuery = useQuery({
    queryKey: ['jsondata', activeProfileId, 'tree'],
    queryFn: () => jsonDataApi.tree(),
    enabled,
    retry: false,
  })

  const fileQuery = useQuery({
    queryKey: ['jsondata', activeProfileId, 'file', selection?.folder ?? '', selection?.file ?? ''],
    queryFn: () => jsonDataApi.getFile(selection!.folder, selection!.file),
    enabled: enabled && !!selection,
    retry: false,
  })

  const snapshotsQuery = useQuery({
    queryKey: ['jsondata', activeProfileId, 'snapshots', selection?.folder ?? '', selection?.file ?? ''],
    queryFn: () => jsonDataApi.listSnapshots(selection!.folder, selection!.file),
    enabled: enabled && !!selection,
    retry: false,
  })

  const saveFileMutation = useMutation({
    mutationFn: ({ folder, file, data }: { folder: string; file: string; data: unknown }) =>
      jsonDataApi.saveFile(folder, file, data),
    onSuccess: () => {
      toast.success('Archivo JSON guardado')
      void fileQuery.refetch()
    },
    onError: (error) => toast.error(messageOf(error, 'No se pudo guardar el archivo')),
  })

  const saveSnapshotMutation = useMutation({
    mutationFn: ({ folder, file, name, data }: { folder: string; file: string; name: string; data: unknown }) =>
      jsonDataApi.saveSnapshot(folder, file, name, data),
    onSuccess: () => {
      toast.success('Snapshot guardado')
      void queryClient.invalidateQueries({ queryKey: ['jsondata', activeProfileId, 'snapshots'] })
    },
    onError: (error) => toast.error(messageOf(error, 'No se pudo guardar el snapshot')),
  })

  const deleteSnapshotMutation = useMutation({
    mutationFn: ({ folder, file, name }: { folder: string; file: string; name: string }) =>
      jsonDataApi.deleteSnapshot(folder, file, name),
    onSuccess: () => {
      toast.success('Snapshot eliminado')
      void queryClient.invalidateQueries({ queryKey: ['jsondata', activeProfileId, 'snapshots'] })
    },
    onError: (error) => toast.error(messageOf(error, 'No se pudo eliminar el snapshot')),
  })

  const select = useCallback((folder: string, file: string) => {
    setSelection({ folder, file })
  }, [])

  const unavailable =
    !enabled || isUnavailable(treeQuery.error)

  return {
    enabled,
    unavailable,
    tree: treeQuery.data ?? null,
    treeLoading: featuresQuery.isPending || treeQuery.isPending,
    treeError:
      treeQuery.error && !isUnavailable(treeQuery.error)
        ? messageOf(treeQuery.error, 'No se pudo cargar el árbol JSON')
        : null,

    selection,
    select,
    clearSelection: () => setSelection(null),

    fileData: fileQuery.data ?? null,
    fileLoading: fileQuery.isPending && !!selection,
    fileError:
      fileQuery.error && !isUnavailable(fileQuery.error)
        ? messageOf(fileQuery.error, 'No se pudo cargar el archivo JSON')
        : null,
    refetchFile: () => void fileQuery.refetch(),

    snapshots: (snapshotsQuery.data ?? {}) as Record<string, unknown>,
    snapshotsLoading: snapshotsQuery.isPending && !!selection,
    snapshotsError:
      snapshotsQuery.error && !isUnavailable(snapshotsQuery.error)
        ? messageOf(snapshotsQuery.error, 'No se pudieron cargar los snapshots')
        : null,

    saveFile: (folder: string, file: string, data: unknown) =>
      saveFileMutation.mutateAsync({ folder, file, data }),
    savingFile: saveFileMutation.isPending,

    saveSnapshot: (folder: string, file: string, name: string, data: unknown) =>
      saveSnapshotMutation.mutateAsync({ folder, file, name, data }),
    savingSnapshot: saveSnapshotMutation.isPending,

    deleteSnapshot: (folder: string, file: string, name: string) =>
      deleteSnapshotMutation.mutate({ folder, file, name }),
    deletingSnapshot: deleteSnapshotMutation.isPending,

    refreshTree: () => void treeQuery.refetch(),
  }
}
