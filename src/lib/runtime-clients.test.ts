import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  io: vi.fn(),
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
  const socket = {
    on: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    emit: vi.fn(),
    connected: false,
  }
  mocks.io.mockReturnValue(socket)
  return { io: mocks.io }
})

vi.mock('@/stores/profileStore', () => ({
  profileStore: { getState: () => ({ activeProfileId: 'profile-1' }) },
}))

describe('clientes con configuración pública en runtime', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_URL', 'https://baked.example/api')
    vi.stubEnv('VITE_SOCKET_URL', 'https://baked-socket.example')
    vi.resetModules()
    mocks.io.mockClear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('aplica la configuración recibida antes de construir axios y el socket', async () => {
    const { configureApiBaseUrl, getApiBaseUrl, reportsApi } = await import('@/lib/api')
    const { configureSocketUrl, getSocketUrl, getRawSocket } = await import('@/lib/socket')

    configureApiBaseUrl('https://runtime.example/api')
    configureSocketUrl('https://runtime-socket.example')
    getRawSocket()

    const results = mocks.create.mock.results
    const instance = results[results.length - 1]?.value as { defaults: { baseURL: string } }
    expect(instance.defaults.baseURL).toBe('https://runtime.example/api')
    expect(getApiBaseUrl()).toBe('https://runtime.example/api')
    expect(reportsApi.downloadJsonUrl('run-1')).toBe('https://runtime.example/api/reports/run-1/download/json')
    expect(getSocketUrl()).toBe('https://runtime-socket.example')
    expect(mocks.io).toHaveBeenCalledWith('https://runtime-socket.example', expect.objectContaining({ autoConnect: false }))
  })

  it('usa los valores horneados cuando no hay configuración pública', async () => {
    const { configureApiBaseUrl, getApiBaseUrl, reportsApi } = await import('@/lib/api')
    const { configureSocketUrl, getRawSocket } = await import('@/lib/socket')

    configureApiBaseUrl(undefined)
    configureSocketUrl(undefined)
    getRawSocket()

    const results = mocks.create.mock.results
    const instance = results[results.length - 1]?.value as { defaults: { baseURL: string } }
    expect(instance.defaults.baseURL).toBe('https://baked.example/api')
    expect(getApiBaseUrl()).toBe('https://baked.example/api')
    expect(reportsApi.downloadJsonUrl('run-1')).toBe('https://baked.example/api/reports/run-1/download/json')
    expect(mocks.io).toHaveBeenCalledWith('https://baked-socket.example', expect.any(Object))
  })

  it('deriva el socket del API horneada cuando no hay override', async () => {
    vi.stubEnv('VITE_SOCKET_URL', '')
    const { getRawSocket } = await import('@/lib/socket')
    getRawSocket()
    expect(mocks.io).toHaveBeenCalledWith('https://baked.example', expect.any(Object))
  })
})
