import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Profile } from '@/types/contract'
import { ProfileManagerDialog } from './profile-manager-dialog'

const mocks = vi.hoisted(() => ({
  add: vi.fn(),
  remove: vi.fn(),
  update: vi.fn(),
  setActive: vi.fn(),
  create: vi.fn(),
  duplicate: vi.fn(),
  deleteProfile: vi.fn(),
  updateApi: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  state: {
    profiles: [] as unknown[],
    activeProfileId: 'perfil-1' as string | null,
  },
}))

vi.mock('@/lib/api', () => ({
  profileAdminApi: {
    create: mocks.create,
    duplicate: mocks.duplicate,
    delete: mocks.deleteProfile,
    update: mocks.updateApi,
  },
}))

vi.mock('@/stores/profileStore', () => ({
  profileStore: {
    getState: () => ({
      add: mocks.add,
      remove: mocks.remove,
      update: mocks.update,
      setActive: mocks.setActive,
    }),
  },
  useProfileStore: (selector: (state: typeof mocks.state) => unknown) =>
    selector(mocks.state),
}))

vi.mock('sonner', () => ({
  toast: { success: mocks.success, error: mocks.error },
}))

const PROFILE: Profile = {
  id: 'perfil-1',
  name: 'Perfil QA',
  avatar: { style: 'bottts', seed: 'semilla' },
}

function renderDialog() {
  const onOpenChange = vi.fn()
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <ProfileManagerDialog open onOpenChange={onOpenChange} />
    </QueryClientProvider>
  )
  return { onOpenChange }
}

describe('ProfileManagerDialog', () => {
  beforeEach(() => {
    mocks.state.profiles = [PROFILE]
    mocks.state.activeProfileId = 'perfil-1'
    for (const fn of [
      mocks.add,
      mocks.remove,
      mocks.update,
      mocks.setActive,
      mocks.create,
      mocks.duplicate,
      mocks.deleteProfile,
      mocks.updateApi,
      mocks.success,
      mocks.error,
    ]) {
      fn.mockReset()
    }
  })

  it('bloquea el alta sin avatar y crea con la selección elegida', async () => {
    mocks.create.mockResolvedValue({
      id: 'perfil-2',
      name: 'Nuevo',
      avatar: { style: 'notionists', seed: 'otra' },
    })
    renderDialog()

    expect(screen.getByRole('button', { name: 'Crear' }).hasAttribute('disabled')).toBe(true)
    fireEvent.change(screen.getByLabelText('Nuevo perfil'), {
      target: { value: 'Nuevo' },
    })
    expect(screen.getByRole('button', { name: 'Crear' }).hasAttribute('disabled')).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Elegir avatar' }))
    const chosen = screen.getAllByRole('button', { name: /^Avatar \d+$/ })[0]
    fireEvent.click(chosen)
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(screen.getByRole('button', { name: 'Crear' }).hasAttribute('disabled')).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: 'Crear' }))
    await waitFor(() => {
      expect(mocks.create).toHaveBeenCalledWith('Nuevo', {
        avatar: { style: 'notionists', seed: chosen.getAttribute('data-seed') },
      })
    })
    expect(mocks.add).toHaveBeenCalled()
  })

  it('abre el diálogo de edición en lugar de renombrar en línea', async () => {
    mocks.updateApi.mockResolvedValue({ ...PROFILE, name: 'Editado' })
    renderDialog()

    fireEvent.click(screen.getByTitle('Editar'))
    const input = screen.getByLabelText('Nombre del perfil') as HTMLInputElement
    expect(input.value).toBe('Perfil QA')
    expect(screen.getByRole('button', { name: 'Cambiar avatar' })).toBeTruthy()

    fireEvent.change(input, { target: { value: 'Editado' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(mocks.updateApi).toHaveBeenCalledWith('perfil-1', {
        name: 'Editado',
        avatar: PROFILE.avatar,
      })
    })
    expect(mocks.update).toHaveBeenCalledWith({ ...PROFILE, name: 'Editado' })
  })
})
