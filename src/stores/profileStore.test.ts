import { beforeEach, describe, expect, it } from 'vitest'
import { profileStore } from './profileStore'
import type { Profile } from '@/types/contract'

const AVATAR = { style: 'bottts' as const, seed: 'semilla' }

function legacyProfile(id: string, name: string) {
  return { id, name } as unknown as Profile
}

describe('profileStore: avatar', () => {
  beforeEach(() => {
    profileStore.setState({
      activeProfileId: null,
      profiles: [],
      statuses: [],
      hydrated: false,
      loading: false,
      error: null,
    })
  })

  it('asigna un fallback determinista al hidratar perfiles heredados', () => {
    profileStore.getState().setProfiles([legacyProfile('perfil-1', 'Perfil 1')])
    expect(profileStore.getState().profiles[0].avatar).toEqual({
      style: 'notionists',
      seed: 'perfil-1',
    })
    expect(profileStore.getState().activeProfileId).toBe('perfil-1')
  })

  it('add y update conservan el avatar válido', () => {
    const profile: Profile = { id: 'perfil-2', name: 'Perfil 2', avatar: AVATAR }
    profileStore.getState().add(profile)
    expect(profileStore.getState().profiles[0].avatar).toEqual(AVATAR)

    profileStore.getState().update({ ...profile, name: 'Renombrado' })
    expect(profileStore.getState().profiles[0]).toMatchObject({
      name: 'Renombrado',
      avatar: AVATAR,
    })
  })

  it('normaliza el avatar también en add cuando falta', () => {
    profileStore.getState().add(legacyProfile('perfil-3', 'Perfil 3'))
    expect(profileStore.getState().profiles[0].avatar).toEqual({
      style: 'notionists',
      seed: 'perfil-3',
    })
  })
})
