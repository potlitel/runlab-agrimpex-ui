import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { shouldFlashStatus } from '../results-motion'
import type { ExecutionTestResult } from '../use-execution'
import { ResultsTable } from './results-table'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children }: { to: string; children: ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}))

vi.mock('@/lib/api', () => ({
  reportsApi: {
    assetUrl: (id: string, path: string) => `/assets/${id}/${path}`,
  },
}))

vi.mock('@/features/errors/components/evidence-viewer', () => ({
  EvidenceDialog: ({ item }: { item: { name: string; url: string } | null }) =>
    item ? <div data-testid='evidence-dialog'>{item.name}</div> : null,
}))

function chooseOption(label: string, option: string) {
  const trigger = screen.getByRole('combobox', { name: label })
  fireEvent.keyDown(trigger, { key: 'Enter' })
  fireEvent.click(screen.getByRole('option', { name: option }))
}

function makeResults(count: number): Record<string, ExecutionTestResult> {
  const results: Record<string, ExecutionTestResult> = {}
  for (let index = 0; index < count; index += 1) {
    const file = `tests/${index % 3}.spec.ts`
    results[`${file}::caso-${index}`] = {
      id: `${file}::caso-${index}`,
      status: index === 0 ? 'failed' : index === 1 ? 'error' : 'passed',
      duration: index + 0.5,
      output: `salida completa ${index}`,
    }
  }
  return results
}

describe('ResultsTable', () => {
  it('permite buscar, filtrar, ordenar, agrupar y expandir una corrida extensa', () => {
    const results = makeResults(12)
    render(<ResultsTable results={results} />)

    const search = screen.getByLabelText('Buscar test')
    fireEvent.change(search, { target: { value: 'caso-10' } })
    expect(screen.getByText(/1\/12/)).toBeTruthy()
    expect(screen.getByText('caso-10')).toBeTruthy()

    fireEvent.change(search, { target: { value: '' } })
    chooseOption('Filtrar por estado', 'Fallido')
    expect(screen.getByText(/1\/12/)).toBeTruthy()
    expect(screen.getByText('caso-0')).toBeTruthy()

    chooseOption('Filtrar por estado', 'Todos los estados')
    chooseOption('Ordenar resultados', 'Ordenar: duración')
    expect(
      screen.getByRole('combobox', { name: 'Ordenar resultados' }).textContent
    ).toContain('Ordenar: duración')
    fireEvent.click(screen.getByRole('button', { name: 'Agrupar por archivo' }))
    expect(screen.getByText('tests/0.spec.ts (4)')).toBeTruthy()

    const toggle = screen.getByLabelText(
      'Ver salida completa de tests/0.spec.ts::caso-0'
    )
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(
      screen.getByText('salida completa 0', { selector: 'pre' })
    ).toBeTruthy()
  })

  it('muestra adjuntos, delega la apertura al visor y avisa si falla la miniatura', () => {
    const results: Record<string, ExecutionTestResult> = {
      'tests/a.spec.ts::captura': {
        id: 'tests/a.spec.ts::captura',
        status: 'failed',
        output: 'fallo con captura',
        attachments: [
          {
            name: 'captura.png',
            assetPath: 'shots/captura.png',
            contentType: 'image/png',
          },
          {
            name: 'rota.png',
            assetPath: 'shots/rota.png',
            contentType: 'image/png',
          },
        ],
      },
    }
    render(<ResultsTable results={results} reportId='report-1' />)

    expect(screen.getByText(/Evidencias \(2\)/)).toBeTruthy()
    fireEvent.click(screen.getByTitle('Abrir evidencia captura.png'))
    expect(screen.getByTestId('evidence-dialog').textContent).toBe(
      'captura.png'
    )

    const broken = screen.getByAltText('rota.png')
    fireEvent.error(broken)
    expect(screen.getByText('Sin vista previa')).toBeTruthy()
  })

  it('distingue carga, vacío y error con reintento', () => {
    const { rerender } = render(<ResultsTable results={{}} loading />)
    expect(screen.getByText(/Cargando resultados del catálogo/)).toBeTruthy()
    expect(screen.getByLabelText('Cargando resultados')).toBeTruthy()

    rerender(<ResultsTable results={{}} />)
    expect(screen.getByText(/Aún no hay resultados/)).toBeTruthy()
    const startRun = screen.getByRole('link', { name: 'Iniciar Corrida' })
    expect(startRun.getAttribute('href')).toBe('/tests')
    expect(startRun.querySelector('svg')).not.toBeNull()

    const onRetry = vi.fn()
    rerender(
      <ResultsTable
        results={{
          'tests/a.spec.ts::caso': {
            id: 'tests/a.spec.ts::caso',
            status: 'passed',
          },
        }}
        error='No se pudo actualizar el catálogo'
        onRetry={onRetry}
      />
    )
    expect(screen.getByText('No se pudo actualizar el catálogo')).toBeTruthy()
    expect(screen.getByText('caso')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('ofrece limpiar filtros cuando ningún resultado coincide', () => {
    render(<ResultsTable results={makeResults(3)} />)

    fireEvent.change(screen.getByLabelText('Buscar test'), {
      target: { value: 'inexistente' },
    })
    expect(
      screen.getByText('Sin coincidencias con los filtros actuales')
    ).toBeTruthy()

    const clearFilters = screen.getByRole('button', { name: 'Limpiar filtros' })
    expect(clearFilters.querySelector('svg')).not.toBeNull()
    fireEvent.click(clearFilters)
    expect(
      screen.queryByText('Sin coincidencias con los filtros actuales')
    ).toBeNull()
    expect(screen.getByText('caso-0')).toBeTruthy()
  })

  it('indica explícitamente los resultados sin salida ni adjuntos', () => {
    render(
      <ResultsTable
        results={{
          'tests/a.spec.ts::minimo': {
            id: 'tests/a.spec.ts::minimo',
            status: 'skipped',
          },
        }}
      />
    )

    expect(screen.getByText('Sin salida ni adjuntos')).toBeTruthy()
    expect(screen.queryByText(/Evidencias/)).toBeNull()
  })

  it('marca de entrada solo a la fila nueva, no a las ya visibles', () => {
    const { rerender } = render(<ResultsTable results={makeResults(1)} />)

    expect(
      screen.getByText('caso-0').closest('tr')?.getAttribute('data-entry')
    ).toBe('new')

    rerender(<ResultsTable results={makeResults(2)} />)

    expect(
      screen.getByText('caso-0').closest('tr')?.getAttribute('data-entry')
    ).toBe('known')
    expect(
      screen.getByText('caso-1').closest('tr')?.getAttribute('data-entry')
    ).toBe('new')
  })
})

describe('shouldFlashStatus', () => {
  it('destella una sola vez cuando un test pasa de running a terminal', () => {
    expect(shouldFlashStatus('running', 'passed')).toBe(true)
    expect(shouldFlashStatus('running', 'failed')).toBe(true)
    expect(shouldFlashStatus('running', 'error')).toBe(true)
  })

  it('no destella en la carga inicial ni en filas ya terminales', () => {
    expect(shouldFlashStatus(undefined, 'passed')).toBe(false)
    expect(shouldFlashStatus(undefined, 'failed')).toBe(false)
    expect(shouldFlashStatus('running', 'running')).toBe(false)
    expect(shouldFlashStatus('running', 'skipped')).toBe(false)
    expect(shouldFlashStatus('passed', 'failed')).toBe(false)
    expect(shouldFlashStatus('failed', 'passed')).toBe(false)
    expect(shouldFlashStatus('skipped', 'passed')).toBe(false)
  })
})
