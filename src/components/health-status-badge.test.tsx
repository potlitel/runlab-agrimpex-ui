import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HealthStatusBadge } from '@/components/health-status-badge'

const health = vi.hoisted(() => ({
  status: 'ok' as string,
  failedChecks: [] as string[],
  refresh: vi.fn(),
}))

vi.mock('@/hooks/use-health', () => ({
  useHealth: () => ({
    status: health.status,
    failedChecks: health.failedChecks,
    refresh: health.refresh,
    data: undefined,
    isLoading: false,
    isError: health.status === 'offline',
  }),
}))

describe('HealthStatusBadge', () => {
  beforeEach(() => {
    health.status = 'ok'
    health.failedChecks = []
    health.refresh.mockReset()
  })

  function renderWithContent() {
    return render(
      <div>
        <span>Vista de pruebas</span>
        <HealthStatusBadge />
      </div>
    )
  }

  it('muestra degraded, lista los checks fallidos y permite reintentar', () => {
    health.status = 'degraded'
    health.failedChecks = ['playwrightKit']

    renderWithContent()

    expect(screen.getByText('Vista de pruebas')).toBeTruthy()
    expect(screen.getByLabelText('Backend Degradado')).toBeTruthy()
    expect(screen.getByText('playwrightKit')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar estado del backend' }))
    expect(health.refresh).toHaveBeenCalledTimes(1)
  })

  it('muestra sin conexión sin vaciar la pantalla y permite reintentar', () => {
    health.status = 'offline'

    renderWithContent()

    expect(screen.getByText('Vista de pruebas')).toBeTruthy()
    expect(screen.getByLabelText('Backend Sin conexión')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar estado del backend' }))
    expect(health.refresh).toHaveBeenCalledTimes(1)
  })

  it('en ok muestra OK sin botón de reintento', () => {
    renderWithContent()

    expect(screen.getByLabelText('Backend OK')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Reintentar estado del backend' })).toBeNull()
  })
})
