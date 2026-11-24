import { describe, expect, it, vi } from 'vitest'
import {
  AVATAR_STYLE_IDS,
  avatarBackgroundColor,
  avatarInitials,
  avatarToDataUri,
  createAvatarCandidates,
  createAvatarSeed,
  DEFAULT_AVATAR_STYLE,
  normalizeProfileAvatar,
  type ProfileAvatar,
} from './profile-avatar'

describe('profile-avatar', () => {
  it('genera el mismo data URI para el mismo estilo y seed', () => {
    const avatar: ProfileAvatar = { style: 'notionists', seed: 'perfil-1' }
    const first = avatarToDataUri(avatar)
    expect(first).toMatch(/^data:image\/svg\+xml/)
    expect(avatarToDataUri(avatar)).toBe(first)
    expect(avatarToDataUri({ ...avatar, seed: 'otra' })).not.toBe(first)
  })

  it('normaliza perfiles heredados con un fallback determinista', () => {
    expect(normalizeProfileAvatar(undefined, 'perfil-9')).toEqual({
      style: DEFAULT_AVATAR_STYLE,
      seed: 'perfil-9',
    })
    expect(normalizeProfileAvatar({ style: 'x', seed: 'a' }, 'perfil-9')).toEqual({
      style: DEFAULT_AVATAR_STYLE,
      seed: 'perfil-9',
    })
    expect(normalizeProfileAvatar({ style: 'bottts', seed: ' semilla ' }, 'perfil-9')).toEqual({
      style: 'bottts',
      seed: 'semilla',
    })
  })

  it('deriva un color de fondo estable de la seed', () => {
    expect(avatarBackgroundColor('perfil-1')).toBe(avatarBackgroundColor('perfil-1'))
    expect(avatarBackgroundColor('perfil-1')).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('extrae hasta dos iniciales del nombre', () => {
    expect(avatarInitials('Perfil QA Test')).toBe('PQ')
    expect(avatarInitials('  perfil  ')).toBe('P')
    expect(avatarInitials('')).toBe('?')
  })

  it('crea semillas sin depender de crypto.randomUUID', () => {
    vi.stubGlobal('crypto', {})
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.424242)
    try {
      const seed = createAvatarSeed()
      expect(seed).toMatch(/^[0-9a-z]+-[0-9a-z]+$/)
      expect(seed.length).toBeLessThanOrEqual(64)
      expect(random).toHaveBeenCalledOnce()
    } finally {
      random.mockRestore()
      vi.unstubAllGlobals()
    }
  })

  it('genera 24 candidatos del estilo solicitado con semillas inyectadas', () => {
    let next = 0
    const candidates = createAvatarCandidates('lorelei', 24, () => {
      next += 1
      return next / 100
    })
    expect(candidates).toHaveLength(24)
    expect(candidates.every((candidate) => candidate.style === 'lorelei')).toBe(true)
    expect(new Set(candidates.map((candidate) => candidate.seed)).size).toBe(24)
    expect(AVATAR_STYLE_IDS).toContain(candidates[0].style)
  })
})
