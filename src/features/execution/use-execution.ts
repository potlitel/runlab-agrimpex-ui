import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { testsApi, reportsApi } from '@/lib/api'
import { useSocket } from '@/hooks/use-socket'
import { useProfileStore } from '@/stores/profileStore'
import type {
  ReportSummary,
  TestTree,
  TestRunRequest,
} from '@/types/contract'

export type ExecutionLogKind = 'info' | 'error' | 'success' | 'test' | 'output' | 'system'

export interface ExecutionLogEntry {
  id: string
  at: string
  kind: ExecutionLogKind
  text: string
}

export interface ExecutionTestResult {
  id: string
  status: string
  duration?: number
  output?: string
  errorMsg?: string
  attachments?: Array<Record<string, unknown>>
}

export interface RunOptions {
  testIds: string[]
  project?: string
  grep?: string
  workers?: number | string
  profileName?: string
  envFile?: string
  useDocker?: boolean
  params?: Record<string, string>
}

export interface ExecutionProgress {
  current: number
  total: number
  percentage: number
}

const MAX_LOG_LINES = 500

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message
  return 'Operación fallida'
}

function parseParams(text: string): Record<string, string> {
  const params: Record<string, string> = {}
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const separator = line.indexOf('=')
    if (separator <= 0) continue
    params[line.slice(0, separator).trim()] = line.slice(separator + 1).trim()
  }
  return params
}

