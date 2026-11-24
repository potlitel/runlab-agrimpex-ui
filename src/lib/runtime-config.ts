import {
  API_BASE_FALLBACK,
  configureApiBaseUrl,
  publicConfigApi,
} from '@/lib/api'
import {
  SOCKET_URL_FALLBACK,
  configureSocketUrl,
} from '@/lib/socket'
import type { PublicConfig } from '@/types/contract'

export type RuntimeConfigSource = 'runtime' | 'fallback'

export interface RuntimeConfigState extends PublicConfig {
  source: RuntimeConfigSource
  degraded: boolean
}

let current: RuntimeConfigState | null = null

export function getRuntimeConfig(): RuntimeConfigState {
  return current ?? {
    apiBaseUrl: API_BASE_FALLBACK,
    ...(SOCKET_URL_FALLBACK ? { socketUrl: SOCKET_URL_FALLBACK } : {}),
    configVersion: 0,
    source: 'fallback',
    degraded: false,
  }
}

// Se ejecuta antes de root.render(): ni axios ni el socket han creado aún su
// cliente con los valores horneados. Si el recurso no responde, se conserva el
// comportamiento anterior y se marca la degradación para avisar en la UI.
export async function loadRuntimeConfig(): Promise<RuntimeConfigState> {
  try {
    const config = await publicConfigApi.get()
    configureApiBaseUrl(config.apiBaseUrl)
    configureSocketUrl(config.socketUrl)
    current = { ...config, source: 'runtime', degraded: false }
  } catch (error) {
    configureApiBaseUrl()
    configureSocketUrl()
    current = {
      apiBaseUrl: API_BASE_FALLBACK,
      ...(SOCKET_URL_FALLBACK ? { socketUrl: SOCKET_URL_FALLBACK } : {}),
      configVersion: 0,
      source: 'fallback',
      degraded: true,
    }
    // eslint-disable-next-line no-console
    console.warn('[runtime-config] /public-config.json no disponible; se usan las URLs del bundle', error)
  }
  return current
}
