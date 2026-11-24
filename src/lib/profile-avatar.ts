import { Avatar, Style } from '@dicebear/core'
import bottts from '@dicebear/styles/bottts.json'
import lorelei from '@dicebear/styles/lorelei.json'
import micah from '@dicebear/styles/micah.json'
import notionists from '@dicebear/styles/notionists.json'

export const AVATAR_STYLE_IDS = ['notionists', 'lorelei', 'micah', 'bottts'] as const

export type AvatarStyleId = (typeof AVATAR_STYLE_IDS)[number]

export interface ProfileAvatar {
  style: AvatarStyleId
  seed: string
}

export const DEFAULT_AVATAR_STYLE: AvatarStyleId = 'notionists'
export const AVATAR_SEED_MAX_LENGTH = 64
export const AVATAR_CANDIDATE_COUNT = 24

export const AVATAR_STYLE_CATALOG: ReadonlyArray<{
  id: AvatarStyleId
  label: string
  description: string
}> = [
  { id: 'notionists', label: 'Notionists', description: 'Retratos con trazo' },
  { id: 'lorelei', label: 'Lorelei', description: 'Ilustraciones coloridas' },
  { id: 'micah', label: 'Micah', description: 'Formas geométricas' },
  { id: 'bottts', label: 'Bottts', description: 'Robots' },
]

const STYLE_DEFINITIONS: Record<AvatarStyleId, unknown> = {
  notionists,
  lorelei,
  micah,
  bottts,
}

const STYLE_INSTANCES = new Map<AvatarStyleId, Style>()

const BACKGROUND_COLORS = [
  '#fef3c7',
  '#dbeafe',
  '#dcfce7',
  '#fce7f3',
  '#ede9fe',
  '#ffedd5',
  '#ccfbf1',
  '#fee2e2',
] as const

function isAvatarStyleId(value: unknown): value is AvatarStyleId {
  return typeof value === 'string' && (AVATAR_STYLE_IDS as readonly string[]).includes(value)
}

export function normalizeProfileAvatar(value: unknown, fallbackSeed: string): ProfileAvatar {
  if (value && typeof value === 'object') {
    const candidate = value as { style?: unknown; seed?: unknown }
    if (
      isAvatarStyleId(candidate.style) &&
      typeof candidate.seed === 'string' &&
      candidate.seed.trim().length > 0 &&
      candidate.seed.trim().length <= AVATAR_SEED_MAX_LENGTH
    ) {
      return { style: candidate.style, seed: candidate.seed.trim() }
    }
  }
  return {
    style: DEFAULT_AVATAR_STYLE,
    seed: fallbackSeed.trim().slice(0, AVATAR_SEED_MAX_LENGTH) || 'perfil',
  }
}

export function createAvatarSeed(): string {
  const uuid = globalThis.crypto?.randomUUID?.()
  if (uuid) return uuid
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2).padEnd(10, '0')}`.slice(
    0,
    AVATAR_SEED_MAX_LENGTH
  )
}

export function createAvatarCandidates(
  style: AvatarStyleId,
  count = AVATAR_CANDIDATE_COUNT,
  random: () => number = Math.random
): ProfileAvatar[] {
  return Array.from({ length: count }, () => ({
    style,
    seed: `${Date.now().toString(36)}-${Math.floor(random() * 0xffffffff).toString(36)}`.slice(
      0,
      AVATAR_SEED_MAX_LENGTH
    ),
  }))
}

export function avatarBackgroundColor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return BACKGROUND_COLORS[hash % BACKGROUND_COLORS.length]
}

function getStyleInstance(style: AvatarStyleId): Style {
  let instance = STYLE_INSTANCES.get(style)
  if (!instance) {
    instance = new Style(STYLE_DEFINITIONS[style])
    STYLE_INSTANCES.set(style, instance)
  }
  return instance
}

export function avatarToDataUri(avatar: ProfileAvatar): string {
  const normalized = normalizeProfileAvatar(avatar, 'perfil')
  const instance = getStyleInstance(normalized.style)
  const options = {
    seed: normalized.seed,
    size: 128,
    backgroundColor: avatarBackgroundColor(normalized.seed),
  }
  return new Avatar(instance, options).toDataUri()
}

export function avatarInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  return words
    .slice(0, 2)
    .map((word) => Array.from(word)[0]?.toUpperCase() ?? '')
    .join('')
}
