/**
 * Tipos del contrato REST/Socket.io con runlab-agrimpex-api.
 * Tipos espejo a mano (sin codegen); todos los payloads de socket incluyen profileId.
 */

// ── Errores ──────────────────────────────────────────────────────────────
export class ApiError extends Error {
  status: number
  payload: unknown

  constructor(status: number, payload: unknown, message?: string) {
    const msg =
      message ??
      (typeof payload === 'object' && payload && 'error' in (payload as Record<string, unknown>)
        ? String((payload as Record<string, unknown>).error)
        : `API error ${status}`)
    super(msg)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

// ── Perfil / sesión ──────────────────────────────────────────────────────
export interface Profile {
  id: string
  name: string
  [key: string]: unknown
}

export type CreateProfileTestDataMode = 'defaults' | 'template' | 'active' | 'none'

export interface ProfileTestDataDefaults {
  txtFolderPath: string
  jsonDataPath: string
}

export interface ProfileAdminListResponse {
  activeProfileId: string
  profiles: Profile[]
  templateProfileId?: string | null
  testDataDefaults?: ProfileTestDataDefaults
  createProfileTestDataMode?: CreateProfileTestDataMode
}

export interface ProfilesStatusItem {
  id: string
  running: boolean
  kinds: string[]
}

// ── Config ───────────────────────────────────────────────────────────────
export interface ProjectMcpFeature {
  detected: boolean
  signals?: string[]
}

export interface ProjectFeatures {
  mcp?: ProjectMcpFeature
  [key: string]: unknown
}

export type ScreenshotMode = 'always' | 'only-on-failure' | 'off'
export type VideoMode = 'on' | 'off' | 'retain-on-failure' | 'on-first-retry'
export type TraceMode = 'on' | 'off' | 'retain-on-failure' | 'on-first-retry'

export interface EvidenceConfig {
  screenshot?: ScreenshotMode
  video?: VideoMode
  trace?: TraceMode
  fullPage?: boolean
}

export interface Config {
  projectPath?: string
  envPath?: string
  playwrightCmd?: string
  pytestCmd?: string
  txtFolderPath?: string
  seleniumRemoteUrl?: string
  errorImagesPath?: string
  jsonDataPath?: string
  projectFeatures?: ProjectFeatures
  evidence?: EvidenceConfig
  [key: string]: unknown
}

export interface ConfigSaveResponse {
  success: boolean
  config: Config
  projectChanged?: boolean
  reset?: unknown
}

export interface ConfigValidateRequest {
  projectPath?: string
  playwrightCmd?: string
  pytestCmd?: string
}

export interface ConfigValidateResponse {
  valid: boolean
  reason?: string
}

export interface DetectEnvResponse {
  path: string | null
}

export interface BrowseResponse {
  path: string | null
  cancelled?: boolean
}

// ── Tests ────────────────────────────────────────────────────────────────
export type TestId = string

export interface TestTree {
  timestamp?: string | null
  files: Record<string, string[]>
  total: number
  projects: string[]
  errorFiles?: unknown
  [key: string]: unknown
}

export interface TestRunRequest {
  testIds: TestId[]
  profileName?: string
  envFile?: string
  useDocker?: boolean
  params?: Record<string, string>
  paramsByTest?: Record<string, Record<string, string>>
  project?: string
  grep?: string
  workers?: number | string
  [key: string]: unknown
}

export interface TestRunResponse {
  success?: boolean
  message?: string
  reportId?: string
  error?: string
  [key: string]: unknown
}

export interface TestStatusResponse {
  running: boolean
}

export interface TestFileResponse {
  content: string
  path: string
  size?: number
  mtime?: string
  [key: string]: unknown
}

// ── Reports ──────────────────────────────────────────────────────────────
export interface ReportSummary {
  total: number
  passed: number
  failed: number
  errors?: number
  skipped?: number
  duration?: number
  previewImage?: string | null
  [key: string]: unknown
}

export interface ReportListItem {
  id: string
  timestamp?: string
  summary: ReportSummary
  [key: string]: unknown
}

export interface ReportAttachment {
  name?: string
  contentType?: string
  path?: string
  assetPath?: string
  [key: string]: unknown
}

export interface ReportTestResult {
  id: string
  status: 'passed' | 'failed' | 'error' | 'skipped' | string
  duration?: number
  output?: string
  errorMsg?: string
  attachments?: ReportAttachment[]
  project?: string
  [key: string]: unknown
}

export interface ReportDetail {
  id?: string
  timestamp?: string
  summary: ReportSummary
  tests: ReportTestResult[]
  [key: string]: unknown
}

export interface ReportsAnalytics {
  totalRuns: number
  totalExecutions: number
  totalPassed: number
  totalFailed: number
  passRate: number
  avgDuration: number
  totalAvailable: number | null
  uniqueExecuted: number
  uniquePassed: number
  uniqueFailed: number
  neverExecuted: number | null
  byFile: Array<Record<string, unknown>>
  timeline: Array<Record<string, unknown>>
  [key: string]: unknown
}

// ── Report PDF export (contrato C3a esperado) ───────────────────────────
export type ReportRunExportSectionId =
  | 'cover'
  | 'summary'
  | 'tests'
  | 'evidence'
  | 'footer'

export type ReportAnalyticsExportSectionId =
  | 'cover'
  | 'kpis'
  | 'trend'
  | 'byFile'
  | 'recentRuns'
  | 'footer'

export interface ReportExportProfile {
  id?: string
  name?: string
  [key: string]: unknown
}

export interface ReportExportAttachment {
  name?: string
  contentType?: string
  path?: string
  assetPath?: string
  assetUrl?: string
  kind?: 'image' | 'other' | string
  [key: string]: unknown
}

export interface ReportExportTest {
  id: string
  status: 'passed' | 'failed' | 'error' | 'skipped' | string
  duration?: number
  output?: string
  errorMsg?: string
  attachments?: ReportExportAttachment[]
  project?: string
  [key: string]: unknown
}

export interface ReportRunExportPayload {
  type: 'run' | string
  generatedAt?: string
  profile?: ReportExportProfile
  report: {
    id: string
    timestamp?: string
    [key: string]: unknown
  }
  summary: ReportSummary
  tests: ReportExportTest[]
  sections?: ReportRunExportSectionId[]
  source?: string
  [key: string]: unknown
}

export interface ReportAnalyticsTimelinePoint {
  timestamp?: string
  label?: string
  passed?: number
  failed?: number
  errors?: number
  skipped?: number
  total?: number
  duration?: number
  [key: string]: unknown
}

export interface ReportAnalyticsByFileRow {
  file?: string
  name?: string
  total?: number
  passed?: number
  failed?: number
  errors?: number
  skipped?: number
  passRate?: number
  duration?: number
  [key: string]: unknown
}

export interface ReportAnalyticsRecentRun {
  id: string
  timestamp?: string
  summary?: ReportSummary
  status?: string
  [key: string]: unknown
}

export interface ReportAnalyticsExportPayload {
  type: 'analytics' | string
  generatedAt?: string
  profile?: ReportExportProfile
  summary: ReportsAnalytics
  timeline?: ReportAnalyticsTimelinePoint[]
  byFile?: ReportAnalyticsByFileRow[]
  recentRuns?: ReportAnalyticsRecentRun[]
  sections?: ReportAnalyticsExportSectionId[]
  source?: string
  [key: string]: unknown
}

export type ReportPdfExportOptions<T extends string = string> = {
  sections?: T[]
}

// ── Env / variables ──────────────────────────────────────────────────────
export interface EnvVar {
  key?: string
  value?: string
  isComment?: boolean
  comment?: string
  [key: string]: unknown
}

export interface EnvFilesResponse {
  files: string[]
}

export interface EnvResponse {
  vars: EnvVar[]
  path: string
}

// ── Schedules ────────────────────────────────────────────────────────────
export interface Schedule {
  id: string
  name?: string
  time?: string
  enabled?: boolean
  days?: number[]
  testIds?: string[]
  repeat?: number
  useDocker?: boolean
  params?: Record<string, string>
  paramsByTest?: Record<string, Record<string, string>>
  lastRun?: string | null
  nextRun?: string | null
  createdAt?: string
  [key: string]: unknown
}

export interface SchedulesResponse {
  schedules: Schedule[]
}

export interface ScheduleResponse {
  schedule: Schedule
}

// ── Docker ───────────────────────────────────────────────────────────────
export interface DockerStatus {
  running?: boolean
  projectPath?: string
  gridUp?: unknown
  projectUp?: unknown
  hasReport?: boolean
  [key: string]: unknown
}

export interface DockerCheckResponse {
  installed?: boolean
  running?: boolean
  ready?: boolean
  error?: string
  [key: string]: unknown
}

// ── Automation / entorno ─────────────────────────────────────────────────
export interface AutomationStatus {
  installing: boolean
  pulling: boolean
  envBusy: boolean
  [key: string]: unknown
}

export interface AutomationConfig {
  repoUrl: string
  installPath: string
  [key: string]: unknown
}

export interface AutomationCheckResponse {
  git?: { ok: boolean; error?: string }
  python?: { ok: boolean; error?: string }
  venv?: { ok: boolean; error?: string }
  [key: string]: unknown
}

export interface AutomationInstallStatus {
  checked: boolean
  repoCloned?: boolean
  venvCreated?: boolean
  depsInstalled?: boolean
  hasRequirements?: boolean
  fullyInstalled?: boolean
  [key: string]: unknown
}

// ── Features / flags ─────────────────────────────────────────────────────
export interface FeatureFlags {
  [key: string]: boolean | unknown
}

// ── Errores (evidencia) ──────────────────────────────────────────────────
export type EvidenceKind = 'image' | 'video' | 'trace' | 'context' | 'other'
export type EvidenceSource = 'folder' | 'report'

export interface EvidenceItem {
  id: string
  name: string
  displayName?: string
  kind: EvidenceKind
  source: EvidenceSource
  mtime?: number
  timestamp?: string | null
  size?: number | null
  reportId?: string | null
  reportTimestamp?: string | null
  testId?: string | null
  status?: string | null
  assetPath?: string | null
  contentType?: string | null
  url: string
  downloadUrl?: string
  [key: string]: unknown
}

/** @deprecated usar EvidenceItem */
export interface ErrorImage {
  name: string
  mtime: number
  size: number
  [key: string]: unknown
}

export interface ErrorImagesResponse {
  configured: boolean
  folder: string
  folderMissing?: boolean
  /** Compatibilidad (imágenes de carpeta) */
  images?: ErrorImage[]
  items?: EvidenceItem[]
  counts?: { total: number; folder: number; reports: number }
  error?: string
  /** @deprecated usar folderMissing */
  missing?: boolean
}

// ── Txt data ─────────────────────────────────────────────────────────────
export interface TxtData {
  configured: boolean
  folder?: string
  columns?: string[]
  rows?: Array<Record<string, unknown>>
  files?: string[]
  fileCount?: number
  error?: string
  [key: string]: unknown
}

// ── Json data ────────────────────────────────────────────────────────────
export interface JsonDataTreeItem {
  folder: string
  files: string[]
}

export interface JsonDataTreeResponse {
  configured: boolean
  base: string
  tree: JsonDataTreeItem[]
  error?: string
}

export interface JsonDataFileResponse {
  data: unknown
  path: string
}

export type JsonData = JsonDataFileResponse

// ── System update ────────────────────────────────────────────────────────
export interface SystemUpdateRepoStatus {
  key?: string
  updated?: boolean
  [key: string]: unknown
}

export interface SystemUpdate {
  repos?: SystemUpdateRepoStatus[]
  enabled?: boolean
  success?: boolean
  results?: SystemUpdateRepoStatus[]
  error?: string
  disabled?: boolean
  [key: string]: unknown
}

// ── Payloads Socket.io (todos con profileId salvo profiles:status global) ─
export interface SocketProfilePayload {
  profileId: string
  [key: string]: unknown
}

export interface ExecutionStartedPayload extends SocketProfilePayload {
  total: number
}

export interface ExecutionCompletedPayload extends SocketProfilePayload {
  reportId: string
  summary: ReportSummary
}

export interface ExecutionAbortedPayload extends SocketProfilePayload {
  reportId: string
  completed: number
  total: number
  summary: ReportSummary
}

export interface ExecutionPreparingPayload extends SocketProfilePayload {
  message: string
}

export interface ExecutionPrepareFailedPayload extends SocketProfilePayload {
  error: string
}

export interface TestStartedPayload extends SocketProfilePayload {
  id: string
  index?: number
  total?: number
}

export interface TestCompletedPayload extends SocketProfilePayload {
  id: string
  status: string
  duration?: number
  output?: string
  errorMsg?: string
  attachments?: Array<Record<string, unknown>>
}

export interface TestOutputPayload extends SocketProfilePayload {
  id: string
  line: string
}

export interface ProgressPayload extends SocketProfilePayload {
  current: number
  total: number
  percentage: number
}

export interface DockerLogPayload extends SocketProfilePayload {
  message: string
  type?: 'info' | 'error' | 'success' | string
}

export interface DockerStartedPayload extends SocketProfilePayload {
  action?: string
}

export interface DockerExitPayload extends SocketProfilePayload {
  action?: string
  code?: number
  error?: string
}

export interface AutomationProgressPayload extends SocketProfilePayload {
  percent: number
  label: string
  step?: string
}

export interface AutomationLogPayload extends SocketProfilePayload {
  message: string
  type?: 'info' | 'error' | 'success' | string
}

export interface AutomationDonePayload extends SocketProfilePayload {
  projectPath?: string
  pytestCmd?: string
}

export interface AutomationFailedPayload extends SocketProfilePayload {
  error: string
}

export interface EnvProgressPayload extends SocketProfilePayload {
  percent?: number
  label?: string
}

export interface EnvLogPayload extends SocketProfilePayload {
  message: string
  type?: 'info' | 'error' | 'success' | string
}

export interface EnvVenvDonePayload extends SocketProfilePayload {
  exists?: boolean
}

export interface EnvDepsDonePayload extends SocketProfilePayload {
  skipped?: boolean
}

export interface EnvFailedPayload extends SocketProfilePayload {
  error: string
}

export interface ScheduleRunPayload extends SocketProfilePayload {
  id: string
  name?: string
  total?: number
}

export interface ScheduleLogPayload extends SocketProfilePayload {
  message: string
  type?: 'info' | 'error' | 'success' | string
  ts?: number
}

export type ProfilesStatusPayload = ProfilesStatusItem[]

export interface SystemUpdateEventPayload {
  message: string
  type?: 'info' | 'error' | 'success' | string
  at?: number
  [key: string]: unknown
}
