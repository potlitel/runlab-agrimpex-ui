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
import {
  EMPTY_SNAPSHOT,
  deriveSummaryFromResults,
  eventTimestamp,
  mergeExecutionSummary,
  reduceRunState,
  type ExecutionLogEntry,
  type ExecutionLogKind,
  type ExecutionProgress,
  type ExecutionTestResult,
  type RunOptions,
} from './execution-state'
import { useExecutionStore } from './execution-store'

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
  const [eventRunning, setEventRunning] = useState(false)
  const logCounter = useRef(0)

  const snapshot =
    useExecutionStore((s) =>
      activeProfileId ? s.byProfile[activeProfileId] : undefined
    ) ?? EMPTY_SNAPSHOT
  const { logs, results, progress, summaryView, run } = snapshot
  const update = useCallback(
    (updater: (current: typeof snapshot) => typeof snapshot) => {
      if (activeProfileId) useExecutionStore.getState().update(activeProfileId, updater)
    },
    [activeProfileId]
  )

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
      update((prev) => ({
        ...prev,
        logs: [],
        results: {},
        summaryView: null,
        progress: { current: 0, total: 0, percentage: 0 },
        run: reduceRunState(prev.run, { type: 'reset' }),
      }))
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

  const applyReport = useCallback(
    async (
      reportId: string,
      eventSummary: ReportSummary,
      progressOverride?: ExecutionProgress
    ) => {
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
        const completed = Object.keys(next).length
        update((prev) => ({
          ...prev,
          results: next,
          summaryView: mergeExecutionSummary(
            eventSummary,
            report.summary,
            { derived: deriveSummaryFromResults(next) }
          ),
          progress:
            progressOverride ?? {
              current: completed,
              total: completed,
              percentage: completed ? 100 : 0,
            },
          run: reduceRunState(prev.run, {
            type: 'reportResolved',
            timestamp: eventTimestamp(report),
          }),
        }))
      } catch {
        // El resumen recibido por socket sigue siendo válido aunque el reporte no esté disponible.
        update((prev) => ({
          ...prev,
          summaryView: mergeExecutionSummary(eventSummary, null, {
            derived: deriveSummaryFromResults(prev.results),
            detailFailed: true,
          }),
          run: reduceRunState(prev.run, { type: 'reportFailed' }),
        }))
      }
    },
    [update]
  )

  const appendLog = useCallback(
    (kind: ExecutionLogKind, text: string) => {
      logCounter.current += 1
      const entry: ExecutionLogEntry = {
        id: String(logCounter.current),
        at: new Date().toISOString(),
        kind,
        text,
      }
      update((prev) => ({ ...prev, logs: [...prev.logs, entry].slice(-MAX_LOG_LINES) }))
    },
    [update]
  )

  useEffect(() => {
    if (!activeProfileId) return

    const unsubscribeExecution = onExecution({
      started: (event) => {
        setEventRunning(true)
        update((prev) => ({
          ...prev,
          results: {},
          summaryView: null,
          progress: { current: 0, total: event.total, percentage: 0 },
          run: reduceRunState(prev.run, { type: 'started' }),
        }))
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
        const progress: ExecutionProgress = {
          current: event.summary.total,
          total: event.summary.total,
          percentage: 100,
        }
        update((prev) => ({
          ...prev,
          summaryView: mergeExecutionSummary(event.summary, null, {
            derived: deriveSummaryFromResults(prev.results),
          }),
          progress,
          run: reduceRunState(prev.run, {
            type: 'completed',
            reportId: event.reportId,
            timestamp: eventTimestamp(event),
          }),
        }))
        queryClient.setQueryData(['tests', activeProfileId, 'status'], { running: false })
        appendLog(
          'success',
          `Ejecución completada: ${event.summary.passed} pasados, ${event.summary.failed} fallidos`
        )
        void applyReport(event.reportId, event.summary)
      },
      aborted: (event) => {
        setEventRunning(false)
        const progress: ExecutionProgress = {
          current: event.completed,
          total: event.total,
          percentage: event.total
            ? Math.round((event.completed / event.total) * 100)
            : 0,
        }
        update((prev) => ({
          ...prev,
          summaryView: mergeExecutionSummary(event.summary, null, {
            derived: deriveSummaryFromResults(prev.results),
          }),
          progress,
          run: reduceRunState(prev.run, {
            type: 'aborted',
            reportId: event.reportId,
            timestamp: eventTimestamp(event),
          }),
        }))
        queryClient.setQueryData(['tests', activeProfileId, 'status'], { running: false })
        appendLog('error', `Ejecución abortada (${event.completed}/${event.total})`)
        void applyReport(event.reportId, event.summary, progress)
      },
    })

    const unsubscribeTest = onTest({
      started: (event) => {
        appendLog('test', `▶ ${event.id}`)
        update((prev) => ({
          ...prev,
          results: {
            ...prev.results,
            [event.id]: { ...prev.results[event.id], id: event.id, status: 'running' },
          },
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
        update((prev) => ({
          ...prev,
          results: {
            ...prev.results,
            [event.id]: { ...prev.results[event.id], ...event },
          },
        }))
      },
      output: (event) => appendLog('output', `${event.id}: ${event.line}`),
    })

    const unsubscribeProgress = onProgress((event) =>
      update((prev) => ({ ...prev, progress: event }))
    )

    return () => {
      unsubscribeExecution()
      unsubscribeTest()
      unsubscribeProgress()
    }
  }, [activeProfileId, onExecution, onTest, onProgress, appendLog, applyReport, queryClient, update])

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
    summary: summaryView?.summary ?? null,
    summaryPartial: summaryView?.partial ?? false,
    passRate: summaryView?.passRate ?? 0,
    reportId: run.reportId,
    reportTimestamp: run.reportTimestamp,
    lastRunStatus: run.lastRunStatus,
    lastRunOptions: run.lastRunOptions,
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
    clearLogs: () => update((prev) => ({ ...prev, logs: [] })),
    run: (options: RunOptions) => {
      if (!options.testIds.length) {
        toast.error('Selecciona al menos un test')
        return
      }
      useExecutionStore.getState().patchRun(activeProfileId ?? 'none', (current) =>
        reduceRunState(current, { type: 'launched', options })
      )
      void runMutation.mutateAsync(options).catch(() => undefined)
    },
    abort: () => void abortMutation.mutateAsync().catch(() => undefined),
    parseParams,
    reset: () => {
      setSelected([])
      setEventRunning(false)
      if (activeProfileId) useExecutionStore.getState().clear(activeProfileId)
    },
  }
}

export type UseExecutionReturn = ReturnType<typeof useExecution>
export type {
  ExecutionLogEntry,
  ExecutionLogKind,
  ExecutionProgress,
  ExecutionTestResult,
  LastRunOptions,
  RunOptions,
} from './execution-state'
export type { TestTree, TestRunRequest }
