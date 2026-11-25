import type { ReactNode } from 'react'
import type { TestTree } from '@/types/contract'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MotionConfig } from 'motion/react'
import { describe, expect, it, vi } from 'vitest'
import { TestExplorer } from './test-explorer'

vi.mock('./test-file-dialog', () => ({
  TestFileDialog: ({ file }: { file: string | null }) =>
    file ? <div data-testid='file-dialog'>{file}</div> : null,
}))

const tree: TestTree = {
  total: 3,
  projects: ['chromium'],
  files: {
    'tests/a.spec.ts': ['tests/a.spec.ts::uno', 'tests/a.spec.ts::dos'],
    'tests/b.spec.ts': ['tests/b.spec.ts::tres'],
  },
}

type Props = React.ComponentProps<typeof TestExplorer>

function withSkippedAnimations(node: ReactNode) {
  return <MotionConfig skipAnimations>{node}</MotionConfig>
}

function renderExplorer(overrides: Partial<Props> = {}) {
  const props: Props = {
    tree,
    loading: false,
    error: null,
    selected: [],
    onToggleTest: vi.fn(),
    onToggleFile: vi.fn(),
    onClear: vi.fn(),
    onRefresh: vi.fn(),
    projectConfigured: true,
    ...overrides,
  }
  return {
    props,
    ...render(withSkippedAnimations(<TestExplorer {...props} />)),
  }
}

describe('TestExplorer', () => {
  it('alterna entre error, carga y contenido con el estado final visible', () => {
    const first = renderExplorer({ error: 'boom' })
    expect(screen.getByText('No se pudo cargar el catálogo')).toBeTruthy()
    expect(screen.getByText('boom')).toBeTruthy()
    first.unmount()

    renderExplorer({ tree: undefined, loading: true })
    expect(screen.getByText('Cargando catálogo de tests…')).toBeTruthy()
    cleanup()

    renderExplorer()
    expect(screen.getByText('tests/a.spec.ts')).toBeTruthy()
    expect(screen.getByText('uno')).toBeTruthy()
    expect(screen.queryByText('boom')).toBeNull()
  })

  it('filtra la lista existente sin perder el contenido final', () => {
    renderExplorer()
    const search = screen.getByPlaceholderText('Buscar test o archivo…')

    fireEvent.change(search, { target: { value: 'tres' } })
    expect(screen.getByText('tres')).toBeTruthy()
    expect(screen.queryByText('uno')).toBeNull()

    fireEvent.change(search, { target: { value: '' } })
    expect(screen.getByText('uno')).toBeTruthy()
    expect(screen.getByText('3 tests visibles · 2 archivos')).toBeTruthy()
  })

  it('muestra el total y el contador de selección en su valor final', () => {
    const first = renderExplorer({ selected: ['tests/a.spec.ts::uno'] })
    expect(screen.getByText('3')).toBeTruthy()
    expect(
      screen.getByText('seleccionados').parentElement?.textContent
    ).toContain('1')
    first.unmount()

    renderExplorer()
    expect(screen.getByText(/Sin selección/)).toBeTruthy()
    expect(screen.queryByText('seleccionados')).toBeNull()
  })
})
