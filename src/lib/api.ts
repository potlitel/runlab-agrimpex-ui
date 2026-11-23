import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
} from 'axios'
import { profileStore } from '@/stores/profileStore'
import {
  ApiError,
  type AutomationCheckResponse,
  type AutomationConfig,
  type AutomationInstallStatus,
  type AutomationStatus,
  type BrowseResponse,
  type Config,
  type ConfigSaveResponse,
  type ConfigValidateRequest,
  type ConfigValidateResponse,
  type DetectEnvResponse,
  type DockerCheckResponse,
  type DockerStatus,
  type EnvFilesResponse,
  type EnvResponse,
  type EnvVar,
  type ErrorImagesResponse,
  type FeatureFlags,
  type JsonDataFileResponse,
  type JsonDataTreeResponse,
  type Profile,
  type ProfileAdminListResponse,
  type ReportAnalyticsExportPayload,
  type ReportDetail,
  type ReportListItem,
  type ReportRunExportPayload,
  type ReportsAnalytics,
  type Schedule,
  type ScheduleResponse,
  type SchedulesResponse,
  type SystemUpdate,
  type TestFileResponse,
  type TestRunRequest,
  type TestRunResponse,
  type TestStatusResponse,
  type TestTree,
  type TxtData,
} from '@/types/contract'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request: inyecta perfil activo (sin auth)
api.interceptors.request.use((config) => {
  const profileId = profileStore.getState().activeProfileId
  if (profileId) {
    config.headers = config.headers ?? {}
    config.headers['X-Profile-Id'] = profileId
  }
  return config
})

// Response: devuelve data cruda
api.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: AxiosError) => {
    const status = error.response?.status ?? 0
    const payload = error.response?.data ?? { message: error.message }
    return Promise.reject(new ApiError(status, payload))
  }
)

// Helper para tipar respuestas (interceptor ya retorna data)
const get = <T>(url: string, params?: unknown) =>
  api.get<T, T>(url, { params })
const post = <T>(url: string, data?: unknown, params?: unknown) =>
  api.post<T, T>(url, data, { params })
const put = <T>(url: string, data?: unknown, params?: unknown) =>
  api.put<T, T>(url, data, { params })
const patch = <T>(url: string, data?: unknown, params?: unknown) =>
  api.patch<T, T>(url, data, { params })
const del = <T>(url: string, params?: unknown) =>
  api.delete<T, T>(url, { params })

// ── Config ───────────────────────────────────────────────────────────────
export const configApi = {
  get: () => get<Config>('/config'),
  save: (payload: Config) => post<ConfigSaveResponse>('/config', payload),
  validate: (payload: ConfigValidateRequest) =>
    post<ConfigValidateResponse>('/config/validate', payload),
  detectEnv: (projectPath?: string) =>
    get<DetectEnvResponse>('/config/detect-env', { projectPath }),
  browse: (type: 'folder' | 'file' = 'folder', startPath?: string) =>
    get<BrowseResponse>('/config/browse', { type, startPath }),
}

// ── Tests ────────────────────────────────────────────────────────────────
export const testsApi = {
  collect: () => get<TestTree>('/tests/collect'),
  cached: () => get<TestTree>('/tests/cached'),
  run: (
    testIds: string[],
    project?: string,
    grep?: string,
    workers?: number | string,
    extra?: Partial<TestRunRequest>
  ) =>
    post<TestRunResponse>('/tests/run', {
      testIds,
      ...(project ? { project } : {}),
      ...(grep ? { grep } : {}),
      ...(workers !== undefined ? { workers } : {}),
      ...(extra ?? {}),
    }),
  abort: () => post<{ success: boolean }>('/tests/abort'),
  status: () => get<TestStatusResponse>('/tests/status'),
  getFile: (name: string) => get<TestFileResponse>('/tests/file', { name }),
  saveFile: (name: string, content: string) =>
    post<{ success: boolean }>('/tests/file', { name, content }),
}

// ── Reports ──────────────────────────────────────────────────────────────
export const reportsApi = {
  list: () => get<ReportListItem[]>('/reports'),
  get: (id: string) => get<ReportDetail>(`/reports/${encodeURIComponent(id)}`),
  analytics: () => get<ReportsAnalytics>('/reports/analytics'),
  exportRun: (id: string) =>
    get<ReportRunExportPayload>(`/reports/${encodeURIComponent(id)}/export`),
  exportAnalytics: () => get<ReportAnalyticsExportPayload>('/reports/analytics/export'),
  delete: (id: string) => del<{ success: boolean }>(`/reports/${encodeURIComponent(id)}`),
  downloadJsonUrl: (id: string) => `${API_BASE_URL}/reports/${encodeURIComponent(id)}/download/json`,
  downloadHtmlUrl: (id: string) => `${API_BASE_URL}/reports/${encodeURIComponent(id)}/download/html`,
  assetUrl: (id: string, assetPath: string) =>
    `${API_BASE_URL}/reports/${encodeURIComponent(id)}/assets/${assetPath}`,
}

