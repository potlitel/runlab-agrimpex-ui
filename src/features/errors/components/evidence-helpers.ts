import type { EvidenceKind } from '@/types/contract'

export function formatEvidenceDate(ms?: number | null) {
  if (!ms) return '—'
  const date = new Date(ms)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

export function formatEvidenceSize(bytes?: number | null) {
  if (bytes == null || Number.isNaN(bytes)) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function evidenceKindLabel(kind: EvidenceKind) {
  if (kind === 'image') return 'Imagen'
  if (kind === 'video') return 'Video'
  if (kind === 'trace') return 'Traza'
  if (kind === 'context') return 'Contexto'
  return 'Otro'
}

export function evidenceStatusVariant(status?: string | null) {
  if (status === 'passed') return 'default' as const
  if (status === 'failed' || status === 'error') return 'destructive' as const
  return 'outline' as const
}

export function shortEvidenceTestId(testId?: string | null) {
  if (!testId) return '—'
  const parts = testId.split('::')
  return parts.slice(1).join(' › ') || testId
}
