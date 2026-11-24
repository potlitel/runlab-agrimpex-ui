import axios from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  create: vi.fn(),
}))

vi.mock('axios', () => {
  const instance = {
    get: mocks.get,
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

vi.mock('@/stores/profileStore', () => ({
  profileStore: {
    getState: () => ({ activeProfileId: 'profile-1' }),
  },
}))

describe('systemApi health', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_URL', 'https://runlab.example/api')
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('construye ambas URLs sobre VITE_API_URL', async () => {
    mocks.get.mockResolvedValue({ status: 'ok', uptimeSeconds: 1, version: '1.0.0' })

    const { systemApi } = await import('@/lib/api')

    expect(vi.mocked(axios.create)).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: 'https://runlab.example/api' })
    )

    await systemApi.health()
    expect(mocks.get).toHaveBeenCalledWith('/health', { params: undefined })

    await systemApi.healthDetail()
    expect(mocks.get).toHaveBeenCalledWith('/health/detail', { params: undefined })
  })
})
