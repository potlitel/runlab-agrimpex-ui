import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import type { EvidenceItem, EvidenceKind } from '@/types/contract'
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  FilterX,
  FolderTree,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  PlayCircle,
  RefreshCw,
  Search,
} from 'lucide-react'
import { AnimatePresence, m, useAnimationControls } from 'motion/react'
import { reportsApi } from '@/lib/api'
import {
  normalizeCaptureOrigin,
  normalizeEvidenceMetadata,
  normalizeEvidenceStatus,
} from '@/lib/evidence'
import { DURATION, EASE_OUT, collapse } from '@/lib/motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EvidenceDialog } from '@/features/errors/components/evidence-viewer'
import { shouldFlashStatus } from '../results-motion'
import {
  selectResultGroups,
  type ResultSort,
  type ResultStatusFilter,
} from '../results-view'
import type { ExecutionTestResult } from '../use-execution'
import { ExecutionEmptyState } from './execution-empty-state'

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
  if (contentType.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/.test(name))
    return 'image'
  if (contentType.startsWith('video/') || /\.(mp4|webm)$/.test(name))
    return 'video'
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
  const url =
    assetPath && reportId ? reportsApi.assetUrl(reportId, assetPath) : directUrl
  if (!url) return null

  const name = String(attachment.name ?? assetPath ?? 'adjunto')
  const captureName =
    typeof attachment.captureName === 'string' ? attachment.captureName : name
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
      <span className='max-w-28 truncate'>
        {failed ? 'Sin vista previa' : item.displayName || item.name}
      </span>
    </button>
  )
}

export function ResultsTable({
  results,
  reportId,
  loading = false,
  error = null,
  onRetry,
}: ResultsTableProps) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<ResultStatusFilter>('all')
  const [sort, setSort] = useState<ResultSort>('failures')
  const [groupByFile, setGroupByFile] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [viewer, setViewer] = useState<{
    items: EvidenceItem[]
    index: number
  } | null>(null)
  const seenIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    Object.keys(results).forEach((id) => seenIds.current.add(id))
  }, [results])

  const groups = selectResultGroups(results, {
    query,
    status,
    sort,
    groupByFile,
  })
  const visibleCount = groups.reduce(
    (count, group) => count + group.rows.length,
    0
  )
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
    return (
      <ResultRow
        key={result.id}
        result={result}
        isNew={!seenIds.current.has(result.id)}
        expanded={!!expanded[result.id]}
        attachments={(result.attachments ?? [])
          .map((attachment) => toEvidenceItem(attachment, reportId, result))
          .filter((item): item is EvidenceItem => item !== null)}
        onToggle={() =>
          setExpanded((prev) => ({
            ...prev,
            [result.id]: !prev[result.id],
          }))
        }
        onOpenEvidence={(index) => openEvidence(result, index)}
      />
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
              <Search className='absolute top-2.5 left-2.5 size-4 text-muted-foreground' />
              <Input
                aria-label='Buscar test'
                placeholder='Buscar por test…'
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className='h-9 ps-8'
              />
            </div>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as ResultStatusFilter)}
            >
              <SelectTrigger
                aria-label='Filtrar por estado'
                className='w-full min-w-44 bg-background sm:w-52'
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Todos los estados</SelectItem>
                <SelectItem value='failed'>Fallido</SelectItem>
                <SelectItem value='error'>Error</SelectItem>
                <SelectItem value='passed'>Pasado</SelectItem>
                <SelectItem value='skipped'>Omitido</SelectItem>
                <SelectItem value='running'>En curso</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sort}
              onValueChange={(value) => setSort(value as ResultSort)}
            >
              <SelectTrigger
                aria-label='Ordenar resultados'
                className='w-full min-w-56 bg-background sm:w-64'
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='failures'>
                  Ordenar: fallos primero
                </SelectItem>
                <SelectItem value='duration'>Ordenar: duración</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant='outline'
              size='sm'
              aria-pressed={groupByFile}
              onClick={() => setGroupByFile((prev) => !prev)}
            >
              <FolderTree className='size-4' /> Agrupar por archivo
            </Button>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          {error && (
            <div className='flex flex-wrap items-center gap-2 border-b border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive'>
              <AlertCircle className='size-4' />
              <span>{error}</span>
              {onRetry && (
                <Button
                  variant='link'
                  size='sm'
                  className='h-auto p-0'
                  onClick={onRetry}
                >
                  <RefreshCw className='size-3.5' /> Reintentar
                </Button>
              )}
            </div>
          )}
          {totalCount === 0 ? (
            <div className='p-4'>
              <ExecutionEmptyState
                icon={Search}
                title={loading ? 'Cargando…' : 'Resultados vacíos'}
                description={runningLabel}
                action={
                  !loading ? (
                    <Button variant='outline' size='sm' asChild>
                      <Link to='/tests'>
                        <PlayCircle className='size-4' /> Iniciar Corrida
                      </Link>
                    </Button>
                  ) : (
                    <Loader2
                      className='size-4 animate-spin'
                      aria-label='Cargando resultados'
                    />
                  )
                }
              />
            </div>
          ) : visibleCount === 0 ? (
            <div className='p-4'>
              <ExecutionEmptyState
                icon={Search}
                title='Sin coincidencias con los filtros actuales'
                description='Ajusta la búsqueda o el estado para ver otros resultados.'
                action={
                  <Button variant='outline' size='sm' onClick={clearFilters}>
                    <FilterX className='size-4' /> Limpiar filtros
                  </Button>
                }
              />
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
                  <GroupRows
                    key={group.file || 'all'}
                    group={group}
                    renderRow={renderRow}
                  />
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
              ? {
                  ...prev,
                  index: Math.min(prev.items.length - 1, prev.index + 1),
                }
              : null
          )
        }
      />
    </>
  )
}

