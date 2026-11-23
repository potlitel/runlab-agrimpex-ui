import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { ExecutionDashboard } from './dashboard'

vi.mock('@/stores/profileStore', () => ({
  useProfileStore: (
    selector: (state: {
      activeProfileId: string | null
      profiles: Array<{ id: string; name: string }>
    }) => unknown
  ) =>
    selector({
      activeProfileId: 'profile-1',
      profiles: [{ id: 'profile-1', name: 'QA' }],
    }),
}))

vi.mock('@/lib/api', () => ({
  featuresApi: { get: vi.fn().mockResolvedValue({ reports: false }) },
  configApi: { get: vi.fn().mockResolvedValue({ projectPath: '/proyectos/qa' }) },
}))

vi.mock('@/components/layout/header', () => ({
  Header: ({ children }: { children: ReactNode }) => <header>{children}</header>,
}))
vi.mock('@/components/layout/header-tools', () => ({
  HeaderTools: () => <div />,
}))
vi.mock('@/components/profile-header-badge', () => ({
  ProfileHeaderBadge: () => <div />,
}))
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children }: { to: string; children: ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}))

vi.mock('./use-execution', () => ({
  useExecution: () => ({
    reportId: 'report-1',
    reportTimestamp: '2026-11-23T10:00:00.000Z',
    lastRunStatus: 'completed',
    summary: { total: 1, passed: 1, failed: 0 },
    summaryPartial: false,
    passRate: 100,
    progress: { current: 1, total: 1, percentage: 100 },
    logs: [],
    results: {
      'tests/a.spec.ts::caso': { id: 'tests/a.spec.ts::caso', status: 'passed' },
    },
    running: false,
  }),
}))

vi.mock('./components/last-run-card', () => ({
  LastRunCard: ({ reportsEnabled }: { reportsEnabled: boolean }) => (
    <div>reports: {String(reportsEnabled)}</div>
  ),
}))

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

describe('ExecutionDashboard', () => {
  it('conserva consola y resultados cuando el módulo reports está deshabilitado', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    render(
      <QueryClientProvider client={queryClient}>
        <ExecutionDashboard />
      </QueryClientProvider>
    )

    expect(await screen.findByText('reports: false')).toBeTruthy()
    expect(screen.getByText('Consola de ejecución')).toBeTruthy()
    expect(screen.getByText('Resultados por test')).toBeTruthy()
    expect(screen.getByText('caso')).toBeTruthy()
  })
})