export function useExecution() {
  const queryClient = useQueryClient()
  const activeProfileId = useProfileStore((s) => s.activeProfileId)

  const [selected, setSelected] = useState<string[]>([])
  const [logs, setLogs] = useState<ExecutionLogEntry[]>([])
  const [results, setResults] = useState<Record<string, ExecutionTestResult>>({})
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [progress, setProgress] = useState<ExecutionProgress>({
    current: 0,
    total: 0,
    percentage: 0,
  })
  const [eventRunning, setEventRunning] = useState(false)
  const logCounter = useRef(0)

  const cachedQuery = useQuery({
    queryKey: ['tests', activeProfileId, 'cached'],
    queryFn: () => testsApi.cached(),
    enabled: !!activeProfileId,
    retry: false,
  })

  const statusQuery = useQuery({
    queryKey: ['tests', activeProfileId, 'status'],
    queryFn: () => testsApi.status(),
    enabled: !!activeProfileId,
    refetchInterval: (query) => (query.state.data?.running ? 2000 : false),
  })

  const collectMutation = useMutation({
    mutationFn: () => testsApi.collect(),
    onSuccess: (data) => {
      queryClient.setQueryData(['tests', activeProfileId, 'cached'], data)
      setSelected((prev) =>
        prev.filter((id) => {
          const file = id.split('::')[0]
          return !!data.files[file]?.includes(id)
        })
      )
      setSummary(null)
      setResults({})
      setProgress({ current: 0, total: 0, percentage: 0 })
      toast.success(
        data.total > 0
          ? `Catálogo actualizado: ${data.total} tests`
          : 'El proyecto no contiene tests'
      )
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const runMutation = useMutation({
    mutationFn: ({
      testIds,
      project,
      grep,
      workers,
      profileName,
      envFile,
      useDocker,
      params,
    }: RunOptions) =>
      testsApi.run(testIds, project, grep, workers, {
        ...(profileName ? { profileName } : {}),
        ...(envFile ? { envFile } : {}),
        ...(useDocker ? { useDocker: true } : {}),
        ...(params && Object.keys(params).length ? { params } : {}),
      }),
    onSuccess: (response) => {
      setEventRunning(true)
      toast.success(response.message ?? 'Ejecución iniciada')
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const abortMutation = useMutation({
    mutationFn: () => testsApi.abort(),
    onSuccess: () => {
      toast.success('Solicitud de aborto enviada')
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const { onExecution, onTest, onProgress } = useSocket(activeProfileId)

  const applyReport = useCallback(async (reportId?: string, progressOverride?: ExecutionProgress) => {
    if (!reportId) return
    try {
      const report = await reportsApi.get(reportId)
      const next: Record<string, ExecutionTestResult> = {}
      for (const test of report.tests ?? []) {
        next[test.id] = {
          id: test.id,
          status: test.status,
          duration: test.duration,
          output: test.output,
          errorMsg: test.errorMsg,
          attachments: test.attachments,
        }
      }
      setResults(next)
      const values = Object.values(next)
      setSummary({
        ...report.summary,
        total: values.length,
        passed: values.filter((test) => test.status === 'passed').length,
        failed: values.filter((test) => test.status === 'failed').length,
        errors: values.filter((test) => test.status === 'error').length,
        skipped: values.filter((test) => test.status === 'skipped').length,
      })
      setProgress(
        progressOverride ?? {
          current: values.length,
          total: values.length,
          percentage: values.length ? 100 : 0,
        }
      )
    } catch {
      // El resumen recibido por socket sigue siendo válido aunque el reporte no esté disponible.
    }
  }, [])

  const appendLog = useCallback((kind: ExecutionLogKind, text: string) => {
    logCounter.current += 1
    const entry: ExecutionLogEntry = {
      id: String(logCounter.current),
      at: new Date().toISOString(),
      kind,
      text,
    }
    setLogs((prev) => [...prev, entry].slice(-MAX_LOG_LINES))
  }, [])

  useEffect(() => {
    if (!activeProfileId) return

    const unsubscribeExecution = onExecution({
      started: (event) => {
        setEventRunning(true)
        setSummary(null)
        setResults({})
        setProgress({ current: 0, total: event.total, percentage: 0 })
        appendLog('system', `Ejecución iniciada (${event.total} tests)`)
      },
      preparing: (event) => appendLog('info', event.message),
      prepareFailed: (event) => {
        setEventRunning(false)
        queryClient.setQueryData(['tests', activeProfileId, 'status'], { running: false })
        appendLog('error', event.error)
      },
      completed: (event) => {
        setEventRunning(false)
        setSummary(event.summary)
        setProgress({
          current: event.summary.total,
          total: event.summary.total,
          percentage: 100,
        })
        queryClient.setQueryData(['tests', activeProfileId, 'status'], { running: false })
        appendLog(
          'success',
          `Ejecución completada: ${event.summary.passed} pasados, ${event.summary.failed} fallidos`
        )
        void applyReport(event.reportId)
      },
      aborted: (event) => {
        setEventRunning(false)
        setSummary(event.summary)
        setProgress({
          current: event.completed,
          total: event.total,
          percentage: event.total
            ? Math.round((event.completed / event.total) * 100)
            : 0,
        })
        queryClient.setQueryData(['tests', activeProfileId, 'status'], { running: false })
        appendLog('error', `Ejecución abortada (${event.completed}/${event.total})`)
        void applyReport(event.reportId, {
          current: event.completed,
          total: event.total,
          percentage: event.total
            ? Math.round((event.completed / event.total) * 100)
            : 0,
        })
      },
    })

    const unsubscribeTest = onTest({
      started: (event) => {
        appendLog('test', `▶ ${event.id}`)
        setResults((prev) => ({
          ...prev,
          [event.id]: { ...prev[event.id], id: event.id, status: 'running' },
        }))
      },
      completed: (event) => {
        const suffix =
          event.duration !== undefined ? ` (${event.duration.toFixed(2)}s)` : ''
        appendLog(
          event.status === 'passed'
            ? 'success'
            : event.status === 'failed'
              ? 'error'
              : 'info',
          `${event.id} · ${event.status}${suffix}`
        )
        setResults((prev) => ({
          ...prev,
          [event.id]: { ...prev[event.id], ...event },
        }))
      },
      output: (event) => appendLog('output', `${event.id}: ${event.line}`),
    })

    const unsubscribeProgress = onProgress((event) => setProgress(event))

    return () => {
      unsubscribeExecution()
      unsubscribeTest()
      unsubscribeProgress()
    }
  }, [activeProfileId, onExecution, onTest, onProgress, appendLog, applyReport, queryClient])

  const tree = cachedQuery.data
  const selectedTests = useMemo(
    () =>
      selected
        .map((id) => {
          const file = id.split('::')[0]
          return { id, file, title: id.split('::').slice(1).join(' :: ') }
        })
        .filter((entry) => !!tree?.files[entry.file]?.includes(entry.id)),
    [selected, tree]
  )

  return {
    profileId: activeProfileId,
    tree,
    loading: cachedQuery.isPending || collectMutation.isPending,
    error: cachedQuery.error ? errorMessage(cachedQuery.error) : null,
    running: eventRunning || !!statusQuery.data?.running,
    collecting: collectMutation.isPending,
    runPending: runMutation.isPending,
    abortPending: abortMutation.isPending,
    selected,
    selectedTests,
    logs,
    results,
    summary,
    progress,
    refresh: () => void collectMutation.mutateAsync().catch(() => undefined),
    toggleTest: (id: string) =>
      setSelected((prev) =>
        prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
      ),
    toggleFile: (ids: string[], checked: boolean) =>
      setSelected((prev) =>
        checked
          ? [...new Set([...prev, ...ids])]
          : prev.filter((value) => !ids.includes(value))
      ),
    clearSelection: () => setSelected([]),
    run: (options: RunOptions) => {
      if (!options.testIds.length) {
        toast.error('Selecciona al menos un test')
        return
      }
      void runMutation.mutateAsync(options).catch(() => undefined)
    },
    abort: () => void abortMutation.mutateAsync().catch(() => undefined),
    parseParams,
    reset: () => {
      setSelected([])
      setLogs([])
      setResults({})
      setSummary(null)
      setProgress({ current: 0, total: 0, percentage: 0 })
    },
  }
}

export type UseExecutionReturn = ReturnType<typeof useExecution>
export type { TestTree, TestRunRequest }