// ── Env / variables (.env files) ─────────────────────────────────────────
export const envApi = {
  get: (file?: string) => get<EnvResponse>('/env', file ? { file } : undefined),
  list: (file?: string) => get<EnvResponse>('/env', file ? { file } : undefined),
  files: () => get<EnvFilesResponse>('/env/files'),
  save: (vars: EnvVar[], file?: string) =>
    post<{ success: boolean }>('/env', { vars }, file ? { file } : undefined),
  update: (vars: EnvVar[], file?: string) =>
    post<{ success: boolean }>('/env', { vars }, file ? { file } : undefined),
}

// ── Profiles (entornos/variables guardados en el perfil activo) ──────────
export const profilesApi = {
  list: () => get<Record<string, EnvVar[]>>('/profiles'),
  get: () => get<Record<string, EnvVar[]>>('/profiles'),
  create: (name: string, vars: EnvVar[]) =>
    post<{ success: boolean }>(`/profiles/${encodeURIComponent(name)}`, { vars }),
  update: (name: string, vars: EnvVar[]) =>
    post<{ success: boolean }>(`/profiles/${encodeURIComponent(name)}`, { vars }),
  rename: (name: string, newName: string) =>
    patch<{ success: boolean }>(`/profiles/${encodeURIComponent(name)}/rename`, { newName }),
  delete: (name: string) =>
    del<{ success: boolean }>(`/profiles/${encodeURIComponent(name)}`),
}

// ── Docker ───────────────────────────────────────────────────────────────
export const dockerApi = {
  check: () => get<DockerCheckResponse>('/docker/check'),
  get: () => get<DockerStatus>('/docker/status'),
  status: () => get<DockerStatus>('/docker/status'),
  containers: () => get<unknown>('/docker/containers'),
  startDesktop: () => post<unknown>('/docker/start-desktop'),
  run: (action: string) => post<{ started: boolean }>('/docker/run', { action }),
  stop: () => post<{ stopped: boolean }>('/docker/stop'),
  reportUrl: () => `${API_BASE_URL}/docker/report`,
}

// ── Schedules ────────────────────────────────────────────────────────────
export const schedulesApi = {
  list: () => get<SchedulesResponse>('/schedules'),
  get: () => get<SchedulesResponse>('/schedules'),
  create: (payload: Partial<Schedule>) =>
    post<ScheduleResponse>('/schedules', payload),
  update: (id: string, payload: Partial<Schedule>) =>
    put<ScheduleResponse>(`/schedules/${encodeURIComponent(id)}`, payload),
  toggle: (id: string) =>
    patch<ScheduleResponse>(`/schedules/${encodeURIComponent(id)}/toggle`),
  delete: (id: string) =>
    del<{ success: boolean }>(`/schedules/${encodeURIComponent(id)}`),
  runNow: (id: string) =>
    post<{ success: boolean }>(`/schedules/${encodeURIComponent(id)}/run`),
}

// ── Errors (evidencia) ───────────────────────────────────────────────────
export const errorsApi = {
  list: () => get<ErrorImagesResponse>('/errors/images'),
  get: () => get<ErrorImagesResponse>('/errors/images'),
  images: () => get<ErrorImagesResponse>('/errors/images'),
  /** URL de archivo de evidencia en carpeta (imagen/video/trace/context) */
  fileUrl: (name: string) =>
    `${API_BASE_URL}/errors/file?name=${encodeURIComponent(name)}`,
  /** @deprecated usar fileUrl */
  imageUrl: (name: string) =>
    `${API_BASE_URL}/errors/image?name=${encodeURIComponent(name)}`,
}

// ── Automation ───────────────────────────────────────────────────────────
export const automationApi = {
  get: () => get<AutomationConfig>('/automation/config'),
  getConfig: () => get<AutomationConfig>('/automation/config'),
  saveConfig: (payload: Partial<AutomationConfig>) =>
    post<{ success: boolean }>('/automation/config', payload),
  update: (payload: { installPath: string; branch?: string }) =>
    post<{ started: boolean }>('/automation/update', payload),
  check: () => get<AutomationCheckResponse>('/automation/check'),
  install: (payload: { repoUrl: string; installPath: string }) =>
    post<{ started: boolean }>('/automation/install', payload),
  branches: (installPath: string) =>
    get<{ branches: string[] }>('/automation/branches', { installPath }),
  status: () => get<AutomationStatus>('/automation/status'),
  setupVenv: (projectPath?: string) =>
    post<{ started: boolean }>('/automation/setup-venv', projectPath ? { projectPath } : {}),
  setupDeps: (projectPath?: string) =>
    post<{ started: boolean }>('/automation/setup-deps', projectPath ? { projectPath } : {}),
  installStatus: (installPath: string) =>
    get<AutomationInstallStatus>('/automation/install-status', { installPath }),
  apply: (payload: { projectPath?: string; pytestCmd?: string; playwrightCmd?: string }) =>
    post<{ success: boolean; projectChanged?: boolean; reset?: unknown }>('/automation/apply', payload),
}

