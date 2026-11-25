import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { TestTree } from '@/types/contract'
import { render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { RunControls } from './run-controls'

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
})

vi.mock('@/lib/api', () => ({
  envApi: { files: vi.fn().mockResolvedValue({ files: [] }) },
  profilesApi: { list: vi.fn().mockResolvedValue({}) },
}))

vi.mock('@/stores/profileStore', () => ({
  useProfileStore: (
    selector: (state: { activeProfileId: string | null }) => unknown
  ) => selector({ activeProfileId: 'profile-1' }),
}))

const tree: TestTree = { total: 2, projects: [], files: {} }

type Props = React.ComponentProps<typeof RunControls>

function renderControls(overrides: Partial<Props> = {}) {
  const props: Props = {
    tree,
    selected: [],
    running: false,
    runPending: false,
    abortPending: false,
    onRun: vi.fn(),
    onAbort: vi.fn(),
    parseParams: vi.fn(() => ({})),
    ...overrides,
  }
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return {
    props,
    ...render(
      <QueryClientProvider client={queryClient}>
        <RunControls {...props} />
      </QueryClientProvider>
    ),
  }
}

describe('RunControls', () => {
  it('muestra el número final de tests seleccionados y el estado de inicio', () => {
    const { rerender, props } = renderControls({
      selected: ['tests/a.spec.ts::uno', 'tests/b.spec.ts::dos'],
    })
    expect(
      screen.getByRole('button', { name: 'Ejecutar 2 tests' })
    ).toBeTruthy()

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <RunControls {...props} runPending={true} />
      </QueryClientProvider>
    )
    expect(screen.getByRole('button', { name: 'Iniciando…' })).toBeTruthy()
  })

  it('conserva el estado deshabilitado de abortar y su texto de acción', () => {
    const { rerender, props } = renderControls()
    const abort = screen.getByRole('button', { name: 'Abortar' })
    expect(abort.hasAttribute('disabled')).toBe(true)

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <RunControls {...props} running={true} abortPending={true} />
      </QueryClientProvider>
    )
    expect(
      screen
        .getByRole('button', { name: 'Abortando…' })
        .hasAttribute('disabled')
    ).toBe(true)
  })

  it('alterna la pista de selección sin dejar nodos en salida', () => {
    const { rerender, props } = renderControls()
    expect(
      screen.getByText('Selecciona al menos un test en el catálogo.')
    ).toBeTruthy()

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <RunControls {...props} selected={['tests/a.spec.ts::uno']} />
      </QueryClientProvider>
    )
    expect(
      screen.queryByText('Selecciona al menos un test en el catálogo.')
    ).toBeNull()
    expect(screen.getByRole('button', { name: 'Ejecutar 1 test' })).toBeTruthy()
  })
})
