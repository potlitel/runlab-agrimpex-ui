import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { ExecutionDashboard } from './dashboard'

const mocks = vi.hoisted(() => ({
  configGet: vi.fn(),
  execution: {} as Record<string, unknown>,
}))

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
  configApi: { get: mocks.configGet },
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
  useExecution: () => mocks.execution,
}))

vi.mock('./components/last-run-card', () => ({
  LastRunCard: ({ reportsEnabled }: { reportsEnabled: boolean }) => (
    <div>reports: {String(reportsEnabled)}</div>
  ),
}))

const completedExecution = {
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
}

const emptyExecution = {
  ...completedExecution,
  reportId: null,
  reportTimestamp: null,
  lastRunStatus: null,
  summary: null,
  summaryPartial: false,
  passRate: 0,
  progress: { current: 0, total: 0, percentage: 0 },
  logs: [],
  results: {},
  running: false,
}

const runningExecution = {
  ...emptyExecution,
  running: true,
  progress: { current: 1, total: 3, percentage: 33 },
}

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ExecutionDashboard />
    </QueryClientProvider>
  )
}

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

beforeEach(() => {
  mocks.configGet.mockReset()
  mocks.configGet.mockResolvedValue({
    projectPath: '/proyectos/qa',
    playwrightCmd: 'npx playwright test',
  })
  mocks.execution = { ...completedExecution }
})

describe('ExecutionDashboard', () => {
  it('conserva consola y resultados cuando el módulo reports está deshabilitado', async () => {
    renderDashboard()

    expect(await screen.findByText('reports: false')).toBeTruthy()
    expect(screen.getByText('Consola de ejecución')).toBeTruthy()
    expect(screen.getByText('Resultados por test')).toBeTruthy()
    expect(screen.getByText('caso')).toBeTruthy()
  })

  it('muestra estados vacíos accionables cuando el perfil no está configurado', async () => {
    mocks.configGet.mockResolvedValue({ projectPath: '' })
    mocks.execution = { ...emptyExecution }
    renderDashboard()

    expect(await screen.findByRole('link', { name: 'Configurar Proyecto' })).toBeTruthy()
    expect(screen.getAllByRole('link', { name: 'Iniciar Corrida' }).length).toBeGreaterThan(0)
    expect(
      screen.getByText('Sin actividad reciente. Inicia una corrida para ver el progreso.')
    ).toBeTruthy()
    expect(screen.getByText(/Aún no hay resultados\. Los tests aparecerán/)).toBeTruthy()
    expect(screen.getByRole('log', { name: 'Salida de la ejecución' })).toBeTruthy()
  })

  it('mantiene la consola anunciable durante una corrida en curso', async () => {
    mocks.execution = { ...runningExecution }
    renderDashboard()

    expect(await screen.findByText('reports: false')).toBeTruthy()
    expect(screen.getByText('Esperando eventos de ejecución…')).toBeTruthy()
    expect(screen.getAllByText('En ejecución').length).toBeGreaterThan(0)
    const log = screen.getByRole('log', { name: 'Salida de la ejecución' })
    expect(log.getAttribute('aria-live')).toBe('polite')
    expect(
      screen.getByRole('progressbar', { name: 'Progreso de la ejecución' }).getAttribute('aria-valuenow')
    ).toBe('33')
  })
})
