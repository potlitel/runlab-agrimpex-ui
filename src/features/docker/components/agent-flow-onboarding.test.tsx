import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AgentFlowOnboarding } from './agent-flow-onboarding'

const agentsMock = vi.fn()
const configMock = vi.fn()

vi.mock('@/lib/api', () => ({
  dockerApi: { agents: () => agentsMock() },
  configApi: { get: () => configMock() },
}))

vi.mock('@/stores/profileStore', () => ({
  useProfileStore: (selector: (state: { activeProfileId: string }) => unknown) =>
    selector({ activeProfileId: 'perfil-1' }),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}))

function renderFlow() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={client}>
      <AgentFlowOnboarding />
    </QueryClientProvider>
  )
}

describe('AgentFlowOnboarding', () => {
  beforeEach(() => {
    agentsMock.mockReset()
    configMock.mockReset().mockResolvedValue({})
  })

  it('cae a la simulación cuando no hay datos reales de agentes', async () => {
    agentsMock.mockRejectedValue(new Error('sin token'))
    renderFlow()

    expect(await screen.findByText('Simulación')).toBeTruthy()
    expect(screen.getByText('Workstation A')).toBeTruthy()
    expect(screen.getByText(/No hay datos reales/)).toBeTruthy()
    expect(screen.getByText(/Cómo el agente ejecuta Docker/)).toBeTruthy()
  })

  it('resalta los agentes conectados y el workstationId asignado al perfil', async () => {
    agentsMock.mockResolvedValue({
      agents: [{ agentId: 'ws-a', label: 'Estación A', connectedAt: '2026-11-24T17:00:00.000Z' }],
      transport: 'agent',
    })
    configMock.mockResolvedValue({ workstationId: 'ws-a' })
    renderFlow()

    expect(await screen.findByText('API · 1 agente(s)')).toBeTruthy()
    expect((await screen.findAllByText('Estación A')).length).toBeGreaterThan(0)
    expect(screen.getByText('perfil activo')).toBeTruthy()
    expect(screen.getAllByText('perfil → ws-a').length).toBeGreaterThan(0)
  })

  it('distingue entre la API sin agentes y la API inaccesible', async () => {
    agentsMock.mockResolvedValue({ agents: [], transport: 'agent' })
    renderFlow()

    expect(await screen.findByText('API · 0 agente(s)')).toBeTruthy()
    expect(screen.getByText(/La API responde, pero no hay agentes registrados/)).toBeTruthy()
  })

  it('permite pausar y reanudar la animación', async () => {
    agentsMock.mockRejectedValue(new Error('sin token'))
    renderFlow()

    fireEvent.click(await screen.findByText('Pausar animación'))
    expect(screen.getByText('Reanudar animación')).toBeTruthy()
    fireEvent.click(screen.getByText('Reanudar animación'))
    expect(screen.getByText('Pausar animación')).toBeTruthy()
  })
})
