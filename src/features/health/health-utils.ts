import {
  Activity,
  BarChart2,
  Box,
  Clock,
  Folder,
  Image,
  Plug,
  User,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type {
  HealthBadgeStatus,
  HealthCheckStatus,
} from '@/types/contract'

export const POLL_INTERVAL_SECONDS = 30

export const STATUS_LABELS: Record<HealthBadgeStatus, string> = {
  ok: 'OK',
  degraded: 'Degradado',
  unhealthy: 'Sin conexión',
  offline: 'Sin conexión',
}

export const STATUS_BADGE_CLASSES: Record<HealthBadgeStatus, string> = {
  ok: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  degraded:
    'border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300',
  unhealthy: 'border-destructive/30 bg-destructive/10 text-destructive',
  offline: 'border-destructive/30 bg-destructive/10 text-destructive',
}

export const CHECK_NAMES: Record<string, string> = {
  profiles: 'Perfiles',
  reports: 'Reportes',
  evidenceGallery: 'Galería de evidencias',
  profile: 'Perfil activo',
  projectPath: 'Ruta del proyecto',
  playwrightKit: 'Kit Playwright',
  scheduler: 'Programador',
  socket: 'Socket.io',
  dockerGrid: 'Docker / Grid',
}

export const CHECK_ICONS: Record<string, LucideIcon> = {
  profiles: Users,
  reports: BarChart2,
  evidenceGallery: Image,
  profile: User,
  projectPath: Folder,
  playwrightKit: Wrench,
  scheduler: Clock,
  socket: Plug,
  dockerGrid: Box,
}

export const DEFAULT_CHECK_ICON = Activity

export const CHECK_STATUS_LABELS: Record<HealthCheckStatus, string> = {
  ok: 'OK',
  degraded: 'Degradado',
  unhealthy: 'Crítico',
  not_configured: 'Sin configurar',
}

export const CHECK_BADGE_CLASSES: Record<HealthCheckStatus, string> = {
  ok: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  degraded: 'border-destructive/30 bg-destructive/10 text-destructive',
  unhealthy: 'border-destructive/30 bg-destructive/10 text-destructive',
  not_configured:
    'border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300',
}

const SENSITIVE_PATTERNS: RegExp[] = [
  /^\s*at\s+.+$/gim,
  /\b(?:Error|TypeError|ReferenceError):\s*/g,
  /(?:Bearer\s+)\S+/gi,
  /\b(?:TOKEN|SECRET|PASSWORD|PASSWD|API[_-]?KEY|RUNLAB_[A-Z0-9_]*|NODE_[A-Z0-9_]*)\s*[=:]\s*(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi,
  /process\.env(?:\.[A-Za-z0-9_]+|\[[^\]]+\])?/gi,
  /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
  /\b[A-Fa-f0-9]{32,}\b/g,
  /(?:[A-Za-z]:)?[\\/][^\s"']+/g,
]

/**
 * Los mensajes del backend ya son genéricos; esta capa evita que un cambio
 * futuro exponga stack traces, rutas, tokens o valores de entorno.
 */
export function sanitizeCheckMessage(
  message: string | undefined,
  status: HealthCheckStatus
): string {
  const fallback =
    status === 'not_configured'
      ? 'Configuración pendiente.'
      : 'Sin detalles adicionales.'
  if (!message) return fallback

  const clean = SENSITIVE_PATTERNS.reduce(
    (text, pattern) => text.replace(pattern, ''),
    message
  )
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180)

  return clean || fallback
}

export function formatRelativeTime(
  at: number | undefined,
  now: number
): string {
  if (!at) return 'Hace un momento'
  const seconds = Math.max(0, Math.floor((now - at) / 1000))
  if (seconds < 60) return `Hace ${seconds} s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `Hace ${minutes} min`
  return `Hace ${Math.floor(minutes / 60)} h`
}

export function formatUptime(seconds?: number) {
  if (typeof seconds !== 'number') return '—'
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return minutes ? `${minutes} min ${rest} s` : `${rest} s`
}

export function secondsUntilNextPoll(
  dataUpdatedAt: number | undefined,
  now: number
): number {
  if (!dataUpdatedAt) return POLL_INTERVAL_SECONDS
  const elapsed = now - dataUpdatedAt
  const remaining = Math.ceil((POLL_INTERVAL_SECONDS * 1000 - elapsed) / 1000)
  return Math.min(POLL_INTERVAL_SECONDS, Math.max(0, remaining))
}
