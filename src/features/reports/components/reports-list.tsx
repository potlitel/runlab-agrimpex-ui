import { useState } from 'react'
import { Copy, Eye, FileDown, ImageIcon, Mail, MessageCircle, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { reportsApi } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ReportListItem } from '@/types/contract'
import { RUN_PDF_SECTIONS, exportRunPdf, type RunExportSection } from '../pdf/export-reports'
import { shareRunPdf, type ShareChannel } from '../pdf/share-reports'
import { ExportPdfDialog } from './export-pdf-dialog'

type ReportsListProps = {
  reports: ReportListItem[]
  loading: boolean
  error: string | null
  profileName?: string
  onSelect: (id: string) => void
}

function formatDate(ts?: string) {
  if (!ts) return '—'
  const d = new Date(ts)
  return Number.isNaN(d.getTime()) ? ts : d.toLocaleString()
}

async function copyReportId(id: string) {
  try {
    await navigator.clipboard.writeText(id)
    toast.success('ID de reporte copiado')
  } catch {
    toast.error('No se pudo copiar el ID')
  }
}

function PreviewThumb({
  reportId,
  preview,
  onSelect,
}: {
  reportId: string
  preview?: string | null
  onSelect: (id: string) => void
}) {
  const [broken, setBroken] = useState(false)
  if (!preview || broken) {
    return (
      <div
        className='flex h-16 w-28 items-center justify-center rounded-lg border border-dashed bg-muted/30 text-muted-foreground'
        title={preview ? 'No se pudo cargar la imagen' : 'Sin imagen disponible'}
      >
        <ImageIcon className='size-5' />
      </div>
    )
  }
  return (
    <button
      type='button'
      onClick={() => onSelect(reportId)}
      className='group relative block overflow-hidden rounded-lg border bg-muted/30 shadow-sm transition-all hover:border-primary/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring'
      title='Ver reporte'
    >
      <img
        src={reportsApi.assetUrl(reportId, preview)}
        alt={`Vista previa de ${reportId}`}
        className='h-16 w-28 object-cover transition-transform duration-200 group-hover:scale-110'
        loading='lazy'
        onError={() => setBroken(true)}
      />
    </button>
  )
}

