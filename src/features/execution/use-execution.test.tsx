import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reduceRunState } from './execution-state'
import { useExecutionStore } from './execution-store'

const captured = vi.hoisted(() => ({
  execution: {} as Record<string, (payload: unknown) => void>,
  test: {} as Record<string, (payload: unknown) => void>,
  progress: undefined as unknown as (payload: unknown) => void,
}))

vi.mock('@/hooks/use-socket', () => ({
  useSocket: () => ({
    onExecution: (handlers: Record<string, (payload: unknown) => void>) => {
      captured.execution = handlers
      return () => undefined
    },
    onTest: (handlers: Record<string, (payload: unknown) => void>) => {
      captured.test = handlers
      return () => undefined
    },
    onProgress: (handler: (payload: unknown) => void) => {
      captured.progress = handler
      return () => undefined
    },
  }),
}))

vi.mock('@/lib/api', () => ({
  testsApi: {
    cached: vi.fn().mockResolvedValue({ files: {}, total: 0, projects: [] }),
    status: vi.fn().mockResolvedValue({ running: false }),
    run: vi.fn().mockResolvedValue({ message: 'Ejecución iniciada' }),
    abort: vi.fn().mockResolvedValue({}),
    collect: vi.fn(),
  },
  reportsApi: {
    get: vi.fn().mockResolvedValue({
      id: 'report-1',
      summary: { total: 2, passed: 1, failed: 1 },
      tests: [],
    }),
  },
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/stores/profileStore', () => ({
  useProfileStore: (
    selector: (state: { activeProfileId: string | null; profiles: unknown[] }) => unknown
  ) => selector({ activeProfileId: 'profile-1', profiles: [] }),
}))

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useExecution: estado de la corrida compartido', () => {
  beforeEach(() => {
    useExecutionStore.setState({ byProfile: {} })
  })

  it('expone reportId, timestamp y opciones tras completed y aborted', async () => {
    const { useExecution } = await import('./use-execution')
    const { result } = renderHook(() => useExecution(), { wrapper: makeWrapper() })

    act(() => {
      result.current.run({
        testIds: ['tests/a.spec.ts::caso'],
        project: 'chromium',
        workers: 4,
        useDocker: true,
        params: { USER: 'qa' },
      })
    })
    expect(result.current.lastRunOptions).toEqual({
      project: 'chromium',
      workers: 4,
      useDocker: true,
      paramsCount: 1,
    })

    act(() => {
      captured.execution.completed({
        profileId: 'profile-1',
        reportId: 'report-1',
        summary: { total: 2, passed: 1, failed: 1 },
        timestamp: '2026-11-23T10:00:00.000Z',
      })
    })
    await waitFor(() => expect(result.current.reportId).toBe('report-1'))
    expect(result.current.reportTimestamp).toBe('2026-11-23T10:00:00.000Z')

    act(() => {
      captured.execution.aborted({
        profileId: 'profile-1',
        reportId: 'report-2',
        completed: 1,
        total: 2,
        summary: { total: 2, passed: 1, failed: 0 },
        timestamp: '2026-11-23T10:02:00.000Z',
      })
    })
    await waitFor(() => expect(result.current.reportId).toBe('report-2'))
    expect(result.current.reportTimestamp).toBe('2026-11-23T10:02:00.000Z')
    expect(result.current.lastRunOptions?.project).toBe('chromium')
  })

  it('aísla la corrida de cada perfil en el store', () => {
    useExecutionStore.getState().update('profile-a', (snapshot) => ({
      ...snapshot,
      run: reduceRunState(snapshot.run, {
        type: 'completed',
        reportId: 'report-a',
      }),
    }))
    useExecutionStore.getState().update('profile-b', (snapshot) => ({
      ...snapshot,
      run: reduceRunState(snapshot.run, {
        type: 'completed',
        reportId: 'report-b',
      }),
    }))

    const byProfile = useExecutionStore.getState().byProfile
    expect(byProfile['profile-a'].run.reportId).toBe('report-a')
    expect(byProfile['profile-b'].run.reportId).toBe('report-b')
  })

  it('sobrevive al desmontaje y remontaje del hook al navegar entre rutas', async () => {
    const { useExecution } = await import('./use-execution')
    const wrapper = makeWrapper()
    const first = renderHook(() => useExecution(), { wrapper })

    act(() => {
      captured.execution.completed({
        profileId: 'profile-1',
        reportId: 'report-navigation',
        summary: { total: 1, passed: 1, failed: 0 },
        timestamp: '2026-11-23T10:05:00.000Z',
      })
    })
    await waitFor(() => expect(first.result.current.reportId).toBe('report-navigation'))
    first.unmount()

    const second = renderHook(() => useExecution(), { wrapper })
    expect(second.result.current.reportId).toBe('report-navigation')
    expect(second.result.current.reportTimestamp).toBe('2026-11-23T10:05:00.000Z')
  })
})
