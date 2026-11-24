import type {
  EvidenceCaptureOrigin,
  EvidenceMetadata,
  EvidenceTestStatus,
} from '@/types/contract'

/** Normaliza valores que vienen de reportes antiguos o de la API REST. */
export function normalizeEvidenceStatus(value: unknown): EvidenceTestStatus | null {
  return value === 'passed' || value === 'failed' || value === 'error'
    ? value
    : null
}

export function normalizeCaptureOrigin(value: unknown): EvidenceCaptureOrigin | null {
  return value === 'capture' || value === 'failure-artifact' ? value : null
}

/** Extrae el paso lógico de un nombre `screenshot-<paso>` del helper del kit. */
export function stepFromCaptureName(name?: string | null): string | null {
  if (!name) return null
  const step = String(name)
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/^screenshot-+/i, '')
    .trim()
  return step || null
}

export function normalizeEvidenceMetadata<T extends EvidenceMetadata>(metadata: T): T {
  const captureName = metadata.captureName ?? null
  const step =
    metadata.step ??
    (normalizeCaptureOrigin(metadata.evidenceSource) === 'capture'
      ? stepFromCaptureName(captureName)
      : null)
  return {
    ...metadata,
    status: normalizeEvidenceStatus(metadata.status),
    evidenceSource: normalizeCaptureOrigin(metadata.evidenceSource),
    captureName,
    step,
  }
}
