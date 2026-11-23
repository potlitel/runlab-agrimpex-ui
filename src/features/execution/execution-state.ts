import type { ReportSummary } from '@/types/contract'

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

/** Opciones efectivas de la corrida, conservadas al lanzarla (D8). */
export interface LastRunOptions {
  project?: string
  envFile?: string
  profileName?: string
  useDocker?: boolean
  workers?: number | string
  grep?: string
  paramsCount: number
}

export interface ExecutionProgress {
  current: number
  total: number
  percentage: number
}

export interface ExecutionRunState {
  reportId: string | null
  reportTimestamp: string | null
  lastRunOptions: LastRunOptions | null
  lastRunStatus: 'completed' | 'aborted' | null
}

export const initialRunState: ExecutionRunState = {
  reportId: null,
  reportTimestamp: null,
  lastRunOptions: null,
  lastRunStatus: null,
}

export type ExecutionRunEvent =
  | { type: 'launched'; options: RunOptions }
  | { type: 'started' }
  | { type: 'completed'; reportId: string; timestamp?: string }
  | { type: 'aborted'; reportId: string; timestamp?: string }
  | { type: 'reportResolved'; timestamp?: string }
  | { type: 'reportFailed' }
  | { type: 'reset' }

export function toLastRunOptions(options: RunOptions): LastRunOptions {
  return {
    ...(options.project ? { project: options.project } : {}),
    ...(options.envFile ? { envFile: options.envFile } : {}),
    ...(options.profileName ? { profileName: options.profileName } : {}),
    ...(options.useDocker ? { useDocker: true } : {}),
    ...(options.workers !== undefined && options.workers !== ''
      ? { workers: options.workers }
      : {}),
    ...(options.grep ? { grep: options.grep } : {}),
    paramsCount: Object.keys(options.params ?? {}).length,
  }
}

export function reduceRunState(
  state: ExecutionRunState,
  event: ExecutionRunEvent
): ExecutionRunState {
  switch (event.type) {
    case 'launched':
      return { ...state, lastRunOptions: toLastRunOptions(event.options) }
    case 'started':
      return { ...state, lastRunStatus: null }
    case 'completed':
    case 'aborted':
      return {
        ...state,
        reportId: event.reportId,
        reportTimestamp: event.timestamp ?? state.reportTimestamp,
        lastRunStatus: event.type,
      }
    case 'reportResolved':
      return {
        ...state,
        reportTimestamp: event.timestamp ?? state.reportTimestamp,
      }
    case 'reportFailed':
      return state
    case 'reset':
      return initialRunState
  }
}

export const EMPTY_SUMMARY: ReportSummary = { total: 0, passed: 0, failed: 0 }

export interface ExecutionSummaryView {
  summary: ReportSummary
  /** true únicamente cuando falló la consulta del detalle del reporte. */
  partial: boolean
  passRate: number
}

export interface MergeSummaryOptions {
  derived?: Partial<ReportSummary>
  detailFailed?: boolean
}

function definedValues(source?: Partial<ReportSummary> | null): Partial<ReportSummary> {
  if (!source) return {}
  return Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== undefined && value !== null)
  ) as Partial<ReportSummary>
}

/**
 * Fusiona el resumen del evento en vivo con el del reporte. Prevalecen los campos
 * presentes del reporte; los derivados de resultados y los del evento cubren los huecos.
 */
export function mergeExecutionSummary(
  eventSummary: ReportSummary,
  reportSummary: ReportSummary | null,
  options: MergeSummaryOptions = {}
): ExecutionSummaryView {
  const summary = {
    ...definedValues(options.derived),
    ...definedValues(eventSummary),
    ...definedValues(reportSummary),
  } as ReportSummary
  const passed = Number(summary.passed) || 0
  const failed = Number(summary.failed) || 0
  const errors = Number(summary.errors) || 0
  const executed = passed + failed + errors

  return {
    summary,
    partial: options.detailFailed === true,
    passRate: executed > 0 ? Math.round((passed / executed) * 100) : 0,
  }
}

export function deriveSummaryFromResults(
  results: Record<string, ExecutionTestResult>
): Partial<ReportSummary> {
  const values = Object.values(results)
  return {
    total: values.length,
    passed: values.filter((test) => test.status === 'passed').length,
    failed: values.filter((test) => test.status === 'failed').length,
    errors: values.filter((test) => test.status === 'error').length,
    skipped: values.filter((test) => test.status === 'skipped').length,
  }
}

/** Los payloads del socket declaran `timestamp` como campo libre; solo se acepta como string. */
export function eventTimestamp(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined
  const value = (payload as Record<string, unknown>).timestamp
  return typeof value === 'string' ? value : undefined
}

export interface ExecutionSnapshot {
  logs: ExecutionLogEntry[]
  results: Record<string, ExecutionTestResult>
  progress: ExecutionProgress
  summaryView: ExecutionSummaryView | null
  run: ExecutionRunState
}

export function createEmptySnapshot(): ExecutionSnapshot {
  return {
    logs: [],
    results: {},
    progress: { current: 0, total: 0, percentage: 0 },
    summaryView: null,
    run: initialRunState,
  }
}

export const EMPTY_SNAPSHOT = createEmptySnapshot()
