import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TestsPage } from './tests-page'

const mocks = vi.hoisted(() => ({
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

vi.mock('@/components/layout/header', () => ({
  Header: ({ children }: { children: ReactNode }) => (
    <header>{children}</header>
  ),
}))
vi.mock('@/components/layout/header-tools', () => ({
  HeaderTools: () => <div />,
}))
vi.mock('@/components/profile-header-badge', () => ({
  ProfileHeaderBadge: () => <div />,
}))
vi.mock('@/components/layout/main', () => ({
  Main: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}))

vi.mock('./use-execution', () => ({
  useExecution: () => mocks.execution,
}))

vi.mock('./components/project-context', () => ({
  useProjectConfig: () => ({ data: undefined }),
  contextFrom: () => ({ configured: false }),
}))

vi.mock('./components/project-context-card', () => ({
  ProjectContextCard: () => <div>Contexto de proyecto</div>,
}))
vi.mock('./components/test-explorer', () => ({
  TestExplorer: () => <div>Explorador de tests</div>,
}))
vi.mock('./components/run-controls', () => ({
  RunControls: () => <div>Controles de corrida</div>,
}))
vi.mock('./components/execution-console', () => ({
  ExecutionConsole: () => <div>Consola de ejecución</div>,
}))
vi.mock('./components/results-table', () => ({
  ResultsTable: () => <div>Resultados por test</div>,
}))
vi.mock('./components/test-file-dialog', () => ({
  TestFileDialog: () => null,
}))

const baseExecution = {
  tree: undefined,
  loading: false,
  error: null,
  selected: [],
  running: false,
  runPending: false,
  abortPending: false,
  logs: [],
  progress: { current: 0, total: 0, percentage: 0 },
  summary: null,
  summaryPartial: false,
  passRate: 0,
  results: {},
  reportId: null,
  toggleTest: vi.fn(),
  toggleFile: vi.fn(),
  clearSelection: vi.fn(),
  refresh: vi.fn(),
  run: vi.fn(),
  abort: vi.fn(),
  parseParams: vi.fn(() => ({})),
  clearLogs: vi.fn(),
}

beforeEach(() => {
  mocks.execution = { ...baseExecution }
})

describe('TestsPage', () => {
  it('mantiene visibles las secciones tras la entrada escalonada', () => {
    render(<TestsPage />)

    expect(screen.getByText('Contexto de proyecto')).toBeTruthy()
    expect(screen.getByText('Explorador de tests')).toBeTruthy()
    expect(screen.getByText('Controles de corrida')).toBeTruthy()
    expect(screen.getByText('Consola de ejecución')).toBeTruthy()
    expect(screen.getByText('Resultados por test')).toBeTruthy()
  })

  it('muestra el badge de ejecución solo mientras la corrida está en curso', () => {
    mocks.execution = { ...baseExecution, running: true }
    const { unmount } = render(<TestsPage />)
    expect(screen.getByText('En ejecución')).toBeTruthy()
    unmount()

    mocks.execution = { ...baseExecution, running: false }
    render(<TestsPage />)
    expect(screen.queryByText('En ejecución')).toBeNull()
  })
})
