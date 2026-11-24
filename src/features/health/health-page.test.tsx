import type { ReactNode } from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { HealthDetail, HealthHistoryPoint } from '@/types/contract'
import { HealthChartTooltip } from './health-charts'
import { HealthPage } from './health-page'

const health = vi.hoisted(() => ({
  state: {
    status: 'ok' as string,
    failedChecks: [] as string[],
    data: undefined as HealthDetail | undefined,
    isError: false,
    isLoading: false,
    isFetching: false,
    dataUpdatedAt: 0 as number,
    history: [] as HealthHistoryPoint[],
    healthPercentage: 0 as number,
  },
  refresh: vi.fn(),
}))

vi.mock('@/hooks/use-health', () => ({
  useHealth: () => ({ ...health.state, refresh: health.refresh }),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@/components/layout/header-tools', () => ({
  HeaderTools: () => <div data-testid='header-tools' />,
}))

vi.mock('@/components/layout/header', () => ({
  Header: ({ children }: { children: ReactNode }) => <header>{children}</header>,
}))

vi.mock('@/components/layout/main', () => ({
  Main: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}))

const okData: HealthDetail = {
  status: 'ok',
  uptimeSeconds: 65,
  checks: {
    critical: [
      { id: 'profiles', status: 'ok' },
      { id: 'reports', status: 'ok' },
      { id: 'evidenceGallery', status: 'not_configured', message: 'No configurado' },
    ],
    informational: [
      { id: 'profile', status: 'ok' },
      { id: 'projectPath', status: 'ok' },
      { id: 'playwrightKit', status: 'ok' },
      { id: 'scheduler', status: 'ok' },
      { id: 'socket', status: 'ok' },
      { id: 'dockerGrid', status: 'not_configured', message: 'Grid no configurado' },
    ],
  },
  failedChecks: [],
}

const degradedData: HealthDetail = {
  ...okData,
  status: 'degraded',
  checks: {
    ...okData.checks,
    informational: okData.checks.informational.map((item) =>
      item.id === 'playwrightKit'
        ? { id: item.id, status: 'degraded' as const, message: 'Kit Playwright no detectado' }
        : item
    ),
  },
  failedChecks: ['playwrightKit'],
}

