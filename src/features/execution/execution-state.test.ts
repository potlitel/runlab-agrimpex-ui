import { describe, expect, it } from 'vitest'
import {
  deriveSummaryFromResults,
  initialRunState,
  mergeExecutionSummary,
  reduceRunState,
} from './execution-state'

describe('reduceRunState', () => {
  it('conserva reportId, timestamp y opciones al emitir completed y aborted', () => {
    let state = initialRunState
    state = reduceRunState(state, {
      type: 'launched',
      options: {
        testIds: ['tests/a.spec.ts::caso'],
        project: 'chromium',
        workers: 2,
        useDocker: true,
        params: { API_URL: 'https://example.test' },
      },
    })
    expect(state.lastRunOptions).toEqual({
      project: 'chromium',
      workers: 2,
      useDocker: true,
      paramsCount: 1,
    })

    state = reduceRunState(state, {
      type: 'completed',
      reportId: 'report-1',
      timestamp: '2026-11-23T10:00:00.000Z',
    })
    expect(state.reportId).toBe('report-1')
    expect(state.reportTimestamp).toBe('2026-11-23T10:00:00.000Z')

    state = reduceRunState(state, {
      type: 'aborted',
      reportId: 'report-2',
      timestamp: '2026-11-23T10:01:00.000Z',
    })
    expect(state.reportId).toBe('report-2')
    expect(state.reportTimestamp).toBe('2026-11-23T10:01:00.000Z')
    expect(state.lastRunOptions?.project).toBe('chromium')
  })
})

describe('mergeExecutionSummary', () => {
  const eventSummary = { total: 3, passed: 2, failed: 1 }

  it('prioriza los campos presentes del reporte y calcula la tasa sobre ejecutados', () => {
    const view = mergeExecutionSummary(eventSummary, {
      total: 3,
      passed: 2,
      failed: 1,
      errors: 0,
      skipped: 0,
      duration: 12.5,
      previewImage: 'screenshots/capture.png',
    })

    expect(view.summary).toMatchObject({
      total: 3,
      passed: 2,
      failed: 1,
      errors: 0,
      skipped: 0,
      duration: 12.5,
      previewImage: 'screenshots/capture.png',
    })
    expect(view.passRate).toBe(67)
    expect(view.partial).toBe(false)
  })

  it('conserva el resumen del evento y marca como parcial si falla el detalle', () => {
    const results = {
      a: { id: 'a', status: 'passed' },
      b: { id: 'b', status: 'failed' },
      c: { id: 'c', status: 'skipped' },
    }
    const view = mergeExecutionSummary(eventSummary, null, {
      derived: deriveSummaryFromResults(results),
      detailFailed: true,
    })

    expect(view.summary).toMatchObject({ total: 3, passed: 2, failed: 1, skipped: 1 })
    expect(view.partial).toBe(true)
    expect(view.passRate).toBe(67)
  })

  it('usa contadores derivados solo para los campos ausentes en el resumen', () => {
    const view = mergeExecutionSummary(
      { total: 2, passed: 1, failed: 1 },
      null,
      { derived: { total: 2, passed: 1, failed: 1, errors: 1, skipped: 2 } }
    )

    expect(view.summary).toMatchObject({
      total: 2,
      passed: 1,
      failed: 1,
      errors: 1,
      skipped: 2,
    })
    expect(view.passRate).toBe(33)
  })

  it('no presenta tasa definitiva sin resultados ejecutados', () => {
    const view = mergeExecutionSummary(
      { total: 2, passed: 0, failed: 0, skipped: 2 },
      null
    )

    expect(view.passRate).toBe(0)
    expect(view.summary.skipped).toBe(2)
  })
})
