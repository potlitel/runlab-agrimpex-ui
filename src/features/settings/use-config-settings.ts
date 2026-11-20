import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { configApi } from '@/lib/api'
import { useProfileStore } from '@/stores/profileStore'
import type { Config, ConfigValidateRequest } from '@/types/contract'

function msg(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

const EMPTY: Config = {
  projectPath: '',
  envPath: '',
  playwrightCmd: '',
  pytestCmd: 'pytest',
  txtFolderPath: '',
  seleniumRemoteUrl: '',
  errorImagesPath: '',
  jsonDataPath: '',
}

export function useConfigSettings() {
  const queryClient = useQueryClient()
  const activeProfileId = useProfileStore((s) => s.activeProfileId)

  const configQuery = useQuery({
    queryKey: ['config', activeProfileId],
    queryFn: () => configApi.get(),
    enabled: !!activeProfileId,
    retry: false,
  })

  const [validating, setValidating] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [browsing, setBrowsing] = useState<string | null>(null)
  const [validation, setValidation] = useState<{ valid: boolean; reason?: string } | null>(null)

  const saveMutation = useMutation({
    mutationFn: (payload: Config) => configApi.save(payload),
    onSuccess: (res) => {
      toast.success('Configuración guardada')
      setValidation(null)
      queryClient.setQueryData(['config', activeProfileId], res.config)
      if (res.projectChanged) {
        toast.message('El proyecto cambió; se actualizaron datos asociados.')
        void queryClient.invalidateQueries({ queryKey: ['tests'] })
        void queryClient.invalidateQueries({ queryKey: ['reports'] })
        void queryClient.invalidateQueries({ queryKey: ['txtdata'] })
        void queryClient.invalidateQueries({ queryKey: ['jsondata'] })
        void queryClient.invalidateQueries({ queryKey: ['errors'] })
      }
      void queryClient.invalidateQueries({ queryKey: ['env'] })
      void queryClient.invalidateQueries({ queryKey: ['docker'] })
    },
    onError: (error) => toast.error(msg(error, 'No se pudo guardar la configuración')),
  })

  async function validate(payload: ConfigValidateRequest) {
    setValidating(true)
    try {
      const res = await configApi.validate(payload)
      setValidation(res)
      if (res.valid) toast.success('Configuración válida')
      else toast.error(res.reason || 'Configuración inválida')
      return res
    } catch (error) {
      toast.error(msg(error, 'No se pudo validar'))
      return null
    } finally {
      setValidating(false)
    }
  }

  async function detectEnv(projectPath?: string) {
    setDetecting(true)
    try {
      const res = await configApi.detectEnv(projectPath)
      if (res.path) toast.success(`Archivo detectado: ${res.path}`)
      else toast.message('No se detectó un archivo .env en el proyecto')
      return res.path
    } catch (error) {
      toast.error(msg(error, 'No se pudo detectar el archivo .env'))
      return null
    } finally {
      setDetecting(false)
    }
  }

  async function browse(type: 'folder' | 'file', startPath?: string) {
    setBrowsing(type)
    try {
      const res = await configApi.browse(type, startPath)
      if (res.cancelled || !res.path) return null
      return res.path
    } catch (error) {
      toast.error(msg(error, 'No se pudo abrir el explorador'))
      return null
    } finally {
      setBrowsing(null)
    }
  }

  return {
    config: { ...EMPTY, ...(configQuery.data ?? {}) } as Config,
    loading: configQuery.isPending,
    error: configQuery.error ? msg(configQuery.error, 'No se pudo cargar la configuración') : null,
    refetch: () => void configQuery.refetch(),

    save: (payload: Config) => saveMutation.mutateAsync(payload),
    saving: saveMutation.isPending,

    validate,
    validating,
    validation,
    clearValidation: () => setValidation(null),

    detectEnv,
    detecting,
    browse,
    browsing,
  }
}

export type UseConfigSettingsReturn = ReturnType<typeof useConfigSettings>
