import { describe, expect, expectTypeOf, it } from 'vitest'
import {
  normalizeCaptureOrigin,
  normalizeEvidenceMetadata,
  normalizeEvidenceStatus,
  stepFromCaptureName,
} from '@/lib/evidence'
import {
  EVIDENCE_DEFAULTS,
  type EvidenceConfig,
  type EvidenceItem,
  type ReportAttachment,
  type ReportDetail,
} from './contract'

describe('contrato de evidencia', () => {
  it('expone los defaults compartidos con runner y kit', () => {
    expect(EVIDENCE_DEFAULTS).toMatchObject({
      imageFormat: 'png',
      imageQuality: 90,
      scale: 'css',
      screenshotTimeout: 30000,
    })
    expectTypeOf<EvidenceConfig['imageFormat']>().toEqualTypeOf<
      'png' | 'jpeg' | 'jpg' | undefined
    >()
    expectTypeOf<EvidenceConfig['scale']>().toEqualTypeOf<
      'css' | 'device' | undefined
    >()
  })

  it('acepta metadatos de capturas con estado, paso y dimensiones', () => {
    const attachment: ReportAttachment = {
      name: 'screenshot-T1-01-registro-creado',
      assetPath: 'attachments/screenshot-T1-01-registro-creado.png',
      contentType: 'image/png',
      status: 'passed',
      source: 'report',
      evidenceSource: 'capture',
      captureName: 'screenshot-T1-01-registro-creado',
      width: 1280,
      height: 720,
    }
    const item = normalizeEvidenceMetadata({
      ...attachment,
      name: 'screenshot-T1-01-registro-creado',
      id: 'spec::T1:screenshot',
      source: 'report' as const,
      kind: 'image' as const,
      url: '/api/reports/r1/assets/attachments/screenshot.png',
    } satisfies EvidenceItem)

    expect(item.status).toBe('passed')
    expect(item.evidenceSource).toBe('capture')
    expect(item.step).toBe('T1-01-registro-creado')
    expect(item.width).toBe(1280)
    expect(item.height).toBe(720)
    expectTypeOf<EvidenceItem['status']>().toMatchTypeOf<
      'passed' | 'failed' | 'error' | null | undefined
    >()
  })

  it('tolera reportes antiguos sin metadatos de evidencia', () => {
    const legacy: EvidenceItem = {
      id: 'folder:error.png',
      name: 'error.png',
      kind: 'image',
      source: 'folder',
      url: '/api/errors/file?name=error.png',
    }
    const normalized = normalizeEvidenceMetadata(legacy)
    expect(normalized.status).toBeNull()
    expect(normalized.evidenceSource).toBeNull()
    expect(normalized.step).toBeNull()
    expect(normalizeEvidenceStatus('skipped')).toBeNull()
    expect(normalizeCaptureOrigin('legacy')).toBeNull()
    expect(stepFromCaptureName(null)).toBeNull()
  })

  it('modela la integridad de capturas declaradas y no generadas', () => {
    const report: ReportDetail = {
      id: 'report_r1',
      summary: { total: 1, passed: 1, failed: 0, integrityIssues: 1 },
      tests: [{
        id: 'spec::T1',
        status: 'passed',
        expectedScreenshots: ['screenshot-faltante'],
      }],
      integrity: {
        issues: [{
          type: 'missing-screenshot',
          testId: 'spec::T1',
          name: 'screenshot-faltante',
          message: 'Captura declarada pero no generada',
        }],
        missingScreenshots: [{ testId: 'spec::T1', name: 'screenshot-faltante' }],
        invalidImages: [],
      },
      evidenceEnv: {
        RUNLAB_SCREENSHOT_FORMAT: 'jpeg',
        RUNLAB_SCREENSHOT_QUALITY: '72',
      },
    }
    expect(report.integrity?.missingScreenshots?.[0].name).toBe('screenshot-faltante')
    expect(report.tests[0].expectedScreenshots).toHaveLength(1)
    expect(report.evidenceEnv?.RUNLAB_SCREENSHOT_FORMAT).toBe('jpeg')
  })
})
