import type { ExecutionTestResult } from './execution-state'

export type ResultStatusFilter =
  | 'all'
  | 'failed'
  | 'error'
  | 'passed'
  | 'skipped'
  | 'running'

export type ResultSort = 'failures' | 'duration'

export interface ResultViewOptions {
  query?: string
  status?: ResultStatusFilter
  sort?: ResultSort
  groupByFile?: boolean
}

export interface ResultGroup {
  file: string
  rows: ExecutionTestResult[]
}

const severity: Record<string, number> = {
  failed: 0,
  error: 1,
  running: 2,
  skipped: 3,
  passed: 4,
}

export function filterResults(
  results: Record<string, ExecutionTestResult>,
  options: Pick<ResultViewOptions, 'query' | 'status'> = {}
): ExecutionTestResult[] {
  const query = options.query?.trim().toLowerCase() ?? ''
  return Object.values(results).filter((result) => {
    if (options.status && options.status !== 'all' && result.status !== options.status) {
      return false
    }
    return !query || result.id.toLowerCase().includes(query)
  })
}

export function sortResults(
  rows: ExecutionTestResult[],
  sort: ResultSort = 'failures'
): ExecutionTestResult[] {
  return [...rows].sort((a, b) => {
    if (sort === 'duration') {
      const aDuration = a.duration ?? Number.NEGATIVE_INFINITY
      const bDuration = b.duration ?? Number.NEGATIVE_INFINITY
      if (aDuration !== bDuration) return bDuration - aDuration
      return a.id.localeCompare(b.id)
    }
    const aSeverity = severity[a.status] ?? 5
    const bSeverity = severity[b.status] ?? 5
    if (aSeverity !== bSeverity) return aSeverity - bSeverity
    return a.id.localeCompare(b.id)
  })
}

export function groupResultsByFile(rows: ExecutionTestResult[]): ResultGroup[] {
  const groups = new Map<string, ExecutionTestResult[]>()
  for (const row of rows) {
    const file = row.id.split('::')[0] || 'sin archivo'
    if (!groups.has(file)) groups.set(file, [])
    groups.get(file)?.push(row)
  }
  return Array.from(groups, ([file, groupRows]) => ({ file, rows: groupRows }))
}

export function selectResultGroups(
  results: Record<string, ExecutionTestResult>,
  options: ResultViewOptions = {}
): ResultGroup[] {
  const filtered = filterResults(results, options)
  const sorted = sortResults(filtered, options.sort ?? 'failures')
  if (!options.groupByFile) return [{ file: '', rows: sorted }]
  return groupResultsByFile(sorted)
}
