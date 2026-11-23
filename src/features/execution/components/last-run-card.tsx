import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileDown,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import { reportsApi } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ReportDetailSheet } from '@/features/reports/components/report-detail-sheet'
import { exportRunPdf } from '@/features/reports/pdf/export-reports'
import type { ReportListItem, ReportSummary } from '@/types/contract'
import type { ExecutionProgress } from '../use-execution'

export type LastRunCardProps = {
  reportId: string | null
  timestamp: string | null
  summary: ReportSummary | null
  progress: ExecutionProgress
  status: 'completed' | 'aborted' | null
  reportsEnabled: boolean
  featuresError?: string | null
  profileName?: string
}

function formatDate(timestamp: string | null) {
  if (!timestamp) return 'Fecha no disponible'
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime()) ? timestamp : date.toLocaleString()
}

export function LastRunCard({
  reportId,
  timestamp,
  summary,
  progress,
  status,
  reportsEnabled,
  featuresError,
  profileName,
}: LastRunCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const fallbackReport: ReportListItem | null = reportId
    ? {
        id: reportId,
        ...(timestamp ? { timestamp } : {}),
        summary: summary ?? { total: 0, passed: 0, failed: 0 },
      }
    : null

  const detailQuery = useQuery({
    queryKey: ['reports', 'execution-dashboard', 'detail', reportId],
    queryFn: () => reportsApi.get(reportId as string),
    enabled: reportsEnabled && sheetOpen && !!reportId,
    retry: false,
  })

  async function handleExport() {
    if (!reportId) return
    setExporting(true)
    try {
      await exportRunPdf({ reportId, profileName, fallbackReport })
      toast.success('PDF de la corrida generado correctamente')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo generar el PDF')
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className='border-b pb-4'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <CardTitle className='flex items-center gap-2'>
              <FileText className='size-4' /> Última corrida
              {status && (
                <Badge variant={status === 'aborted' ? 'destructive' : 'default'}>
                  {status === 'aborted' ? 'Abortada' : 'Completada'}
                </Badge>
              )}
            </CardTitle>
            {reportId && (
              <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                <Clock className='size-3.5' /> {formatDate(timestamp)}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className='space-y-3 pt-4'>
          {!reportId ? (
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <p className='text-sm text-muted-foreground'>
                Todavía no hay una corrida finalizada en esta sesión.
              </p>
              <Button variant='outline' size='sm' asChild>
                <Link to='/tests'>Ir a Tests</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className='flex flex-wrap gap-x-5 gap-y-1 text-sm'>
                <span className='text-muted-foreground'>
                  Total: <span className='font-semibold text-foreground tabular-nums'>{summary?.total ?? 0}</span>
                </span>
                <span className='flex items-center gap-1 text-emerald-600 dark:text-emerald-400'>
                  <CheckCircle2 className='size-3.5' /> Pasados:{' '}
                  <span className='font-semibold tabular-nums'>{summary?.passed ?? 0}</span>
                </span>
                <span className='flex items-center gap-1 text-destructive'>
                  <AlertCircle className='size-3.5' /> Fallidos/errores:{' '}
                  <span className='font-semibold tabular-nums'>
                    {(summary?.failed ?? 0) + (summary?.errors ?? 0)}
                  </span>
                </span>
                <span className='text-muted-foreground'>
                  Duración:{' '}
                  <span className='font-semibold text-foreground tabular-nums'>
                    {summary?.duration != null ? `${summary.duration.toFixed(1)}s` : '—'}
                  </span>
                </span>
              </div>

              {status === 'aborted' && (
                <p className='flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm'>
                  <Ban className='size-4 text-destructive' />
                  Progreso alcanzado antes del aborto: {progress.current}/{progress.total} ({progress.percentage}%)
                </p>
              )}

              {reportsEnabled ? (
                <div className='flex flex-wrap items-center gap-2 border-t pt-3'>
                  <Button variant='default' size='sm' onClick={() => setSheetOpen(true)}>
                    <FileText className='size-4' /> Ver reporte
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => void handleExport()}
                    disabled={exporting}
                  >
                    <FileDown className='size-4' /> {exporting ? 'Generando…' : 'Exportar PDF'}
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
              ) : (
                <div className='flex flex-wrap items-center gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground'>
                  <span>
                    {featuresError ?? 'El módulo de reportes no está disponible para este perfil.'}
                  </span>
                  <Button variant='link' size='sm' className='h-auto p-0' asChild>
                    <Link to='/settings'>Revisar módulos en Ajustes</Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {fallbackReport && (
        <ReportDetailSheet
          open={sheetOpen}
          report={fallbackReport}
          detail={detailQuery.data ?? null}
          loading={detailQuery.isPending}
          error={
            detailQuery.error instanceof Error
              ? detailQuery.error.message
              : null
          }
          profileName={profileName}
          onOpenChange={setSheetOpen}
        />
      )}
    </>
  )
}