export function ReportsList({
  reports,
  loading,
  error,
  profileName,
  onSelect,
}: ReportsListProps) {
  const [exportingId, setExportingId] = useState<string | null>(null)
  const [sharing, setSharing] = useState<{ id: string; channel: ShareChannel } | null>(null)
  const [customizeReport, setCustomizeReport] = useState<ReportListItem | null>(null)

  const handleDirectExport = async (report: ReportListItem) => {
    setExportingId(report.id)
    try {
      await exportRunPdf({
        reportId: report.id,
        profileName,
        fallbackReport: report,
      })
      toast.success('PDF generado correctamente')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo generar el PDF')
    } finally {
      setExportingId(null)
    }
  }

  const handleShare = async (report: ReportListItem, channel: ShareChannel) => {
    setSharing({ id: report.id, channel })
    try {
      const result = await shareRunPdf({
        channel,
        reportId: report.id,
        profileName,
        fallbackReport: report,
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
      setSharing(null)
    }
  }

  return (
    <Card>
      <CardHeader className='border-b pb-4'>
        <div className='flex items-center justify-between gap-2'>
          <CardTitle className='text-base font-semibold'>Historial de ejecuciones</CardTitle>
          <Badge variant='secondary' className='tabular-nums'>{reports.length}</Badge>
        </div>
        <p className='mt-1 text-sm text-muted-foreground'>
          Reportes generados por el perfil activo
        </p>
      </CardHeader>
      <CardContent className='p-0'>
        {loading ? (
          <div className='space-y-2 p-6'>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className='h-12 animate-pulse rounded-lg bg-muted' />
            ))}
          </div>
        ) : error ? (
          <p className='p-6 text-sm text-destructive'>{error}</p>
        ) : reports.length === 0 ? (
          <p className='p-6 text-sm text-muted-foreground'>
            No hay reportes disponibles. Ejecuta pruebas para generar historial.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className='hover:bg-transparent'>
                <TableHead className='w-[140px] ps-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>Evidencia</TableHead>
                <TableHead className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>Fecha</TableHead>
                <TableHead className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>Reporte</TableHead>
                <TableHead className='text-end text-xs font-semibold uppercase tracking-wide text-muted-foreground'>Total</TableHead>
                <TableHead className='text-end text-xs font-semibold uppercase tracking-wide text-muted-foreground'>Pasados</TableHead>
                <TableHead className='text-end text-xs font-semibold uppercase tracking-wide text-muted-foreground'>Fallidos</TableHead>
                <TableHead className='text-end text-xs font-semibold uppercase tracking-wide text-muted-foreground'>Duración</TableHead>
                <TableHead className='pe-6 text-end text-xs font-semibold uppercase tracking-wide text-muted-foreground'>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => {
                const failed = (report.summary.failed ?? 0) + (report.summary.errors ?? 0)
                const preview = report.summary.previewImage
                const busy = exportingId === report.id || sharing?.id === report.id
                return (
                  <TableRow key={report.id} className='group/row'>
                    <TableCell className='ps-6 py-3'>
                      <PreviewThumb
                        reportId={report.id}
                        preview={preview}
                        onSelect={onSelect}
                      />
                    </TableCell>
                    <TableCell className='whitespace-nowrap text-sm text-foreground/90'>
                      {formatDate(report.timestamp)}
                    </TableCell>
                    <TableCell className='max-w-[260px]'>
                      <div className='flex items-center gap-2'>
                        <span className='block truncate font-mono text-xs text-muted-foreground' title={report.id}>
                          {report.id}
                        </span>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/row:opacity-100'
                          onClick={() => void copyReportId(report.id)}
                          title='Copiar ID'
                        >
                          <Copy className='size-3.5' />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className='text-end text-sm font-medium tabular-nums'>{report.summary.total}</TableCell>
                    <TableCell className='text-end text-sm font-medium tabular-nums text-emerald-600 dark:text-emerald-400'>
                      {report.summary.passed}
                    </TableCell>
                    <TableCell className='text-end text-sm font-medium tabular-nums text-red-600 dark:text-red-400'>
                      {failed}
                    </TableCell>
                    <TableCell className='text-end text-sm tabular-nums text-muted-foreground'>
                      {report.summary.duration != null ? `${report.summary.duration.toFixed(1)}s` : '—'}
                    </TableCell>
                    <TableCell className='pe-6'>
                      <div className='flex justify-end gap-2'>
                        <Button size='sm' variant='outline' onClick={() => onSelect(report.id)}>
                          <Eye className='size-4' /> Ver
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size='sm' variant='outline' disabled={busy}>
                              <FileDown className='size-4' />
                              {busy ? '…' : 'PDF'}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem onClick={() => void handleDirectExport(report)}>
                              <FileDown className='size-4' /> Exportar PDF integral
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setCustomizeReport(report)}>
                              <SlidersHorizontal className='size-4' /> Personalizar PDF…
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => void handleShare(report, 'whatsapp')}>
                              <MessageCircle className='size-4' /> Compartir por WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => void handleShare(report, 'email')}>
                              <Mail className='size-4' /> Compartir por correo
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <ExportPdfDialog<RunExportSection>
        key={customizeReport?.id ?? 'closed'}
        open={customizeReport != null}
        onOpenChange={(open) => {
          if (!open) setCustomizeReport(null)
        }}
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
          if (!customizeReport) return
          await exportRunPdf({
            reportId: customizeReport.id,
            profileName,
            sections,
            fallbackReport: customizeReport,
          })
          toast.success('PDF generado correctamente')
        }}
      />
    </Card>
  )
}
