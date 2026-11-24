import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HealthPage } from './health-page'

const health = vi.hoisted(() => ({
  state: {
    status: 'ok' as string,
    failedChecks: [] as string[],
    data: undefined as
      | {
          status: string
          uptimeSeconds: number
          checks: {
            critical: { id: string; status: string; message?: string }[]
            informational: { id: string; status: string; message?: string }[]
          }
          failedChecks: string[]
        }
      | undefined,
    isError: false,
  },
  refresh: vi.fn(),
}))

vi.mock('@/hooks/use-health', () => ({
  useHealth: () => ({ ...health.state, refresh: health.refresh }),
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

const okData = {
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

const degradedData = {
  ...okData,
  status: 'degraded',
  checks: {
    ...okData.checks,
    informational: okData.checks.informational.map((item) =>
      item.id === 'playwrightKit'
        ? { id: item.id, status: 'degraded', message: 'Kit Playwright no detectado' }
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
    }
    health.refresh.mockReset()
  })

  it('muestra estado, uptime y ambos grupos de checks', () => {
    render(<HealthPage />)

    expect(screen.getByLabelText('Estado del backend: OK')).toBeTruthy()
    expect(screen.getByText('1 min 5 s')).toBeTruthy()
    expect(screen.getByText('Ninguno')).toBeTruthy()
    expect(screen.getByText('Galería de evidencias')).toBeTruthy()
    expect(screen.getAllByText('Sin configurar').length).toBeGreaterThan(0)
    expect(screen.getByText('Checks críticos')).toBeTruthy()
    expect(screen.getByText('Checks informativos')).toBeTruthy()
    expect(screen.getByTestId('header-tools')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }))
    expect(health.refresh).toHaveBeenCalledTimes(1)
  })

  it('resalta los checks fallidos degradados', () => {
    health.state = {
      status: 'degraded',
      failedChecks: degradedData.failedChecks,
      data: degradedData,
      isError: false,
    }

    render(<HealthPage />)

    expect(screen.getByLabelText('Estado del backend: Degradado')).toBeTruthy()
    expect(screen.getByText('playwrightKit')).toBeTruthy()
    expect(screen.getByText('Kit Playwright no detectado')).toBeTruthy()
    expect(screen.getAllByText('Degradado').length).toBeGreaterThan(1)

    fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }))
    expect(health.refresh).toHaveBeenCalledTimes(1)
  })

  it('explica la desconexión sin bloquear la vista', () => {
    health.state = {
      status: 'offline',
      failedChecks: [],
      data: undefined,
      isError: true,
    }

    render(<HealthPage />)

    expect(screen.getByLabelText('Estado del backend: Sin conexión')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain('No se pudo consultar el backend')
    expect(screen.getAllByText('Sin datos disponibles. Reintenta para consultar el estado.')).toHaveLength(2)
    expect(screen.getByText('Salud del backend')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }))
    expect(health.refresh).toHaveBeenCalledTimes(1)
  })
})
