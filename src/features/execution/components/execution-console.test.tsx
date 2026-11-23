import { fireEvent, render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { ExecutionConsole } from './execution-console'

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

describe('ExecutionConsole', () => {
  it('muestra errores, omitidos, duración, tasa de éxito y aviso de resumen parcial', () => {
    render(
      <ExecutionConsole
        logs={[]}
        progress={{ current: 6, total: 6, percentage: 100 }}
        running={false}
        summary={{
          total: 6,
          passed: 4,
          failed: 1,
          errors: 1,
          skipped: 2,
          duration: 12.5,
        }}
        summaryPartial
        passRate={67}
      />
    )

    expect(screen.getByText('Errores')).toBeTruthy()
    expect(screen.getByText('Omitidos')).toBeTruthy()
    expect(screen.getByText('Tasa de éxito')).toBeTruthy()
    expect(screen.getByText('67%')).toBeTruthy()
    expect(screen.getByText('12.5s')).toBeTruthy()
    expect(screen.getByText('Resumen parcial')).toBeTruthy()
  })

  it('no muestra cifras de éxito sin resumen final', () => {
    render(
      <ExecutionConsole
        logs={[]}
        progress={{ current: 2, total: 6, percentage: 33 }}
        running
        summary={null}
      />
    )

    expect(screen.queryByText('Tasa de éxito')).toBeNull()
    expect(screen.queryByText('Resumen parcial')).toBeNull()
    expect(screen.getByText('Esperando eventos de ejecución…')).toBeTruthy()
  })

  it('expone la región de log, el progreso accesible y una acción Limpiar que no toca resultados', () => {
    const onClear = vi.fn()
    render(
      <ExecutionConsole
        logs={[{ id: '1', at: '2026-11-23T10:00:00.000Z', kind: 'info', text: 'evento reciente' }]}
        progress={{ current: 2, total: 4, percentage: 50 }}
        running
        summary={null}
        onClear={onClear}
      />
    )

    const log = screen.getByRole('log', { name: 'Salida de la ejecución' })
    expect(log.getAttribute('aria-live')).toBe('polite')
    expect(screen.getByText('evento reciente')).toBeTruthy()

    const progress = screen.getByRole('progressbar', { name: 'Progreso de la ejecución' })
    expect(progress.getAttribute('aria-valuenow')).toBe('50')
    expect(progress.getAttribute('aria-valuetext')).toBe('2 de 4 tests, 50%')

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }))
    expect(onClear).toHaveBeenCalledOnce()
  })

  it('muestra error de catálogo con reintento y estado de carga', () => {
    const onRetry = vi.fn()
    render(
      <ExecutionConsole
        logs={[]}
        progress={{ current: 0, total: 0, percentage: 0 }}
        running={false}
        summary={null}
        loading
        error='No se pudo cargar el catálogo'
        onRetry={onRetry}
      />
    )

    expect(screen.getByText('No se pudo cargar el catálogo')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onRetry).toHaveBeenCalledOnce()
    expect(screen.getByLabelText('Cargando catálogo')).toBeTruthy()
  })
})
