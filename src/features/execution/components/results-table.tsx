import { useState, type ReactNode } from 'react'
import { AlertCircle, ChevronDown, ChevronRight, Image as ImageIcon, Loader2, Paperclip, RefreshCw, Search } from 'lucide-react'
import { reportsApi } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EvidenceDialog } from '@/features/errors/components/evidence-viewer'
import {
  normalizeCaptureOrigin,
  normalizeEvidenceMetadata,
  normalizeEvidenceStatus,
} from '@/lib/evidence'
import type { EvidenceItem, EvidenceKind } from '@/types/contract'
import type { ExecutionTestResult } from '../use-execution'
import {
  selectResultGroups,
  type ResultSort,
  type ResultStatusFilter,
} from '../results-view'

type ResultsTableProps = {
  results: Record<string, ExecutionTestResult>
  reportId?: string | null
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

const statusLabels: Record<string, string> = {
  passed: 'Pasado',
  failed: 'Fallido',
  error: 'Error',
  skipped: 'Omitido',
  running: 'En curso',
}

function statusVariant(status: string) {
  if (status === 'passed') return 'default' as const
  if (status === 'failed' || status === 'error') return 'destructive' as const
  if (status === 'running') return 'secondary' as const
  return 'outline' as const
}

function attachmentKind(attachment: Record<string, unknown>): EvidenceKind {
  const contentType = String(attachment.contentType ?? '').toLowerCase()
  const name = String(
    attachment.name ?? attachment.path ?? attachment.assetPath ?? ''
  ).toLowerCase()
  if (contentType.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/.test(name)) return 'image'
  if (contentType.startsWith('video/') || /\.(mp4|webm)$/.test(name)) return 'video'
  if (name.includes('trace') || name.endsWith('.zip')) return 'trace'
  if (name.includes('context') || name.endsWith('.json')) return 'context'
  return 'other'
}

function toEvidenceItem(
  attachment: Record<string, unknown>,
  reportId: string | null | undefined,
  result: ExecutionTestResult
): EvidenceItem | null {
  const assetPath =
    typeof attachment.assetPath === 'string'
      ? attachment.assetPath
      : typeof attachment.path === 'string'
        ? attachment.path
        : ''
  const directUrl = typeof attachment.url === 'string' ? attachment.url : ''
  const url = assetPath && reportId ? reportsApi.assetUrl(reportId, assetPath) : directUrl
  if (!url) return null

  const name = String(attachment.name ?? assetPath ?? 'adjunto')
  const captureName =
    typeof attachment.captureName === 'string'
      ? attachment.captureName
      : name
  return normalizeEvidenceMetadata({
    id: `${result.id}:${assetPath || name}`,
    name,
    displayName: name,
    kind: attachmentKind(attachment),
    source: 'report' as const,
    ...(reportId ? { reportId } : {}),
    testId: result.id,
    status: normalizeEvidenceStatus(result.status),
    evidenceSource: normalizeCaptureOrigin(attachment.evidenceSource),
    captureName,
    width: attachment.width as number | null | undefined,
    height: attachment.height as number | null | undefined,
    ...(assetPath ? { assetPath } : {}),
    ...(typeof attachment.contentType === 'string'
      ? { contentType: attachment.contentType }
      : {}),
    url,
    downloadUrl: url,
  })
}

function AttachmentThumbnail({
  item,
  onOpen,
}: {
  item: EvidenceItem
  onOpen: () => void
}) {
  const [failed, setFailed] = useState(false)
  const isImage = item.kind === 'image'

  return (
    <button
      type='button'
      onClick={onOpen}
      className='flex items-center gap-1.5 overflow-hidden rounded-md border bg-muted/20 px-2 py-1 text-xs text-muted-foreground hover:border-primary/40'
      title={`Abrir evidencia ${item.displayName || item.name}${item.step ? ` · paso ${item.step}` : ''}${item.width != null && item.height != null ? ` · ${item.width}×${item.height} px` : ''}`}
    >
      {isImage && !failed ? (
        <img
          src={item.url}
          alt={item.displayName || item.name}
          className='h-8 w-10 object-contain'
          onError={() => setFailed(true)}
        />
      ) : (
        <ImageIcon className='size-3.5' />
      )}
      <span className='max-w-28 truncate'>{failed ? 'Sin vista previa' : item.displayName || item.name}</span>
    </button>
  )
}

export function ResultsTable({ results, reportId, loading = false, error = null, onRetry }: ResultsTableProps) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<ResultStatusFilter>('all')
  const [sort, setSort] = useState<ResultSort>('failures')
  const [groupByFile, setGroupByFile] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [viewer, setViewer] = useState<{ items: EvidenceItem[]; index: number } | null>(null)

  const groups = selectResultGroups(results, { query, status, sort, groupByFile })
  const visibleCount = groups.reduce((count, group) => count + group.rows.length, 0)
  const totalCount = Object.keys(results).length
  const hasFilters = !!query.trim() || status !== 'all'
  const runningLabel = loading
    ? 'Cargando resultados del catálogo…'
    : 'Aún no hay resultados. Los tests aparecerán a medida que se ejecuten.'

  function clearFilters() {
    setQuery('')
    setStatus('all')
  }

  function openEvidence(result: ExecutionTestResult, index: number) {
    const items = (result.attachments ?? [])
      .map((attachment) => toEvidenceItem(attachment, reportId, result))
      .filter((item): item is EvidenceItem => item !== null)
    if (items.length) setViewer({ items, index })
  }

  function renderRow(result: ExecutionTestResult) {
    const output = result.errorMsg || result.output || ''
    const attachments = (result.attachments ?? [])
      .map((attachment) => toEvidenceItem(attachment, reportId, result))
      .filter((item): item is EvidenceItem => item !== null)
    const hasOutput = !!output.trim()

    return (
      <TableRow key={result.id}>
        <TableCell className='max-w-[320px]'>
          <span className='block truncate font-mono text-xs'>
            {result.id.split('::').slice(1).join(' :: ') || result.id}
          </span>
          <span className='block truncate text-xs text-muted-foreground'>
            {result.id.split('::')[0]}
          </span>
        </TableCell>
        <TableCell>
          <Badge variant={statusVariant(result.status)}>
            {statusLabels[result.status] ?? result.status}
          </Badge>
        </TableCell>
        <TableCell className='text-end tabular-nums'>
          {result.duration !== undefined ? `${result.duration.toFixed(2)}s` : '—'}
        </TableCell>
        <TableCell className='max-w-[360px]'>
          <div className='space-y-2'>
            <button
              type='button'
              aria-expanded={!!expanded[result.id]}
              aria-label={`Ver salida completa de ${result.id}`}
              onClick={() =>
                setExpanded((prev) => ({ ...prev, [result.id]: !prev[result.id] }))
              }
              className='flex w-full items-center gap-1 text-start text-xs text-muted-foreground hover:text-foreground'
              disabled={!hasOutput}
            >
              {expanded[result.id] ? (
                <ChevronDown className='size-3.5' />
              ) : (
                <ChevronRight className='size-3.5' />
              )}
              <span className='truncate'>
                {hasOutput ? output : 'Sin salida ni adjuntos'}
              </span>
            </button>
            {expanded[result.id] && hasOutput && (
              <pre className='max-h-32 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/20 p-2 text-xs'>
                {output}
              </pre>
            )}
            {attachments.length > 0 && (
              <div className='flex flex-wrap items-center gap-1.5'>
                <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                  <Paperclip className='size-3.5' /> Evidencias ({attachments.length})
                </span>
                {attachments.map((item, index) => (
                  <AttachmentThumbnail
                    key={item.id}
                    item={item}
                    onOpen={() => openEvidence(result, index)}
                  />
                ))}
              </div>
            )}
          </div>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className='border-b pb-4'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <CardTitle>Resultados por test</CardTitle>
            <Badge variant='secondary'>
              {hasFilters ? `${visibleCount}/${totalCount}` : totalCount}
            </Badge>
          </div>
          <p className='mt-1 text-sm text-muted-foreground'>
            Estado y salida de los tests reportados por la corrida actual
          </p>
          <div className='mt-3 flex flex-wrap items-center gap-2'>
            <div className='relative min-w-48 flex-1'>
              <Search className='absolute left-2.5 top-2.5 size-4 text-muted-foreground' />
              <Input
                aria-label='Buscar test'
                placeholder='Buscar por test…'
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className='h-9 ps-8'
              />
            </div>
            <select
              aria-label='Filtrar por estado'
              value={status}
              onChange={(event) => setStatus(event.target.value as ResultStatusFilter)}
              className='h-9 rounded-md border border-input bg-background px-3 text-sm'
            >
              <option value='all'>Todos los estados</option>
              <option value='failed'>Fallido</option>
              <option value='error'>Error</option>
              <option value='passed'>Pasado</option>
              <option value='skipped'>Omitido</option>
              <option value='running'>En curso</option>
            </select>
            <select
              aria-label='Ordenar resultados'
              value={sort}
              onChange={(event) => setSort(event.target.value as ResultSort)}
              className='h-9 rounded-md border border-input bg-background px-3 text-sm'
            >
              <option value='failures'>Ordenar: fallos primero</option>
              <option value='duration'>Ordenar: duración</option>
            </select>
            <Button
              variant='outline'
              size='sm'
              aria-pressed={groupByFile}
              onClick={() => setGroupByFile((prev) => !prev)}
            >
              Agrupar por archivo
            </Button>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          {error && (
            <div className='flex flex-wrap items-center gap-2 border-b border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive'>
              <AlertCircle className='size-4' />
              <span>{error}</span>
              {onRetry && (
                <Button variant='link' size='sm' className='h-auto p-0' onClick={onRetry}>
                  <RefreshCw className='size-3.5' /> Reintentar
                </Button>
              )}
            </div>
          )}
          {totalCount === 0 ? (
            <p className='flex items-center gap-2 p-6 text-sm text-muted-foreground'>
              {loading && <Loader2 className='size-4 animate-spin' aria-label='Cargando resultados' />}
              {runningLabel}
            </p>
          ) : visibleCount === 0 ? (
            <div className='flex flex-wrap items-center gap-3 p-6 text-sm text-muted-foreground'>
              <span>Sin coincidencias con los filtros actuales.</span>
              <Button variant='outline' size='sm' onClick={clearFilters}>
                Limpiar filtros
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className='text-end'>Duración</TableHead>
                  <TableHead>Salida</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group) => (
                  <GroupRows key={group.file || 'all'} group={group} renderRow={renderRow} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <EvidenceDialog
        item={viewer?.items[viewer.index] ?? null}
        index={viewer?.index ?? -1}
        total={viewer?.items.length ?? 0}
        onClose={() => setViewer(null)}
        onPrev={() =>
          setViewer((prev) =>
            prev ? { ...prev, index: Math.max(0, prev.index - 1) } : null
          )
        }
        onNext={() =>
          setViewer((prev) =>
            prev
              ? { ...prev, index: Math.min(prev.items.length - 1, prev.index + 1) }
              : null
          )
        }
      />
    </>
  )
}

function GroupRows({
  group,
  renderRow,
}: {
  group: { file: string; rows: ExecutionTestResult[] }
  renderRow: (result: ExecutionTestResult) => ReactNode
}) {
  return (
    <>
      {group.file && (
        <TableRow className='bg-muted/30'>
          <TableCell colSpan={4} className='font-mono text-xs text-muted-foreground'>
            {group.file} ({group.rows.length})
          </TableCell>
        </TableRow>
      )}
      {group.rows.map(renderRow)}
    </>
  )
}
