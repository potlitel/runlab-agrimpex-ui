import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, type StackConfigResponse } from '@/types/contract'
import { StackConfigSection } from './stack-config-section'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  stackConfigApi: {
    get: mocks.get,
    save: mocks.save,
    restore: mocks.restore,
  },
}))

vi.mock('sonner', () => ({
  toast: { success: mocks.success, error: mocks.error },
}))

const DATA: StackConfigResponse = {
  values: {
    VITE_API_URL: 'http://localhost:3001/api',
    VITE_SOCKET_URL: 'http://localhost:3001',
    API_PORT: '3001',
    RUNLABQA_AGENT_TOKEN: null,
    UPDATE_TOKEN: null,
  },
  secrets: {
    RUNLABQA_AGENT_TOKEN: { configured: true },
    UPDATE_TOKEN: { configured: true },
  },
  pendingApply: [{
    key: 'RUNLABQA_AGENT_TOKEN',
    service: 'runlabqa-api',
    command: 'docker compose up -d --force-recreate runlabqa-api',
  }],
  configVersion: 4,
}

function renderSection() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <StackConfigSection />
    </QueryClientProvider>,
  )
}

describe('StackConfigSection', () => {
  beforeEach(() => {
    sessionStorage.clear()
    mocks.get.mockReset().mockResolvedValue(DATA)
    mocks.save.mockReset().mockResolvedValue(DATA)
    mocks.restore.mockReset().mockResolvedValue(DATA)
  })

  it('muestra los secretos enmascarados y guarda el token solo en sessionStorage', async () => {
    renderSection()

    expect(await screen.findByText('configVersion 4')).toBeTruthy()
    expect(screen.getAllByText('Configurado (valor oculto)')).toHaveLength(2)
    expect(screen.queryByText(/secreto-real|token-secreto/)).toBeNull()
    expect(screen.getByLabelText('URL pública de la API')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Token de administración'), { target: { value: 'token-de-prueba' } })
    fireEvent.click(screen.getByRole('button', { name: /Usar token/ }))

    expect(sessionStorage.getItem('runlabqa-stack-admin-token')).toBe('token-de-prueba')
    await waitFor(() => expect(mocks.get).toHaveBeenCalledWith('token-de-prueba'))
  })

  it('queda deshabilitada cuando la API responde 503', async () => {
    mocks.get.mockRejectedValue(new ApiError(503, { error: 'deshabilitado', disabled: true }))

    renderSection()

    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.getByText(/Administración deshabilitada/)).toBeTruthy()
    expect((screen.getByLabelText('Token de administración') as HTMLInputElement).disabled).toBe(true)
    expect(screen.queryByText('configVersion 4')).toBeNull()
  })

  it('envía keep/set/clear y muestra el comando pendiente de recreación', async () => {
    sessionStorage.setItem('runlabqa-stack-admin-token', 'token-de-prueba')
    renderSection()

    expect(await screen.findByText('configVersion 4')).toBeTruthy()
    expect(screen.getByText('docker compose up -d --force-recreate runlabqa-api')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('URL pública de la API'), {
      target: { value: 'https://dashboard.example.com/api' },
    })
    fireEvent.change(screen.getByLabelText('Token del agente'), {
      target: { value: 'nuevo-token-agente' },
    })
    fireEvent.change(screen.getByLabelText('Operación para UPDATE_TOKEN'), {
      target: { value: 'clear' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Guardar configuración del stack/ }))

    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(1))
    const [token, payload] = mocks.save.mock.calls[0]
    expect(token).toBe('token-de-prueba')
    expect(payload.values.VITE_API_URL).toBe('https://dashboard.example.com/api')
    expect(payload.secrets.RUNLABQA_AGENT_TOKEN).toEqual({ operation: 'set', value: 'nuevo-token-agente' })
    expect(payload.secrets.UPDATE_TOKEN).toEqual({ operation: 'clear' })
  })

  it('restaura la copia anterior solo tras confirmación', async () => {
    sessionStorage.setItem('runlabqa-stack-admin-token', 'token-de-prueba')
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    renderSection()

    await screen.findByText('configVersion 4')
    fireEvent.click(screen.getByRole('button', { name: /Restaurar copia anterior/ }))
    await waitFor(() => expect(confirm).toHaveBeenCalledTimes(1))
    expect(mocks.restore).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /Restaurar copia anterior/ }))
    await waitFor(() => expect(mocks.restore).toHaveBeenCalledWith('token-de-prueba'))
    confirm.mockRestore()
  })
})