describe('HealthPage', () => {
  beforeEach(() => {
    health.state = {
      status: 'ok',
      failedChecks: [],
      data: okData,
      isError: false,
      isLoading: false,
      isFetching: false,
      dataUpdatedAt: 0,
      history: [],
      healthPercentage: 0,
    }
    health.refresh.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('muestra estado, uptime, iconos, badges y ambos grupos de checks', () => {
    render(<HealthPage />)

    expect(screen.getByLabelText('Estado del backend: OK')).toBeTruthy()
    expect(screen.getByText('1 min 5 s')).toBeTruthy()
    expect(screen.getByText('Ninguno')).toBeTruthy()
    expect(screen.getByText('Galería de evidencias')).toBeTruthy()
    expect(screen.getAllByText('Sin configurar').length).toBeGreaterThan(0)
    expect(screen.getByText('Checks críticos')).toBeTruthy()
    expect(screen.getByText('Checks informativos')).toBeTruthy()
    expect(screen.getByTestId('header-tools')).toBeTruthy()

    expect(screen.getByTestId('check-icon-profiles')).toBeTruthy()
    expect(screen.getByTestId('check-icon-reports')).toBeTruthy()
    expect(screen.getByTestId('check-icon-evidenceGallery')).toBeTruthy()
    expect(
      screen.getByLabelText('Estado de Galería de evidencias: Sin configurar')
    ).toBeTruthy()
    expect(
      screen.getByLabelText('Estado de Perfiles: OK').className
    ).toContain('emerald')

    fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }))
    expect(health.refresh).toHaveBeenCalledTimes(1)
  })

  it('resalta los checks fallidos degradados con badge rojo', () => {
    health.state = {
      ...health.state,
      status: 'degraded',
      failedChecks: degradedData.failedChecks,
      data: degradedData,
    }

    render(<HealthPage />)

    expect(screen.getByLabelText('Estado del backend: Degradado')).toBeTruthy()
    expect(screen.getByText('playwrightKit')).toBeTruthy()
    expect(screen.getAllByText('Degradado').length).toBeGreaterThan(1)
    expect(
      screen.getByLabelText('Estado de Kit Playwright: Degradado').className
    ).toContain('destructive')

    const failed = screen.getByTestId('check-playwrightKit')
    fireEvent.click(within(failed).getByRole('button', { name: 'Ver detalle' }))
    expect(within(failed).getByText('Kit Playwright no detectado')).toBeTruthy()
  })

  it('explica la desconexión sin bloquear la vista', () => {
    health.state = {
      status: 'offline',
      failedChecks: [],
      data: undefined,
      isError: true,
      isLoading: false,
      isFetching: false,
      dataUpdatedAt: 0,
      history: [],
      healthPercentage: 0,
    }

    render(<HealthPage />)

    expect(screen.getByLabelText('Estado del backend: Sin conexión')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain('No se pudo consultar el backend')
    expect(screen.getAllByText('Sin datos disponibles. Reintenta para consultar el estado.')).toHaveLength(2)
    expect(screen.getByText('Salud del backend')).toBeTruthy()
    expect(screen.getByTestId('health-sparkline-empty')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }))
    expect(health.refresh).toHaveBeenCalledTimes(1)
  })

  it('dibuja tendencia y gauge con el historial ya recibido', () => {
    health.state.history = [
      { at: 1, uptimeSeconds: 10, okPercentage: 50 },
      { at: 2, uptimeSeconds: 70, okPercentage: 100 },
    ]
    health.state.healthPercentage = 100

    render(<HealthPage />)

    expect(screen.getByTestId('health-sparkline')).toBeTruthy()
    expect(screen.queryByTestId('health-sparkline-empty')).toBeNull()
    expect(screen.getByTestId('health-gauge')).toBeTruthy()
    expect(
      screen.getByLabelText('Salud general: 100 % de checks correctos')
    ).toBeTruthy()
    expect(screen.getByTestId('health-gauge').textContent).toContain('100%')
  })

  it('muestra cuenta regresiva y pulso solo durante el refresco', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    health.state.dataUpdatedAt = Date.now()

    const { rerender } = render(<HealthPage />)
    expect(screen.getByTestId('health-countdown').getAttribute('aria-label')).toContain(
      '30 segundos'
    )
    expect(screen.queryByTestId('health-refresh-pulse')).toBeNull()

    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.getByTestId('health-countdown').getAttribute('aria-label')).toContain(
      '27 segundos'
    )

    health.state.isFetching = true
    rerender(<HealthPage />)
    expect(screen.getByTestId('health-refresh-pulse')).toBeTruthy()

    health.state.isFetching = false
    health.state.dataUpdatedAt = Date.now()
    rerender(<HealthPage />)
    expect(screen.queryByTestId('health-refresh-pulse')).toBeNull()
    expect(screen.getByTestId('health-countdown').getAttribute('aria-label')).toContain(
      '30 segundos'
    )
  })

  it('ofrece Configurar ahora solo en checks sin configurar', () => {
    render(<HealthPage />)

    const links = screen.getAllByRole('link', { name: /Configurar ahora/ })
    expect(links).toHaveLength(2)
    links.forEach((link) => expect(link.getAttribute('href')).toBe('/settings'))
    expect(
      within(screen.getByTestId('check-profiles')).queryByRole('link', {
        name: /Configurar ahora/,
      })
    ).toBeNull()
  })

  it('muestra el tiempo relativo del último sondeo por check', () => {
    health.state.dataUpdatedAt = Date.now() - 5000

    render(<HealthPage />)

    expect(screen.getAllByText('Hace 5 s').length).toBeGreaterThan(1)
  })

  it('muestra un skeleton mientras llegan los datos del gráfico', () => {
    health.state.isLoading = true
    health.state.history = []

    render(<HealthPage />)

    expect(screen.getByTestId('health-sparkline-skeleton')).toBeTruthy()
    expect(screen.queryByTestId('health-sparkline-empty')).toBeNull()
    expect(screen.queryByTestId('health-sparkline')).toBeNull()
  })

  it('mantiene el skeleton con una sola muestra en caché', () => {
    health.state.history = [
      { at: Date.now(), uptimeSeconds: 10, okPercentage: 100 },
    ]

    render(<HealthPage />)

    expect(screen.getByTestId('health-sparkline-skeleton')).toBeTruthy()
    expect(screen.queryByTestId('health-sparkline-empty')).toBeNull()
  })

  it('muestra la hora exacta de la última actualización junto al indicador', () => {
    health.state.dataUpdatedAt = new Date(2026, 0, 1, 10, 41, 0).getTime()

    render(<HealthPage />)

    expect(screen.getByTestId('health-gauge')).toBeTruthy()
    expect(screen.getByTestId('health-last-updated').textContent).toContain(
      'Actualizado: 10:41 AM'
    )
  })

  it('el tooltip del gráfico muestra el uptime y la hora del punto', () => {
    render(
      <HealthChartTooltip
        active
        payload={[{ payload: { at: new Date(2026, 0, 1, 10, 41, 0).getTime(), uptime: 65 } }]}
      />
    )

    const tooltip = screen.getByTestId('health-chart-tooltip')
    expect(tooltip.textContent).toContain('1 min 5 s')
    expect(tooltip.textContent).toContain('10:41 AM')
  })

  it('la barra circular avanza con la cuenta regresiva del sondeo', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    health.state.dataUpdatedAt = Date.now()

    render(<HealthPage />)
    const offset = () =>
      Number(
        screen
          .getByTestId('health-poll-ring')
          .querySelectorAll('circle')[1]
          .getAttribute('stroke-dashoffset')
      )
    const initial = offset()
    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    expect(offset()).toBeLessThan(initial)
  })

  it('no revela stack traces, rutas ni valores de entorno en el detalle', () => {
    health.state.data = {
      ...okData,
      checks: {
        critical: [
          {
            id: 'reports',
            status: 'unhealthy',
            message:
              'Error: ENOENT\n    at /home/potlitel/app/routes/health.js:42:11 TOKEN=abc123 process.env.SECRET_KEY=xyz',
          },
          ...okData.checks.critical.filter((check) => check.id !== 'reports'),
        ],
        informational: okData.checks.informational,
      },
    }

    render(<HealthPage />)

    const item = screen.getByTestId('check-reports')
    fireEvent.click(within(item).getByRole('button', { name: 'Ver detalle' }))
    const detail = screen.getByTestId('check-detail-reports').textContent ?? ''

    expect(detail).not.toContain('/home/')
    expect(detail).not.toContain('health.js')
    expect(detail).not.toContain('TOKEN')
    expect(detail).not.toContain('SECRET_KEY')
    expect(detail).not.toContain('Error:')
    expect(detail.length).toBeGreaterThan(0)
  })
})
