import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const healthDetail = vi.hoisted(() => vi.fn())

vi.mock('@/lib/api', () => ({
  systemApi: {
    health: vi.fn(),
    healthDetail,
  },
}))

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useHealth', () => {
  beforeEach(() => {
    healthDetail.mockReset()
  })

  it('expone status, failedChecks y refresh', async () => {
    healthDetail.mockResolvedValue({
      status: 'degraded',
      uptimeSeconds: 12,
      checks: { critical: [], informational: [] },
      failedChecks: ['playwrightKit'],
    })
    const { useHealth } = await import('./use-health')
    const { result } = renderHook(() => useHealth(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.status).toBe('degraded'))
    expect(result.current.failedChecks).toEqual(['playwrightKit'])

    act(() => {
      result.current.refresh()
    })
    await waitFor(() => expect(healthDetail).toHaveBeenCalledTimes(2))
  })

  it('un error no lanza excepción ni bloquea otras queries', async () => {
    healthDetail.mockRejectedValue(new Error('API inalcanzable'))
    const otherQuery = vi.fn().mockResolvedValue({ ok: true })
    const { useHealth } = await import('./use-health')
    const { result } = renderHook(
      () => ({
        health: useHealth(),
        other: useQuery({ queryKey: ['independent'], queryFn: otherQuery }),
      }),
      { wrapper: makeWrapper() }
    )

    await waitFor(() => expect(result.current.health.status).toBe('offline'))
    expect(result.current.health.failedChecks).toEqual([])
    expect(() => result.current.health.refresh()).not.toThrow()

    await waitFor(() => expect(result.current.other.data).toEqual({ ok: true }))
    expect(otherQuery).toHaveBeenCalledTimes(1)
  })
})
