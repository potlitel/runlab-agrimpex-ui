import { Download, ExternalLink, Trash2 } from 'lucide-react'
import { reportsApi } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ReportDetail, ReportListItem } from '@/types/contract'

type ReportDetailSheetProps = {
  open: boolean
  report: ReportListItem | null
  detail: ReportDetail | null
  loading: boolean
  error: string | null
  deleting: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (id: string) => void
}

function statusVariant(status: string) {
  if (status === 'passed') return 'default' as const
  if (status === 'failed' || status === 'error') return 'destructive' as const
  return 'outline' as const
}

function formatDate(ts?: string) {
  if (!ts) return '—'
  const d = new Date(ts)
  return Number.isNaN(d.getTime()) ? ts : d.toLocaleString()
}

export function ReportDetailSheet({
  open,
  report,
  detail,
  loading,
  error,
  deleting,
  onOpenChange,
  onDelete,
}: ReportDetailSheetProps) {
  const reportId = report?.id ?? detail?.id ?? null
  const summary = detail?.summary ?? report?.summary
  const tests = detail?.tests ?? []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='w-full gap-0 p-0 sm:max-w-3xl'>
        <SheetHeader className='border-b px-6 py-4'>
          <SheetTitle className='truncate pr-8 font-mono text-sm'>
            {reportId ?? 'Reporte'}
          </SheetTitle>
          <SheetDescription>
            {formatDate(detail?.timestamp ?? report?.timestamp)}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className='h-[calc(100svh-5.5rem)]'>
          <div className='space-y-4 p-6'>
            {summary && (
              <div className='grid grid-cols-2 gap-2 sm:grid-cols-5'>
                <Metric label='Total' value={summary.total} />
                <Metric label='Pasados' value={summary.passed} tone='text-emerald-600 dark:text-emerald-400' />
                <Metric label='Fallidos' value={(summary.failed ?? 0) + (summary.errors ?? 0)} tone='text-destructive' />
                <Metric label='Omitidos' value={summary.skipped ?? 0} />
                <Metric label='Duración' value={summary.duration != null ? `${summary.duration.toFixed(1)}s` : '—'} />
              </div>
            )}

            {reportId && (
              <div className='flex flex-wrap items-center gap-2'>
                <Button variant='outline' size='sm' asChild>
                  <a href={reportsApi.downloadJsonUrl(reportId)} target='_blank' rel='noreferrer'>
                    <Download className='size-4' /> JSON
                  </a>
                </Button>
                <Button variant='outline' size='sm' asChild>
                  <a href={reportsApi.downloadHtmlUrl(reportId)} target='_blank' rel='noreferrer'>
                    <ExternalLink className='size-4' /> HTML
                  </a>
                </Button>
                <div className='flex-1' />
                <Button
                  variant='destructive'
                  size='sm'
                  disabled={deleting || !reportId}
                  onClick={() => {
                    if (!reportId) return
                    const ok = window.confirm(`¿Eliminar el reporte ${reportId}? Esta acción no se puede deshacer.`)
                    if (ok) onDelete(reportId)
                  }}
                >
                  <Trash2 className='size-4' /> {deleting ? 'Eliminando…' : 'Eliminar'}
                </Button>
              </div>
            )}

            <Separator />

            {loading ? (
              <p className='text-sm text-muted-foreground'>Cargando detalle…</p>
            ) : error ? (
              <p className='rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive'>
                {error}
              </p>
            ) : tests.length === 0 ? (
              <p className='text-sm text-muted-foreground'>Este reporte no contiene resultados de tests.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className='text-end'>Duración</TableHead>
                    <TableHead>Error / salida</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tests.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell className='max-w-[260px]'>
                        <span className='block truncate font-mono text-xs'>
                          {test.id.split('::').slice(1).join(' :: ') || test.id}
                        </span>
                        <span className='block truncate text-xs text-muted-foreground'>
                          {test.id.split('::')[0]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(test.status)}>{test.status}</Badge>
                      </TableCell>
                      <TableCell className='text-end tabular-nums'>
                        {test.duration != null ? `${test.duration.toFixed(2)}s` : '—'}
                      </TableCell>
                      <TableCell className='max-w-[320px]'>
                        <pre className='max-h-24 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground'>
                          {test.errorMsg || test.output || '—'}
                        </pre>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className='rounded-md border bg-muted/20 px-3 py-2'>
      <div className='text-xs text-muted-foreground'>{label}</div>
      <div className={`text-lg font-semibold tabular-nums ${tone ?? ''}`}>{value}</div>
    </div>
  )
}
