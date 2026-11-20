import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { envApi, featuresApi, profilesApi } from '@/lib/api'
import { ApiError, type EnvVar } from '@/types/contract'
import { useProfileStore } from '@/stores/profileStore'

function messageOf(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

function isUnavailable(error: unknown) {
  return error instanceof ApiError && (error.status === 403 || error.status === 404)
}

export function useEnvironment() {
  const queryClient = useQueryClient()
  const activeProfileId = useProfileStore((s) => s.activeProfileId)
  const [selectedFileState, setSelectedFileState] = useState<string>('')
  const [selectedEnvNameState, setSelectedEnvNameState] = useState<string>('')

  const featuresQuery = useQuery({
    queryKey: ['features', activeProfileId],
    queryFn: () => featuresApi.get(),
    staleTime: 60_000,
    retry: false,
  })

  const enabled = featuresQuery.data?.variables !== false

  const filesQuery = useQuery({
    queryKey: ['env', activeProfileId, 'files'],
    queryFn: () => envApi.files(),
    enabled,
    retry: false,
  })

  const files = filesQuery.data?.files ?? []
  const selectedFile =
    selectedFileState && files.includes(selectedFileState)
      ? selectedFileState
      : (files[0] ?? '')

  const envQuery = useQuery({
    queryKey: ['env', activeProfileId, 'file', selectedFile],
    queryFn: () => envApi.get(selectedFile || undefined),
    enabled: enabled && filesQuery.isSuccess && !!selectedFile,
    retry: false,
  })

  const savedQuery = useQuery({
    queryKey: ['env', activeProfileId, 'saved'],
    queryFn: () => profilesApi.list(),
    enabled,
    retry: false,
  })

  const savedEntornos = savedQuery.data ?? {}
  const savedNames = Object.keys(savedEntornos)
  const selectedEnvName =
    selectedEnvNameState && savedNames.includes(selectedEnvNameState)
      ? selectedEnvNameState
      : (savedNames[0] ?? '')

  const saveEnvMutation = useMutation({
    mutationFn: ({ vars, file }: { vars: EnvVar[]; file?: string }) =>
      envApi.save(vars, file || undefined),
    onSuccess: () => {
      toast.success('Variables guardadas')
      void queryClient.invalidateQueries({ queryKey: ['env', activeProfileId, 'file'] })
    },
    onError: (error) => toast.error(messageOf(error, 'No se pudieron guardar las variables')),
  })

  const saveEntornoMutation = useMutation({
    mutationFn: ({ name, vars }: { name: string; vars: EnvVar[] }) =>
      profilesApi.create(name, vars),
    onSuccess: (_d, variables) => {
      toast.success(`Entorno "${variables.name}" guardado`)
      void queryClient.invalidateQueries({ queryKey: ['env', activeProfileId, 'saved'] })
      setSelectedEnvNameState(variables.name)
    },
    onError: (error) => toast.error(messageOf(error, 'No se pudo guardar el entorno')),
  })

  const renameEntornoMutation = useMutation({
    mutationFn: ({ name, newName }: { name: string; newName: string }) =>
      profilesApi.rename(name, newName),
    onSuccess: (_d, variables) => {
      toast.success('Entorno renombrado')
      void queryClient.invalidateQueries({ queryKey: ['env', activeProfileId, 'saved'] })
      setSelectedEnvNameState(variables.newName)
    },
    onError: (error) => toast.error(messageOf(error, 'No se pudo renombrar el entorno')),
  })

  const deleteEntornoMutation = useMutation({
    mutationFn: (name: string) => profilesApi.delete(name),
    onSuccess: (_d, name) => {
      toast.success('Entorno eliminado')
      void queryClient.invalidateQueries({ queryKey: ['env', activeProfileId, 'saved'] })
      setSelectedEnvNameState((current) => (current === name ? '' : current))
    },
    onError: (error) => toast.error(messageOf(error, 'No se pudo eliminar el entorno')),
  })

  const unavailable =
    !enabled ||
    (isUnavailable(filesQuery.error) && isUnavailable(savedQuery.error))

  return {
    enabled,
    unavailable,
    files,
    filesLoading: featuresQuery.isPending || filesQuery.isPending,
    filesError:
      filesQuery.error && !isUnavailable(filesQuery.error)
        ? messageOf(filesQuery.error, 'No se pudieron cargar los archivos .env')
        : null,

    selectedFile,
    selectFile: setSelectedFileState,
    envData: envQuery.data ?? null,
    envLoading: envQuery.isPending && envQuery.fetchStatus !== 'idle',
    envError:
      envQuery.error && !isUnavailable(envQuery.error)
        ? messageOf(envQuery.error, 'No se pudo cargar el archivo .env')
        : null,
    saveEnv: (vars: EnvVar[], file?: string) => saveEnvMutation.mutate({ vars, file }),
    savingEnv: saveEnvMutation.isPending,

    savedEntornos,
    savedLoading: savedQuery.isPending,
    savedError:
      savedQuery.error && !isUnavailable(savedQuery.error)
        ? messageOf(savedQuery.error, 'No se pudieron cargar los entornos guardados')
        : null,
    selectedEnvName,
    selectEnvName: setSelectedEnvNameState,
    saveEntorno: (name: string, vars: EnvVar[]) => saveEntornoMutation.mutate({ name, vars }),
    savingEntorno: saveEntornoMutation.isPending,
    renameEntorno: (name: string, newName: string) =>
      renameEntornoMutation.mutate({ name, newName }),
    renamingEntorno: renameEntornoMutation.isPending,
    deleteEntorno: (name: string) => deleteEntornoMutation.mutate(name),
    deletingEntorno: deleteEntornoMutation.isPending ? deleteEntornoMutation.variables : null,

    refresh: () => {
      void queryClient.invalidateQueries({ queryKey: ['env', activeProfileId] })
      void featuresQuery.refetch()
    },
  }
}

export type UseEnvironmentReturn = ReturnType<typeof useEnvironment>
