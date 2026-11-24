import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LastRunCard, type LastRunCardProps } from './last-run-card'

const mocks = vi.hoisted(() => ({
  exportRunPdf: vi.fn().mockResolvedValue(undefined),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children }: { to: string; children: ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}))

vi.mock('@/lib/api', () => ({
  reportsApi: {
    get: vi.fn().mockResolvedValue({ id: 'report-1', summary: {}, tests: [] }),
    downloadJsonUrl: (id: string) => `/api/reports/${id}/json`,
    downloadHtmlUrl: (id: string) => `/api/reports/${id}/html`,
  },
}))

vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}))

vi.mock('@/features/reports/components/report-detail-sheet', () => ({
  ReportDetailSheet: ({
    open,
    report,
  }: {
    open: boolean
    report: { id: string } | null
  }) => (open ? <div data-testid='report-sheet'>{report?.id}</div> : null),
}))

vi.mock('@/features/reports/pdf/export-reports', () => ({
  exportRunPdf: mocks.exportRunPdf,
}))

const baseProps: LastRunCardProps = {
  reportId: 'report-1',
  timestamp: '2026-11-23T10:00:00.000Z',
  summary: {
    total: 4,
    passed: 3,
    failed: 1,
    errors: 0,
    skipped: 0,
    duration: 8.4,
  },
  progress: { current: 4, total: 4, percentage: 100 },
  status: 'completed',
  reportsEnabled: true,
}

function renderCard(props: Partial<LastRunCardProps> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <LastRunCard {...baseProps} {...props} />
    </QueryClientProvider>
  )
}

describe('LastRunCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra estado vacío con acceso a Tests cuando no hay reporte', () => {
    renderCard({ reportId: null, status: null, summary: null })

    expect(
      screen.getByText(/Todavía no hay una corrida finalizada/)
    ).toBeTruthy()
    const startRun = screen.getByRole('link', { name: 'Iniciar Corrida' })
    expect(startRun.getAttribute('href')).toBe('/tests')
    expect(startRun.querySelector('svg')).not.toBeNull()
    expect(screen.getByText('Fecha')).toBeTruthy()
    expect(screen.getByText('Duración')).toBeTruthy()
    expect(screen.getByText('Tasa de éxito')).toBeTruthy()
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBe(3)
    expect(screen.queryByText('Exportar PDF')).toBeNull()
  })

  it('muestra la corrida completada y conecta las acciones con el reporte correcto', async () => {
    renderCard()

    expect(screen.getByText('Completada')).toBeTruthy()
    expect(screen.getByText('8.4s')).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'JSON' }).getAttribute('href')
    ).toBe('/api/reports/report-1/json')
    expect(
      screen.getByRole('link', { name: 'HTML' }).getAttribute('href')
    ).toBe('/api/reports/report-1/html')

    fireEvent.click(screen.getByRole('button', { name: 'Ver reporte' }))
    expect(screen.getByTestId('report-sheet').textContent).toBe('report-1')

    fireEvent.click(screen.getByRole('button', { name: 'Exportar PDF' }))
    await waitFor(() => {
      expect(mocks.exportRunPdf).toHaveBeenCalledWith(
        expect.objectContaining({ reportId: 'report-1' })
      )
    })
  })

  it('preserva el progreso alcanzado en una corrida abortada', () => {
    renderCard({
      status: 'aborted',
      progress: { current: 1, total: 2, percentage: 50 },
      summary: { total: 2, passed: 1, failed: 0 },
    })

    expect(screen.getByText('Abortada')).toBeTruthy()
    expect(screen.getByText(/1\/2 \(50%\)/)).toBeTruthy()
  })

  it('deshabilita las acciones y explica el estado cuando reports está inactivo', () => {
    renderCard({ reportsEnabled: false })

    expect(screen.getByText(/no está disponible para este perfil/)).toBeTruthy()
    expect(
      screen.getByRole('link', { name: /Revisar módulos en Ajustes/ })
    ).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Exportar PDF' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Ver reporte' })).toBeNull()
  })
})
