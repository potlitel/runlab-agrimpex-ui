import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RuntimeConfigBanner, RuntimeConfigProvider } from '@/context/runtime-config-context'
import type { RuntimeConfigState } from '@/lib/runtime-config'

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  io: vi.fn(),
  fetch: vi.fn(),
}))

vi.mock('axios', () => {
  const instance = {
    defaults: { baseURL: '' },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  }
  mocks.create.mockReturnValue(instance)
  return { default: { create: mocks.create }, create: mocks.create }
})

vi.mock('socket.io-client', () => {
  const socket = { on: vi.fn(), connect: vi.fn(), disconnect: vi.fn(), emit: vi.fn(), connected: false }
  mocks.io.mockReturnValue(socket)
  return { io: mocks.io }
})

vi.mock('@/stores/profileStore', () => ({
  profileStore: { getState: () => ({ activeProfileId: 'profile-1' }) },
}))

function Banner({ config }: { config: RuntimeConfigState }) {
  return (
    <RuntimeConfigProvider value={config}>
      <RuntimeConfigBanner />
    </RuntimeConfigProvider>
  )
}

describe('bootstrap de configuración en runtime', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_URL', 'https://baked.example/api')
    vi.stubEnv('VITE_SOCKET_URL', 'https://baked-socket.example')
    vi.stubGlobal('fetch', mocks.fetch)
    vi.resetModules()
    mocks.fetch.mockReset()
    mocks.io.mockClear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('aplica la configuración pública y muestra la versión antes de renderizar', async () => {
    mocks.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        apiBaseUrl: 'https://runtime.example/api',
        socketUrl: 'https://runtime.example',
        configVersion: 7,
      }),
    })

    const { loadRuntimeConfig, getRuntimeConfig } = await import('@/lib/runtime-config')
    const { getApiBaseUrl } = await import('@/lib/api')
    const { getSocketUrl, getRawSocket } = await import('@/lib/socket')

    const config = await loadRuntimeConfig()
    getRawSocket()

    expect(mocks.fetch).toHaveBeenCalledWith('/public-config.json', { cache: 'no-store' })
    expect(config).toMatchObject({
      apiBaseUrl: 'https://runtime.example/api',
      socketUrl: 'https://runtime.example',
      configVersion: 7,
      source: 'runtime',
      degraded: false,
    })
    expect(getRuntimeConfig().configVersion).toBe(7)
    expect(getApiBaseUrl()).toBe('https://runtime.example/api')
    expect(getSocketUrl()).toBe('https://runtime.example')
    expect(mocks.io).toHaveBeenCalledWith('https://runtime.example', expect.any(Object))

    render(<Banner config={config} />)
    const banner = screen.getByTestId('runtime-config-banner')
    expect(banner.textContent).toContain('v7')
    expect(banner.textContent).toContain('resuelta en ejecución')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('renderiza con el fallback y avisa cuando el recurso no responde', async () => {
    mocks.fetch.mockRejectedValue(new Error('sin conexión'))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    const { loadRuntimeConfig } = await import('@/lib/runtime-config')
    const { getApiBaseUrl } = await import('@/lib/api')
    const { getSocketUrl } = await import('@/lib/socket')

    const config = await loadRuntimeConfig()

    expect(config).toMatchObject({
      apiBaseUrl: 'https://baked.example/api',
      socketUrl: 'https://baked-socket.example',
      configVersion: 0,
      source: 'fallback',
      degraded: true,
    })
    expect(getApiBaseUrl()).toBe('https://baked.example/api')
    expect(getSocketUrl()).toBe('https://baked-socket.example')
    expect(warn).toHaveBeenCalled()

    render(<Banner config={config} />)
    expect(screen.getByTestId('runtime-config-banner').textContent).toContain('v0')
    expect(screen.getByRole('alert').textContent).toContain('/public-config.json')
  })
})
