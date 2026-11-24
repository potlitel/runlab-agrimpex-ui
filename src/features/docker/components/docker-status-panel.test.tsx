import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DockerStatusPanel } from './docker-status-panel'

function renderPanel(agentConnection?: 'local' | 'unassigned' | 'online' | 'offline') {
  return render(
    <DockerStatusPanel
      agentConnection={agentConnection}
      check={null}
      checkLoading={false}
      checkError={null}
      status={{ workstationId: 'ws-a' }}
      statusLoading={false}
      statusError={null}
      startingDesktop={false}
      onStartDesktop={vi.fn()}
    />,
  )
}

describe('DockerStatusPanel — estado del agente', () => {
  it('muestra ID del agente y Estado del agente en lugar de Agente/Workstation', () => {
    renderPanel('online')
    expect(screen.getByText('ID del agente')).toBeTruthy()
    expect(screen.getByText('Estado del agente')).toBeTruthy()
    expect(screen.queryByText('Agente')).toBeNull()
  })

  it.each([
    ['online', 'Conectado'],
    ['offline', 'Desconectado'],
    ['unassigned', 'Sin asignar'],
    ['local', 'Modo local'],
  ] as const)('muestra "%s" como "%s"', (connection, label) => {
    renderPanel(connection)
    expect(screen.getByText(label)).toBeTruthy()
  })

  it('por defecto marca Sin asignar', () => {
    renderPanel()
    expect(screen.getByText('Sin asignar')).toBeTruthy()
  })
})
