import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/types/contract'

const getMock = vi.fn()
const postMock = vi.fn()
const putMock = vi.fn()
const patchMock = vi.fn()
const deleteMock = vi.fn()

vi.mock('axios', () => {
  const create = vi.fn(() => ({
    get: getMock,
    post: postMock,
    put: putMock,
    patch: patchMock,
    delete: deleteMock,
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  }))
  return { default: { create }, create }
})

vi.mock('@/stores/profileStore', () => ({
  profileStore: {
    getState: () => ({ activeProfileId: 'profile-1' }),
  },
}))

describe('reportsApi export contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exportRun llama al endpoint esperado', async () => {
    getMock.mockResolvedValueOnce({ type: 'run', report: { id: 'r/1' }, summary: {}, tests: [] })
    const { reportsApi } = await import('@/lib/api')

    await reportsApi.exportRun('r/1')

    expect(getMock).toHaveBeenCalledWith('/reports/r%2F1/export', { params: undefined })
  })

  it('exportAnalytics llama al endpoint esperado', async () => {
    getMock.mockResolvedValueOnce({ type: 'analytics', summary: {} })
    const { reportsApi } = await import('@/lib/api')

    await reportsApi.exportAnalytics()

    expect(getMock).toHaveBeenCalledWith('/reports/analytics/export', { params: undefined })
  })

  it('propaga ApiError en fallos de exportación', async () => {
    const error = new ApiError(503, { message: 'Export unavailable' })
    getMock.mockRejectedValueOnce(error)
    const { reportsApi } = await import('@/lib/api')

    await expect(reportsApi.exportRun('abc')).rejects.toBe(error)
  })
})
