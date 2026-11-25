import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { ExecutionConsole } from './execution-console'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children }: { to: string; children: ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}))

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
    expect(screen.getByText('Consola en espera')).toBeTruthy()
    expect(
      screen.getByText(
        'Sin actividad reciente. Inicia una corrida para ver el progreso.'
      )
    ).toBeTruthy()
    const startRun = screen.getByRole('link', { name: 'Iniciar Corrida' })
    expect(startRun.getAttribute('href')).toBe('/tests')
    expect(startRun.querySelector('svg')).not.toBeNull()
    expect(startRun.parentElement?.className).toContain('text-foreground')
    const log = screen.getByRole('log', { name: 'Salida de la ejecución' })
    expect(log.getAttribute('aria-live')).toBe('polite')
    expect(log.className).toContain('bg-zinc-950')
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
        logs={[
          {
            id: '1',
            at: '2026-11-23T10:00:00.000Z',
            kind: 'info',
            text: 'evento reciente',
          },
        ]}
        progress={{ current: 2, total: 4, percentage: 50 }}
        running
        summary={null}
        onClear={onClear}
      />
    )

    const log = screen.getByRole('log', { name: 'Salida de la ejecución' })
    expect(log.getAttribute('aria-live')).toBe('polite')
    expect(screen.getByText('evento reciente')).toBeTruthy()

    const progress = screen.getByRole('progressbar', {
      name: 'Progreso de la ejecución',
    })
    expect(progress.getAttribute('aria-valuenow')).toBe('50')
    expect(progress.getAttribute('aria-valuetext')).toBe('2 de 4 tests, 50%')

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }))
    expect(onClear).toHaveBeenCalledOnce()
  })

  it('retira las líneas de log de inmediato al limpiar el buffer', () => {
    const props = {
      running: true,
      summary: null,
      progress: { current: 1, total: 4, percentage: 25 },
    }
    const { rerender } = render(
      <ExecutionConsole
        {...props}
        logs={[
          {
            id: '1',
            at: '2026-11-23T10:00:00.000Z',
            kind: 'info',
            text: 'evento reciente',
          },
        ]}
      />
    )

    expect(screen.getByText('evento reciente')).toBeTruthy()

    rerender(<ExecutionConsole {...props} logs={[]} />)

    expect(screen.queryByText('evento reciente')).toBeNull()
    expect(screen.getByText('Esperando eventos de ejecución…')).toBeTruthy()
  })

  it('alcanza un hito de progreso sin alterar el valor accesible', () => {
    const props = {
      logs: [],
      running: true,
      summary: null,
    }
    const { rerender } = render(
      <ExecutionConsole
        {...props}
        progress={{ current: 1, total: 4, percentage: 25 }}
      />
    )

    expect(screen.getByText('25%')).toBeTruthy()

    rerender(
      <ExecutionConsole
        {...props}
        progress={{ current: 2, total: 4, percentage: 50 }}
      />
    )

    expect(screen.getByText('50%')).toBeTruthy()
    const progress = screen.getByRole('progressbar', {
      name: 'Progreso de la ejecución',
    })
    expect(progress.getAttribute('aria-valuenow')).toBe('50')
    expect(progress.getAttribute('aria-valuetext')).toBe('2 de 4 tests, 50%')
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