// ── Features ─────────────────────────────────────────────────────────────
export const featuresApi = {
  get: () => get<FeatureFlags>('/features'),
  list: () => get<FeatureFlags>('/features'),
  save: (flags: Partial<FeatureFlags>) => post<FeatureFlags>('/features', flags),
  update: (flags: Partial<FeatureFlags>) => post<FeatureFlags>('/features', flags),
}

// ── Txt data ─────────────────────────────────────────────────────────────
export const txtDataApi = {
  get: () => get<TxtData>('/txtdata'),
  list: () => get<TxtData>('/txtdata'),
}

// ── Json data ────────────────────────────────────────────────────────────
export const jsonDataApi = {
  get: () => get<JsonDataTreeResponse>('/jsondata/tree'),
  tree: () => get<JsonDataTreeResponse>('/jsondata/tree'),
  getFile: (folder: string, file: string) =>
    get<JsonDataFileResponse>('/jsondata/file', { folder, file }),
  saveFile: (folder: string, file: string, data: unknown) =>
    post<{ success: boolean; path?: string }>('/jsondata/file', { data }, { folder, file }),
  update: (folder: string, file: string, data: unknown) =>
    post<{ success: boolean; path?: string }>('/jsondata/file', { data }, { folder, file }),
  listSnapshots: (folder: string, file: string) =>
    get<Record<string, unknown>>('/jsondata/snapshots', { folder, file }),
  saveSnapshot: (folder: string, file: string, name: string, data: unknown) =>
    post<{ success: boolean }>(`/jsondata/snapshots/${encodeURIComponent(name)}`, { data }, { folder, file }),
  create: (folder: string, file: string, name: string, data: unknown) =>
    post<{ success: boolean }>(`/jsondata/snapshots/${encodeURIComponent(name)}`, { data }, { folder, file }),
  deleteSnapshot: (folder: string, file: string, name: string) =>
    del<{ success: boolean }>(`/jsondata/snapshots/${encodeURIComponent(name)}`, { folder, file }),
  delete: (folder: string, file: string, name: string) =>
    del<{ success: boolean }>(`/jsondata/snapshots/${encodeURIComponent(name)}`, { folder, file }),
}

// ── Profile admin (gestión de perfiles del dashboard) ────────────────────
export const profileAdminApi = {
  list: () => get<ProfileAdminListResponse>('/profile-admin'),
  get: () => get<ProfileAdminListResponse>('/profile-admin'),
  create: (name: string, options?: { testDataSource?: 'defaults' | 'template' | 'active' | 'none' }) =>
    post<Profile>('/profile-admin', { name, ...(options ?? {}) }),
  updateSettings: (payload: {
    templateProfileId?: string | null
    testDataDefaults?: { txtFolderPath?: string; jsonDataPath?: string }
    createProfileTestDataMode?: 'defaults' | 'template' | 'active' | 'none'
  }) => patch<ProfileAdminListResponse>('/profile-admin/settings', payload),
  rename: (id: string, name: string) =>
    patch<{ success: boolean }>(`/profile-admin/${encodeURIComponent(id)}/rename`, { name }),
  update: (id: string, name: string) =>
    patch<{ success: boolean }>(`/profile-admin/${encodeURIComponent(id)}/rename`, { name }),
  duplicate: (id: string, name: string) =>
    post<Profile>(`/profile-admin/${encodeURIComponent(id)}/duplicate`, { name }),
  activate: (id: string) =>
    patch<{ success: boolean; activeProfileId: string }>(
      `/profile-admin/${encodeURIComponent(id)}/activate`
    ),
  delete: (id: string) =>
    del<{ success: boolean; activeProfileId?: string }>(`/profile-admin/${encodeURIComponent(id)}`),
}

// ── System ───────────────────────────────────────────────────────────────
export const systemApi = {
  get: () => get<SystemUpdate>('/system/updates'),
  updates: () => get<SystemUpdate>('/system/updates'),
  update: (token?: string) =>
    api.post<SystemUpdate, SystemUpdate>(
      '/system/update',
      {},
      token ? { headers: { 'x-update-token': token } } : undefined
    ),
}

export { ApiError }