function ResultRow({
  result,
  isNew,
  expanded,
  attachments,
  onToggle,
  onOpenEvidence,
}: {
  result: ExecutionTestResult
  isNew: boolean
  expanded: boolean
  attachments: EvidenceItem[]
  onToggle: () => void
  onOpenEvidence: (index: number) => void
}) {
  const output = result.errorMsg || result.output || ''
  const hasOutput = !!output.trim()
  const controls = useAnimationControls()
  const previousStatus = useRef(result.status)
  const entered = useRef(false)

  useEffect(() => {
    if (!isNew || entered.current) return
    entered.current = true
    void controls.start({
      opacity: 1,
      y: 0,
      transition: { duration: DURATION.fast, ease: EASE_OUT },
    })
  }, [controls, isNew])

  useEffect(() => {
    const previous = previousStatus.current
    previousStatus.current = result.status
    if (!shouldFlashStatus(previous, result.status)) return
    const background =
      result.status === 'passed'
        ? 'rgba(16, 185, 129, 0.24)'
        : 'rgba(239, 68, 68, 0.24)'
    void controls.start({
      backgroundColor: [background, 'rgba(0, 0, 0, 0)'],
      transition: { duration: 0.6, ease: 'easeOut' },
    })
  }, [controls, result.status])

  return (
    <m.tr
      data-entry={isNew ? 'new' : 'known'}
      initial={isNew ? { opacity: 0, y: 3 } : false}
      animate={controls}
    >
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
            aria-expanded={expanded}
            aria-label={`Ver salida completa de ${result.id}`}
            onClick={onToggle}
            className='flex w-full items-center gap-1 text-start text-xs text-muted-foreground hover:text-foreground'
            disabled={!hasOutput}
          >
            {expanded ? (
              <ChevronDown className='size-3.5' />
            ) : (
              <ChevronRight className='size-3.5' />
            )}
            <span className='truncate'>
              {hasOutput ? output : 'Sin salida ni adjuntos'}
            </span>
          </button>
          <AnimatePresence initial={false}>
            {expanded && hasOutput && (
              <m.div
                key='output'
                variants={collapse}
                initial='hidden'
                animate='show'
                exit='exit'
                className='overflow-hidden'
              >
                <pre className='max-h-32 overflow-auto rounded-md border bg-muted/20 p-2 text-xs whitespace-pre-wrap'>
                  {output}
                </pre>
              </m.div>
            )}
          </AnimatePresence>
          {attachments.length > 0 && (
            <div className='flex flex-wrap items-center gap-1.5'>
              <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                <Paperclip className='size-3.5' /> Evidencias (
                {attachments.length})
              </span>
              {attachments.map((item, index) => (
                <AttachmentThumbnail
                  key={item.id}
                  item={item}
                  onOpen={() => onOpenEvidence(index)}
                />
              ))}
            </div>
          )}
        </div>
      </TableCell>
    </m.tr>
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
          <TableCell
            colSpan={4}
            className='font-mono text-xs text-muted-foreground'
          >
            {group.file} ({group.rows.length})
          </TableCell>
        </TableRow>
      )}
      {group.rows.map(renderRow)}
    </>
  )
}
