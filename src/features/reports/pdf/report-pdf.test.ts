import { describe, expect, it } from 'vitest'
import type { ReportAnalyticsExportPayload } from '@/types/contract'
import {
  ANALYTICS_PDF_SECTIONS,
  RUN_PDF_SECTIONS,
  generateAnalyticsPdf,
  generateRunPdf,
} from './report-pdf'

describe('report-pdf', () => {
  it('genera un PDF válido para corrida mínima', async () => {
    const blob = await generateRunPdf({
      type: 'run',
      report: { id: 'run-1', timestamp: '2026-11-23T10:00:00Z' },
      profile: { id: 'p1', name: 'Perfil QA' },
      summary: { total: 2, passed: 1, failed: 1, skipped: 0, duration: 12.3 },
      tests: [
        {
          id: 'tests/a.spec.ts::login',
          status: 'passed',
          duration: 1.2,
          output: 'ok',
          attachments: [],
        },
        {
          id: 'tests/a.spec.ts::checkout',
          status: 'failed',
          duration: 2.1,
          errorMsg: 'Expected true',
          attachments: [
            {
              name: 'note.txt',
              contentType: 'text/plain',
              path: 'note.txt',
              kind: 'other',
            },
          ],
        },
      ],
    })

    expect(blob).toBeInstanceOf(Blob)
    expect(blob.size).toBeGreaterThan(1000)
    expect(blob.type).toContain('pdf')
  })

  it('genera un PDF analítico con tendencia/byFile normalizados', async () => {
    const blob = await generateAnalyticsPdf({
      type: 'analytics',
      profile: { name: 'Perfil QA' },
      summary: {
        totalRuns: 3,
        totalExecutions: 30,
        totalPassed: 25,
        totalFailed: 5,
        passRate: 83.3,
        avgDuration: 45,
        totalAvailable: 10,
        uniqueExecuted: 10,
        uniquePassed: 8,
        uniqueFailed: 2,
        neverExecuted: 0,
        byFile: [],
        timeline: [],
      },
      timeline: [
        { timestamp: '2026-11-20T10:00:00Z', passed: 8, failed: 2 },
        { timestamp: '2026-11-21T10:00:00Z', passed: 9, failed: 1 },
      ],
      byFile: [{ file: 'tests/a.spec.ts', total: 10, passed: 8, failed: 2 }],
      recentRuns: [
        {
          id: 'run-1',
          timestamp: '2026-11-21T10:00:00Z',
          summary: { total: 10, passed: 9, failed: 1 },
        },
      ],
    })

    expect(blob).toBeInstanceOf(Blob)
    expect(blob.size).toBeGreaterThan(1000)
  })

  it('expone secciones por defecto', () => {
    expect(RUN_PDF_SECTIONS).toContain('cover')
    expect(RUN_PDF_SECTIONS).toContain('evidence')
    expect(ANALYTICS_PDF_SECTIONS).toContain('trend')
    expect(ANALYTICS_PDF_SECTIONS).toContain('recentRuns')
  })

  it('no falla con evidencias faltantes o adjuntos no imagen', async () => {
    const blob = await generateRunPdf({
      type: 'run',
      report: { id: 'run-2' },
      summary: { total: 1, passed: 0, failed: 1 },
      tests: [
        {
          id: 't1',
          status: 'failed',
          attachments: [
            { name: 'video.webm', contentType: 'video/webm', path: 'a.webm', kind: 'other' },
            { name: 'missing.png', contentType: 'image/png', assetPath: 'missing.png', kind: 'image' },
          ],
        },
      ],
    })
    expect(blob.size).toBeGreaterThan(1000)
  })

  it('normaliza timeline/byFile malformados sin romper', async () => {
    const blob = await generateAnalyticsPdf({
      type: 'analytics',
      summary: {
        totalRuns: 1,
        totalExecutions: 1,
        totalPassed: 1,
        totalFailed: 0,
        passRate: 100,
        avgDuration: 1,
        totalAvailable: null,
        uniqueExecuted: 1,
        uniquePassed: 1,
        uniqueFailed: 0,
        neverExecuted: null,
        byFile: [],
        timeline: [],
      },
      timeline: [null, { timestamp: 'bad-date', passed: '2', failed: undefined }] as unknown as ReportAnalyticsExportPayload['timeline'],
      byFile: [null, { name: 'x.spec.ts', total: '3', passed: 2, failed: 1 }] as unknown as ReportAnalyticsExportPayload['byFile'],
      recentRuns: [null, { id: 'r1', summary: { total: 3, passed: 2, failed: 1 } }] as unknown as ReportAnalyticsExportPayload['recentRuns'],
    })
    expect(blob.size).toBeGreaterThan(1000)
  })
})
