import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { automationApi } from '@/lib/api'
import { ApiError, type AutomationConfig } from '@/types/contract'
import { useSocket } from '@/hooks/use-socket'
import { useProfileStore } from '@/stores/profileStore'

export interface AutomationLogEntry {
  id: number
  at: number
  message: string
  type?: string
  source: 'automation' | 'env'
}

function msg(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message || fallback
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export function useAutomationSettings() {
  const queryClient = useQueryClient()
  const activeProfileId = useProfileStore((s) => s.activeProfileId)
  const { onAutomation, onEnv } = useSocket(activeProfileId)

  const [logs, setLogs] = useState<AutomationLogEntry[]>([])
  const logSeq = useRef(0)
  const [installProgress, setInstallProgress] = useState<{ percent: number; label: string } | null>(null)
  const [updateProgress, setUpdateProgress] = useState<{ percent: number; label: string } | null>(null)
  const [envProgress, setEnvProgress] = useState<{ percent?: number; label?: string } | null>(null)

  const appendLog = useCallback((message: string, type: string | undefined, source: 'automation' | 'env') => {
    logSeq.current += 1
    setLogs((prev) => [...prev, { id: logSeq.current, at: Date.now(), message, type, source }].slice(-400))
  }, [])

  const configQuery = useQuery({
    queryKey: ['automation', activeProfileId, 'config'],
    queryFn: () => automationApi.getConfig(),
    enabled: !!activeProfileId,
    retry: false,
  })

  const statusQuery = useQuery({
    queryKey: ['automation', activeProfileId, 'status'],
    queryFn: () => automationApi.status(),
    enabled: !!activeProfileId,
    retry: false,
    refetchInterval: 5000,
  })

  const [checkRequestedAt, setCheckRequestedAt] = useState<number | null>(null)
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null)

  const checkQuery = useQuery({
    queryKey: ['automation', activeProfileId, 'check'],
    queryFn: async () => {
      const result = await automationApi.check()
      setLastCheckedAt(Date.now())
      return result
    },
    enabled: false,
    retry: false,
  })
  const { refetch: refetchCheck } = checkQuery

  const runCheck = useCallback(() => {
    if (!activeProfileId) return
    setCheckRequestedAt(Date.now())
    void refetchCheck()
  }, [activeProfileId, refetchCheck])

  const installPath = configQuery.data?.installPath ?? ''

  const installStatusQuery = useQuery({
    queryKey: ['automation', activeProfileId, 'install-status', installPath],
    queryFn: () => automationApi.installStatus(installPath),
    enabled: !!activeProfileId && !!installPath,
    retry: false,
  })

  const branchesQuery = useQuery({
    queryKey: ['automation', activeProfileId, 'branches', installPath],
    queryFn: () => automationApi.branches(installPath),
    enabled: false,
    retry: false,
  })

  const refreshAll = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['automation', activeProfileId] })
  }, [queryClient, activeProfileId])

  useEffect(() => {
    if (!activeProfileId) return
    return onAutomation({
      progress: (e) => {
        setInstallProgress({ percent: e.percent, label: e.label })
      },
      updateProgress: (e) => {
        setUpdateProgress({ percent: e.percent, label: e.label })
      },
      log: (e) => {
        appendLog(e.message, e.type, 'automation')
      },
      done: () => {
        setInstallProgress({ percent: 100, label: 'Instalación completada' })
        appendLog('Instalación completada', 'success', 'automation')
        toast.success('Instalación completada')
        refreshAll()
      },
      failed: (e) => {
        setInstallProgress(null)
        appendLog(e.error, 'error', 'automation')
        toast.error(e.error || 'La operación de automatización falló')
        refreshAll()
      },
      updateDone: () => {
        setUpdateProgress({ percent: 100, label: 'Actualización completada' })
        appendLog('Actualización completada', 'success', 'automation')
        toast.success('Actualización completada')
        refreshAll()
      },
      updateFailed: (e) => {
        setUpdateProgress(null)
        appendLog(e.error, 'error', 'automation')
        toast.error(e.error || 'La actualización falló')
        refreshAll()
      },
    })
  }, [activeProfileId, onAutomation, appendLog, refreshAll])

  useEffect(() => {
    if (!activeProfileId) return
    return onEnv({
      progress: (e) => setEnvProgress({ percent: e.percent, label: e.label }),
      log: (e) => appendLog(e.message, e.type, 'env'),
      venvDone: () => {
        setEnvProgress(null)
        appendLog('Entorno virtual listo', 'success', 'env')
        toast.success('Entorno virtual preparado')
        refreshAll()
      },
      depsDone: (e) => {
        setEnvProgress(null)
        appendLog(e.skipped ? 'Instalación de dependencias omitida' : 'Dependencias instaladas', 'success', 'env')
        toast.success(e.skipped ? 'Dependencias omitidas' : 'Dependencias instaladas')
        refreshAll()
      },
      failed: (e) => {
        setEnvProgress(null)
        appendLog(e.error, 'error', 'env')
        toast.error(e.error || 'La operación de entorno falló')
        refreshAll()
      },
    })
  }, [activeProfileId, onEnv, appendLog, refreshAll])

  const saveConfigMutation = useMutation({
    mutationFn: (payload: Partial<AutomationConfig>) => automationApi.saveConfig(payload),
    onSuccess: () => {
      toast.success('Configuración de automatización guardada')
      void queryClient.invalidateQueries({ queryKey: ['automation', activeProfileId, 'config'] })
      void queryClient.invalidateQueries({ queryKey: ['automation', activeProfileId, 'install-status'] })
      void queryClient.invalidateQueries({ queryKey: ['automation', activeProfileId, 'branches'] })
    },
    onError: (error) => toast.error(msg(error, 'No se pudo guardar la configuración de automatización')),
  })

  function handleActionError(error: unknown, fallback: string) {
    if (error instanceof ApiError && error.status === 409) {
      toast.error(error.message || 'Hay una operación en curso')
    } else {
      toast.error(msg(error, fallback))
    }
  }

  const installMutation = useMutation({
    mutationFn: (payload: { repoUrl: string; installPath: string }) => automationApi.install(payload),
    onSuccess: () => {
      toast.message('Instalación iniciada')
      setInstallProgress({ percent: 0, label: 'Iniciando…' })
      refreshAll()
    },
    onError: (error) => handleActionError(error, 'No se pudo iniciar la instalación'),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: { installPath: string; branch?: string }) => automationApi.update(payload),
    onSuccess: () => {
      toast.message('Actualización iniciada')
      setUpdateProgress({ percent: 0, label: 'Iniciando…' })
      refreshAll()
    },
    onError: (error) => handleActionError(error, 'No se pudo iniciar la actualización'),
  })

  const setupVenvMutation = useMutation({
    mutationFn: (projectPath?: string) => automationApi.setupVenv(projectPath),
    onSuccess: () => {
      toast.message('Preparación de venv iniciada')
      setEnvProgress({ label: 'Preparando entorno…' })
      refreshAll()
    },
    onError: (error) => handleActionError(error, 'No se pudo iniciar la preparación del venv'),
  })

  const setupDepsMutation = useMutation({
    mutationFn: (projectPath?: string) => automationApi.setupDeps(projectPath),
    onSuccess: () => {
      toast.message('Instalación de dependencias iniciada')
      setEnvProgress({ label: 'Instalando dependencias…' })
      refreshAll()
    },
    onError: (error) => handleActionError(error, 'No se pudo iniciar la instalación de dependencias'),
  })

  const applyMutation = useMutation({
    mutationFn: (payload: { projectPath?: string; pytestCmd?: string; playwrightCmd?: string }) =>
      automationApi.apply(payload),
    onSuccess: (res) => {
      toast.success('Configuración aplicada al proyecto')
      void queryClient.invalidateQueries({ queryKey: ['config', activeProfileId] })
      if (res.projectChanged) {
        toast.message('El proyecto cambió; se actualizaron datos asociados.')
        void queryClient.invalidateQueries({ queryKey: ['tests'] })
        void queryClient.invalidateQueries({ queryKey: ['reports'] })
        void queryClient.invalidateQueries({ queryKey: ['txtdata'] })
        void queryClient.invalidateQueries({ queryKey: ['jsondata'] })
      }
    },
    onError: (error) => toast.error(msg(error, 'No se pudo aplicar la configuración')),
  })

  const status = statusQuery.data

  return {
    config: configQuery.data ?? { repoUrl: '', installPath: '' },
    configLoading: configQuery.isPending,
    configError: configQuery.error ? msg(configQuery.error, 'No se pudo cargar la configuración de automatización') : null,
    saveConfig: (payload: Partial<AutomationConfig>) => saveConfigMutation.mutateAsync(payload),
    savingConfig: saveConfigMutation.isPending,

    status: status ?? null,
    statusLoading: statusQuery.isPending,
    refreshStatus: () => void statusQuery.refetch(),

    check: checkQuery.data ?? null,
    checkLoading: checkQuery.isFetching,
    checkError: checkQuery.error ? msg(checkQuery.error, 'No se pudo ejecutar el chequeo') : null,
    checkRequestedAt,
    lastCheckedAt,
    runCheck,

    installStatus: installStatusQuery.data ?? null,
    installStatusLoading: installStatusQuery.isPending,
    refreshInstallStatus: () => void installStatusQuery.refetch(),

    branches: branchesQuery.data?.branches ?? [],
    branchesLoading: branchesQuery.isFetching,
    branchesError: branchesQuery.error ? msg(branchesQuery.error, 'No se pudieron cargar las ramas') : null,
    fetchBranches: () => branchesQuery.refetch(),

    install: (payload: { repoUrl: string; installPath: string }) => installMutation.mutate(payload),
    installing: installMutation.isPending || !!status?.installing,

    update: (payload: { installPath: string; branch?: string }) => updateMutation.mutate(payload),
    updating: updateMutation.isPending || !!status?.pulling,

    setupVenv: (projectPath?: string) => setupVenvMutation.mutate(projectPath),
    setupDeps: (projectPath?: string) => setupDepsMutation.mutate(projectPath),
    envBusy: !!status?.envBusy || setupVenvMutation.isPending || setupDepsMutation.isPending,

    apply: (payload: { projectPath?: string; pytestCmd?: string; playwrightCmd?: string }) =>
      applyMutation.mutateAsync(payload),
    applying: applyMutation.isPending,

    installProgress,
    updateProgress,
    envProgress,
    logs,
    clearLogs: () => setLogs([]),
  }
}
