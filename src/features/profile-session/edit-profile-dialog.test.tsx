import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Profile } from '@/types/contract'
import { EditProfileDialog } from './edit-profile-dialog'

const mocks = vi.hoisted(() => ({
  update: vi.fn(),
  storeUpdate: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  profileAdminApi: { update: mocks.update },
}))

vi.mock('@/stores/profileStore', () => ({
  profileStore: { getState: () => ({ update: mocks.storeUpdate }) },
}))

vi.mock('sonner', () => ({
  toast: { success: mocks.success, error: mocks.error },
}))

const PROFILE = {
  id: 'perfil-1',
  name: 'Perfil QA',
  avatar: { style: 'bottts', seed: 'semilla' },
} as Profile

function renderDialog(profile: Profile) {
  const onOpenChange = vi.fn()
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const view = render(
    <QueryClientProvider client={queryClient}>
      <EditProfileDialog open onOpenChange={onOpenChange} profile={profile} />
    </QueryClientProvider>
  )
  return { ...view, onOpenChange }
}

describe('EditProfileDialog', () => {
  beforeEach(() => {
    mocks.update.mockReset()
    mocks.storeUpdate.mockReset()
    mocks.success.mockReset()
    mocks.error.mockReset()
  })

  it('muestra el nombre y el avatar actual preseleccionados', () => {
    renderDialog(PROFILE)
    expect((screen.getByLabelText('Nombre del perfil') as HTMLInputElement).value).toBe(
      PROFILE.name
    )
    expect(screen.getByRole('button', { name: 'Cambiar avatar' })).toBeTruthy()
  })

  it('bloquea el guardado sin avatar', () => {
    const legacy = { id: 'perfil-legacy', name: 'Heredado' } as unknown as Profile
    renderDialog(legacy)
    expect(screen.getByRole('button', { name: 'Guardar' }).hasAttribute('disabled')).toBe(true)
    expect(screen.getByRole('alert').textContent).toMatch(/elegir un avatar/i)
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it('guarda nombre y avatar y actualiza el store', async () => {
    const updated = {
      ...PROFILE,
      name: 'QA Actualizado',
      avatar: { style: 'notionists', seed: 'nueva' },
    }
    mocks.update.mockResolvedValue(updated)
    const { onOpenChange } = renderDialog(PROFILE)

    fireEvent.change(screen.getByLabelText('Nombre del perfil'), {
      target: { value: 'QA Actualizado' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar avatar' }))
    const chosen = screen.getAllByRole('button', { name: /^Avatar \d+$/ })[1]
    fireEvent.click(chosen)
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(mocks.update).toHaveBeenCalledWith('perfil-1', {
        name: 'QA Actualizado',
        avatar: {
          style: 'bottts',
          seed: chosen.getAttribute('data-seed'),
        },
      })
    })
    expect(mocks.storeUpdate).toHaveBeenCalledWith(updated)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('conserva el formulario y el diálogo abiertos ante un error de API', async () => {
    mocks.update.mockRejectedValue(new Error('avatar.style inválido'))
    renderDialog(PROFILE)

    fireEvent.change(screen.getByLabelText('Nombre del perfil'), {
      target: { value: 'Nombre en edición' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toBe('avatar.style inválido')
    })
    expect((screen.getByLabelText('Nombre del perfil') as HTMLInputElement).value).toBe(
      'Nombre en edición'
    )
    expect(screen.getByRole('button', { name: 'Cambiar avatar' })).toBeTruthy()
    expect(mocks.storeUpdate).not.toHaveBeenCalled()
  })
})
