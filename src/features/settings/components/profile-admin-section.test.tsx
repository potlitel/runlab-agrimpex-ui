import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Profile } from '@/types/contract'
import { ProfileAdminSection } from './profile-admin-section'

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  duplicate: vi.fn(),
  deleteProfile: vi.fn(),
  update: vi.fn(),
  updateSettings: vi.fn(),
  activate: vi.fn(),
  browse: vi.fn(),
  add: vi.fn(),
  storeUpdate: vi.fn(),
  remove: vi.fn(),
  setActive: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  state: {
    profiles: [] as unknown[],
    activeProfileId: 'perfil-1' as string | null,
  },
}))

vi.mock('@/lib/api', () => ({
  configApi: { browse: mocks.browse },
  profileAdminApi: {
    list: mocks.list,
    create: mocks.create,
    duplicate: mocks.duplicate,
    delete: mocks.deleteProfile,
    update: mocks.update,
    updateSettings: mocks.updateSettings,
    activate: mocks.activate,
  },
}))

vi.mock('@/stores/profileStore', () => ({
  profileStore: {
    getState: () => ({
      add: mocks.add,
      update: mocks.storeUpdate,
      remove: mocks.remove,
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

function renderSection() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <ProfileAdminSection />
    </QueryClientProvider>
  )
}

function chooseAvatar(label: 'Elegir avatar' | 'Cambiar avatar') {
  fireEvent.click(screen.getByRole('button', { name: label }))
  const chosen = screen.getAllByRole('button', { name: /^Avatar \d+$/ })[0]
  fireEvent.click(chosen)
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
  return chosen.getAttribute('data-seed')
}

describe('ProfileAdminSection', () => {
  beforeEach(() => {
    mocks.state.profiles = [PROFILE]
    mocks.state.activeProfileId = 'perfil-1'
    mocks.list.mockResolvedValue({
      activeProfileId: 'perfil-1',
      profiles: [PROFILE],
      templateProfileId: null,
      testDataDefaults: { txtFolderPath: '', jsonDataPath: '' },
      createProfileTestDataMode: 'none',
    })
    for (const fn of [
      mocks.list,
      mocks.create,
      mocks.duplicate,
      mocks.deleteProfile,
      mocks.update,
      mocks.updateSettings,
      mocks.activate,
      mocks.browse,
      mocks.add,
      mocks.storeUpdate,
      mocks.remove,
      mocks.setActive,
      mocks.success,
      mocks.error,
    ]) {
      fn.mockReset()
    }
    mocks.list.mockResolvedValue({
      activeProfileId: 'perfil-1',
      profiles: [PROFILE],
      templateProfileId: null,
      testDataDefaults: { txtFolderPath: '', jsonDataPath: '' },
      createProfileTestDataMode: 'none',
    })
  })

  it('bloquea el alta sin avatar y crea con avatar y origen', async () => {
    mocks.create.mockResolvedValue({
      id: 'perfil-2',
      name: 'Nuevo',
      avatar: { style: 'notionists', seed: 'otra' },
    })
    renderSection()

    expect(screen.getByRole('button', { name: /Crear/ }).hasAttribute('disabled')).toBe(true)
    fireEvent.change(screen.getByLabelText('Nuevo perfil'), {
      target: { value: 'Nuevo' },
    })
    expect(screen.getByRole('button', { name: /Crear/ }).hasAttribute('disabled')).toBe(true)

    const seed = chooseAvatar('Elegir avatar')
    expect(screen.getByRole('button', { name: /Crear/ }).hasAttribute('disabled')).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: /Crear/ }))

    await waitFor(() => {
      expect(mocks.create).toHaveBeenCalledWith('Nuevo', {
        avatar: { style: 'notionists', seed },
      })
    })
    expect(mocks.add).toHaveBeenCalled()
  })

  it('conserva la selección cuando la API rechaza el alta', async () => {
    mocks.create.mockRejectedValue(new Error('avatar.style inválido'))
    renderSection()

    fireEvent.change(screen.getByLabelText('Nuevo perfil'), {
      target: { value: 'Nuevo' },
    })
    chooseAvatar('Elegir avatar')
    fireEvent.click(screen.getByRole('button', { name: /Crear/ }))

    await waitFor(() => {
      expect(mocks.error).toHaveBeenCalledWith('avatar.style inválido')
    })
    expect((screen.getByLabelText('Nuevo perfil') as HTMLInputElement).value).toBe('Nuevo')
    expect(screen.getByRole('button', { name: 'Cambiar avatar' })).toBeTruthy()
    expect(mocks.add).not.toHaveBeenCalled()
  })

  it('edita con PATCH en lugar de renombrar en línea', async () => {
    mocks.update.mockResolvedValue({ ...PROFILE, name: 'Editado' })
    renderSection()

    fireEvent.click(screen.getByTitle('Editar'))
    const input = screen.getByLabelText('Nombre del perfil') as HTMLInputElement
    expect(input.value).toBe('Perfil QA')

    fireEvent.change(input, { target: { value: 'Editado' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(mocks.update).toHaveBeenCalledWith('perfil-1', {
        name: 'Editado',
        avatar: PROFILE.avatar,
      })
    })
    expect(mocks.storeUpdate).toHaveBeenCalledWith({ ...PROFILE, name: 'Editado' })
  })
})
