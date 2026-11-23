import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProjectContextCard } from './project-context-card'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  configApi: { get: mocks.get },
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children }: { to: string; children: ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}))

function renderCard(options = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ProjectContextCard profileId='profile-1' compact {...options} />
    </QueryClientProvider>
  )
}

describe('ProjectContextCard (compact)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.get.mockResolvedValue({
      projectPath: '/proyectos/qa',
      playwrightCmd: 'npx playwright test',
      projectFeatures: { mcp: { detected: true, signals: ['@playwright/mcp'] } },
    })
  })

  it('muestra proyecto, MCP, entorno y opciones guardadas de la corrida', async () => {
    renderCard({
      lastRunOptions: {
        envFile: 'staging.env',
        useDocker: true,
        workers: 4,
        grep: 'checkout',
        paramsCount: 2,
      },
    })

    expect(await screen.findByText('/proyectos/qa')).toBeTruthy()
    expect(screen.getByText('MCP detectado')).toBeTruthy()
    expect(screen.getByText('staging.env')).toBeTruthy()
    expect(screen.getByText('checkout')).toBeTruthy()
    expect(screen.getByText('4')).toBeTruthy()
    expect(screen.getByText('2')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Ir a Tests' }).getAttribute('href')).toBe('/tests')
  })

  it('omite datos desconocidos en corridas heredadas', async () => {
    renderCard()

    expect(await screen.findByText('/proyectos/qa')).toBeTruthy()
    expect(screen.getAllByText('No registrado').length).toBeGreaterThan(0)
    expect(screen.getByText('No registrado en esta corrida')).toBeTruthy()
  })

  it('ofrece reintento y acceso a Ajustes cuando falla la configuración', async () => {
    mocks.get.mockRejectedValue(new Error('Config no disponible'))
    renderCard()

    expect(await screen.findByText('Config no disponible')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Ir a Ajustes' }).getAttribute('href')).toBe('/settings')

    mocks.get.mockResolvedValue({ projectPath: '/proyectos/qa' })
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    await waitFor(() => expect(screen.queryByText('Config no disponible')).toBeNull())
  })
})
