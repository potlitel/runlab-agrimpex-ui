import { useState } from 'react'
import { Download, ExternalLink, FileDown, ImageIcon, Mail, MessageCircle, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
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
import type { ReportAttachment, ReportDetail, ReportListItem } from '@/types/contract'
import { RUN_PDF_SECTIONS, exportRunPdf, type RunExportSection } from '../pdf/export-reports'
import { shareRunPdf, type ShareChannel } from '../pdf/share-reports'
import { ExportPdfDialog } from './export-pdf-dialog'

type ReportDetailSheetProps = {
  open: boolean
  report: ReportListItem | null
  detail: ReportDetail | null
  loading: boolean
  error: string | null
  profileName?: string
  onOpenChange: (open: boolean) => void
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

function isImageAttachment(att: ReportAttachment) {
  const ct = String(att.contentType || '').toLowerCase()
  if (ct.startsWith('image/')) return true
  const name = String(att.name || '').toLowerCase()
  if (name.includes('screenshot')) return true
  return /\.(png|jpe?g|gif|webp)$/i.test(String(att.path || att.assetPath || ''))
}

export function ReportDetailSheet({
  open,
  report,
  detail,
  loading,
  error,
  profileName,
  onOpenChange,
}: ReportDetailSheetProps) {
  const [exporting, setExporting] = useState(false)
  const [sharingChannel, setSharingChannel] = useState<ShareChannel | null>(null)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const reportId = report?.id ?? detail?.id ?? null
  const summary = detail?.summary ?? report?.summary
  const tests = detail?.tests ?? []

  const handleExport = async (sections?: RunExportSection[]) => {
    if (!reportId) return
    setExporting(true)
    try {
      await exportRunPdf({
        reportId,
        profileName,
        sections,
        fallbackReport: detail ?? report,
      })
      toast.success('PDF generado correctamente')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo generar el PDF')
    } finally {
      setExporting(false)
    }
  }

  const handleShare = async (channel: ShareChannel) => {
    if (!reportId) return
    setSharingChannel(channel)
    try {
      const result = await shareRunPdf({
        channel,
        reportId,
        profileName,
        fallbackReport: detail ?? report,
      })
      if (result.status === 'shared') {
        toast.success(channel === 'whatsapp' ? 'Reporte compartido por WhatsApp' : 'Reporte compartido por correo')
      } else if (result.status === 'fallback') {
        toast.info(
          channel === 'whatsapp'
            ? 'Se abrió WhatsApp con mensaje prellenado. Adjunta el PDF descargado si es necesario.'
            : 'Se abrió el correo con asunto y mensaje prellenado. Adjunta el PDF descargado.'
        )
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo compartir el PDF')
    } finally {
      setSharingChannel(null)
    }
  }

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
                <Button
                  variant='default'
                  size='sm'
                  onClick={() => void handleExport()}
                  disabled={exporting || sharingChannel !== null}
                >
                  <FileDown className='size-4' /> {exporting ? 'Generando…' : 'Exportar PDF'}
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCustomizeOpen(true)}
                  disabled={exporting || sharingChannel !== null}
                >
                  <SlidersHorizontal className='size-4' /> Personalizar PDF…
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => void handleShare('whatsapp')}
                  disabled={exporting || sharingChannel !== null}
                >
                  <MessageCircle className='size-4' /> {sharingChannel === 'whatsapp' ? 'Compartiendo…' : 'WhatsApp'}
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => void handleShare('email')}
                  disabled={exporting || sharingChannel !== null}
                >
                  <Mail className='size-4' /> {sharingChannel === 'email' ? 'Compartiendo…' : 'Correo'}
                </Button>
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
                  {tests.map((test) => {
                    const images = (test.attachments ?? []).filter(
                      (att) => att.assetPath && isImageAttachment(att)
                    )
                    return (
                      <TableRow key={test.id}>
                        <TableCell className='max-w-[260px] align-top'>
                          <span className='block truncate font-mono text-xs'>
                            {test.id.split('::').slice(1).join(' :: ') || test.id}
                          </span>
                          <span className='block truncate text-xs text-muted-foreground'>
                            {test.id.split('::')[0]}
                          </span>
                        </TableCell>
                        <TableCell className='align-top'>
                          <Badge variant={statusVariant(test.status)}>{test.status}</Badge>
                        </TableCell>
                        <TableCell className='text-end tabular-nums align-top'>
                          {test.duration != null ? `${test.duration.toFixed(2)}s` : '—'}
                        </TableCell>
                        <TableCell className='max-w-[360px] align-top'>
                          <div className='space-y-2'>
                            <pre className='max-h-24 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground'>
                              {test.errorMsg || test.output || '—'}
                            </pre>
                            {reportId && images.length > 0 && (
                              <div className='space-y-1.5'>
                                <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                                  <ImageIcon className='size-3.5' /> Evidencias ({images.length})
                                </div>
                                <div className='flex flex-wrap gap-2'>
                                  {images.map((att, idx) => (
                                    <a
                                      key={`${att.assetPath}-${idx}`}
                                      href={reportsApi.assetUrl(reportId, att.assetPath!)}
                                      target='_blank'
                                      rel='noreferrer'
                                      className='block overflow-hidden rounded-md border bg-muted/20 focus:outline-none focus:ring-2 focus:ring-ring'
                                      title={att.name || 'Ver imagen'}
                                    >
                                      <img
                                        src={reportsApi.assetUrl(reportId, att.assetPath!)}
                                        alt={att.name || `Evidencia ${idx + 1}`}
                                        className='h-20 w-28 object-contain'
                                        loading='lazy'
                                      />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </ScrollArea>

        <ExportPdfDialog<RunExportSection>
          key={customizeOpen ? `run-${reportId ?? 'none'}` : 'run-closed'}
          open={customizeOpen}
          onOpenChange={setCustomizeOpen}
          title='Personalizar PDF de corrida'
          description='Selecciona las secciones que quieres incluir en el PDF integral.'
          sections={[
            { id: 'cover', label: 'Portada', description: 'Perfil, reporte, fecha y generación.' },
            { id: 'summary', label: 'Resumen ejecutivo', description: 'Totales, pasados, fallidos y duración.' },
            { id: 'tests', label: 'Resultados por test', description: 'Estado, duración y error/salida.' },
            { id: 'evidence', label: 'Evidencias', description: 'Imágenes adjuntas y otros adjuntos listados.' },
            { id: 'footer', label: 'Pie', description: 'Fecha de generación y paginación.' },
          ]}
          defaultSections={[...RUN_PDF_SECTIONS]}
          onConfirm={async (sections) => {
            await handleExport(sections)
          }}
        />
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
