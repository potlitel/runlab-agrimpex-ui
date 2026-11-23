import { useState } from 'react'
import { Eye, FileDown, ImageIcon, SlidersHorizontal } from 'lucide-react'
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
        className='flex h-12 w-20 items-center justify-center rounded-md border border-dashed bg-muted/20 text-muted-foreground'
        title={preview ? 'No se pudo cargar la imagen' : 'Sin imagen disponible'}
      >
        <ImageIcon className='size-4' />
      </div>
    )
  }
  return (
    <button
      type='button'
      onClick={() => onSelect(reportId)}
      className='group block overflow-hidden rounded-md border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-ring'
      title='Ver reporte'
    >
      <img
        src={reportsApi.assetUrl(reportId, preview)}
        alt={`Vista previa de ${reportId}`}
        className='h-12 w-20 object-cover transition-transform group-hover:scale-105'
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

  return (
    <Card>
      <CardHeader className='border-b pb-4'>
        <div className='flex items-center justify-between gap-2'>
          <CardTitle>Historial de ejecuciones</CardTitle>
          <Badge variant='secondary'>{reports.length}</Badge>
        </div>
        <p className='mt-1 text-sm text-muted-foreground'>
          Reportes generados por el perfil activo
        </p>
      </CardHeader>
      <CardContent className='p-0'>
        {loading ? (
          <div className='space-y-2 p-6'>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className='h-10 animate-pulse rounded bg-muted' />
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
              <TableRow>
                <TableHead className='w-[96px]'>Evidencia</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Reporte</TableHead>
                <TableHead className='text-end'>Total</TableHead>
                <TableHead className='text-end'>Pasados</TableHead>
                <TableHead className='text-end'>Fallidos</TableHead>
                <TableHead className='text-end'>Duración</TableHead>
                <TableHead className='text-end'>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => {
                const failed = (report.summary.failed ?? 0) + (report.summary.errors ?? 0)
                const preview = report.summary.previewImage
                const exporting = exportingId === report.id
                return (
                  <TableRow key={report.id}>
                    <TableCell>
                      <PreviewThumb
                        reportId={report.id}
                        preview={preview}
                        onSelect={onSelect}
                      />
                    </TableCell>
                    <TableCell className='whitespace-nowrap text-sm'>
                      {formatDate(report.timestamp)}
                    </TableCell>
                    <TableCell className='max-w-[220px]'>
                      <span className='block truncate font-mono text-xs'>{report.id}</span>
                    </TableCell>
                    <TableCell className='text-end tabular-nums'>{report.summary.total}</TableCell>
                    <TableCell className='text-end tabular-nums text-emerald-600 dark:text-emerald-400'>
                      {report.summary.passed}
                    </TableCell>
                    <TableCell className='text-end tabular-nums text-destructive'>{failed}</TableCell>
                    <TableCell className='text-end tabular-nums'>
                      {report.summary.duration != null ? `${report.summary.duration.toFixed(1)}s` : '—'}
                    </TableCell>
                    <TableCell>
                      <div className='flex justify-end gap-1'>
                        <Button size='sm' variant='ghost' onClick={() => onSelect(report.id)}>
                          <Eye className='size-4' /> Ver
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size='sm' variant='outline' disabled={exporting}>
                              <FileDown className='size-4' />
                              {exporting ? '…' : 'PDF'}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem onClick={() => void handleDirectExport(report)}>
                              <FileDown className='size-4' /> Exportar PDF integral
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setCustomizeReport(report)}>
                              <SlidersHorizontal className='size-4' /> Personalizar PDF…
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
