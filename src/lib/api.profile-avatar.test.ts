import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  create: vi.fn(),
}))

vi.mock('axios', () => {
  const instance = {
    get: mocks.get,
    post: mocks.post,
    put: vi.fn(),
    patch: mocks.patch,
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  }
  mocks.create.mockReturnValue(instance)
  return { default: { create: mocks.create }, create: mocks.create }
})

vi.mock('@/stores/profileStore', () => ({
  profileStore: {
    getState: () => ({ activeProfileId: 'perfil-1' }),
  },
}))

const AVATAR = { style: 'bottts' as const, seed: 'semilla' }

describe('profileAdminApi con avatar', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('normaliza el avatar de los perfiles heredados al listar', async () => {
    mocks.get.mockResolvedValue({
      activeProfileId: 'perfil-1',
      profiles: [{ id: 'perfil-1', name: 'Perfil 1' }],
    })
    const { profileAdminApi } = await import('@/lib/api')
    const list = await profileAdminApi.list()
    expect(mocks.get).toHaveBeenCalledWith('/profile-admin', { params: undefined })
    expect(list.profiles[0].avatar).toEqual({ style: 'notionists', seed: 'perfil-1' })
    expect(axios.create).toHaveBeenCalled()
  })

  it('envía el avatar en el alta y normaliza la respuesta', async () => {
    mocks.post.mockResolvedValue({ id: 'perfil-2', name: 'Nuevo' })
    const { profileAdminApi } = await import('@/lib/api')
    const created = await profileAdminApi.create('Nuevo', { avatar: AVATAR })
    expect(mocks.post).toHaveBeenCalledWith(
      '/profile-admin',
      { name: 'Nuevo', avatar: AVATAR },
      { params: undefined }
    )
    expect(created.avatar).toEqual({ style: 'notionists', seed: 'perfil-2' })
  })

  it('actualiza nombre y avatar con PATCH /:id', async () => {
    mocks.patch.mockResolvedValue({ id: 'perfil-1', name: 'Renombrado', avatar: AVATAR })
    const { profileAdminApi } = await import('@/lib/api')
    const updated = await profileAdminApi.update('perfil/1', { name: 'Renombrado', avatar: AVATAR })
    expect(mocks.patch).toHaveBeenCalledWith(
      '/profile-admin/perfil%2F1',
      { name: 'Renombrado', avatar: AVATAR },
      { params: undefined }
    )
    expect(updated.avatar).toEqual(AVATAR)
  })

  it('duplica con avatar opcional y normaliza la respuesta', async () => {
    mocks.post.mockResolvedValue({ id: 'copia', name: 'Copia', avatar: AVATAR })
    const { profileAdminApi } = await import('@/lib/api')
    await profileAdminApi.duplicate('perfil-1', 'Copia')
    expect(mocks.post).toHaveBeenCalledWith(
      '/profile-admin/perfil-1/duplicate',
      { name: 'Copia' },
      { params: undefined }
    )
    await profileAdminApi.duplicate('perfil-1', 'Otra', AVATAR)
    expect(mocks.post).toHaveBeenLastCalledWith(
      '/profile-admin/perfil-1/duplicate',
      { name: 'Otra', avatar: AVATAR },
      { params: undefined }
    )
  })
})
