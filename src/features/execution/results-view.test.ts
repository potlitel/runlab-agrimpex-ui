import { describe, expect, it } from 'vitest'
import type { ExecutionTestResult } from './execution-state'
import { filterResults, selectResultGroups, sortResults } from './results-view'

const results: Record<string, ExecutionTestResult> = {
  'tests/b.spec.ts::lento': { id: 'tests/b.spec.ts::lento', status: 'passed', duration: 8.2 },
  'tests/a.spec.ts::fallo': { id: 'tests/a.spec.ts::fallo', status: 'failed', duration: 1.1 },
  'tests/c.spec.ts::error': { id: 'tests/c.spec.ts::error', status: 'error', duration: 3.4 },
  'tests/a.spec.ts::omitido': { id: 'tests/a.spec.ts::omitido', status: 'skipped' },
  'tests/b.spec.ts::otro': { id: 'tests/b.spec.ts::otro', status: 'passed', duration: 2.5 },
}

describe('filterResults', () => {
  it('encuentra coincidencias por identificador y estado', () => {
    expect(filterResults(results, { query: 'A.SPEC', status: 'failed' }).map((r) => r.id)).toEqual([
      'tests/a.spec.ts::fallo',
    ])
    expect(filterResults(results, { status: 'error' }).map((r) => r.id)).toEqual([
      'tests/c.spec.ts::error',
    ])
  })

  it('devuelve una lista vacía sin coincidencias', () => {
    expect(filterResults(results, { query: 'inexistente' })).toEqual([])
  })
})

describe('sortResults', () => {
  it('ordena fallos y errores primero con estados mixtos', () => {
    expect(sortResults(Object.values(results)).map((r) => r.status)).toEqual([
      'failed',
      'error',
      'skipped',
      'passed',
      'passed',
    ])
  })

  it('ordena por duración descendente y deja los sin duración al final', () => {
    const ids = sortResults(Object.values(results), 'duration').map((r) => r.id)
    expect(ids).toEqual([
      'tests/b.spec.ts::lento',
      'tests/c.spec.ts::error',
      'tests/b.spec.ts::otro',
      'tests/a.spec.ts::fallo',
      'tests/a.spec.ts::omitido',
    ])
  })
})

describe('selectResultGroups', () => {
  it('agrupa por archivo conservando el orden dentro de cada grupo', () => {
    const groups = selectResultGroups(results, { groupByFile: true })

    expect(groups.map((group) => group.file)).toEqual([
      'tests/a.spec.ts',
      'tests/c.spec.ts',
      'tests/b.spec.ts',
    ])
    expect(groups[0].rows.map((row) => row.id)).toEqual([
      'tests/a.spec.ts::fallo',
      'tests/a.spec.ts::omitido',
    ])
  })
})
