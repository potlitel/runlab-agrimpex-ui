import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import type { ReportListItem, ReportSummary } from '@/types/contract'
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileDown,
  FileText,
  PlayCircle,
  Settings,
} from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { toast } from 'sonner'
import { reportsApi } from '@/lib/api'
import { collapse, popIn } from '@/lib/motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AnimatedNumber } from '@/components/motion/animated-number'
import { ReportDetailSheet } from '@/features/reports/components/report-detail-sheet'
import { exportRunPdf } from '@/features/reports/pdf/export-reports'
import type { ExecutionProgress } from '../use-execution'
import { ExecutionEmptyState } from './execution-empty-state'

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
      toast.error(
        error instanceof Error ? error.message : 'No se pudo generar el PDF'
      )
    } finally {
      setExporting(false)
    }
  }

  const passed = summary?.passed ?? 0
  const failed = summary?.failed ?? 0
  const errors = summary?.errors ?? 0
  const executed = passed + failed + errors
  const passRate = executed > 0 ? Math.round((passed / executed) * 100) : 0

  return (
    <>
      <Card>
        <CardHeader className='border-b pb-4'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <CardTitle className='flex items-center gap-2'>
              <FileText className='size-4' /> Última corrida
              <AnimatePresence mode='wait' initial={false}>
                {status && (
                  <m.span
                    key={status}
                    variants={popIn}
                    initial='hidden'
                    animate='show'
                    exit='exit'
                    className='inline-flex'
                  >
                    <Badge
                      variant={status === 'aborted' ? 'destructive' : 'default'}
                    >
                      {status === 'aborted' ? 'Abortada' : 'Completada'}
                    </Badge>
                  </m.span>
                )}
              </AnimatePresence>
            </CardTitle>
            {reportId && (
              <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                <Clock className='size-3.5' /> {formatDate(timestamp)}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className='space-y-3 pt-4'>
          <AnimatePresence mode='wait' initial={false}>
            {!reportId ? (
              <m.div
                key='empty'
                variants={collapse}
                initial='hidden'
                animate='show'
                exit='exit'
                className='overflow-hidden'
              >
                <div className='space-y-3'>
                  <div className='grid grid-cols-1 gap-2 sm:grid-cols-3'>
                    {['Fecha', 'Duración', 'Tasa de éxito'].map((label) => (
                      <div
                        key={label}
                        className='space-y-2 rounded-md border bg-muted/20 p-3'
                      >
                        <span className='block text-xs text-muted-foreground'>
                          {label}
                        </span>
                        <Skeleton aria-hidden='true' className='h-4 w-24' />
                      </div>
                    ))}
                  </div>
                  <ExecutionEmptyState
                    icon={PlayCircle}
                    title='Aún no hay resultados'
                    description='Todavía no hay una corrida finalizada en esta sesión. Aquí aparecerán la fecha, la duración y la tasa de éxito.'
                    action={
                      <Button variant='outline' size='sm' asChild>
                        <Link to='/tests'>
                          <PlayCircle className='size-4' /> Iniciar Corrida
                        </Link>
                      </Button>
                    }
                  />
                </div>
              </m.div>
            ) : (
              <m.div
                key='content'
                variants={collapse}
                initial='hidden'
                animate='show'
                exit='exit'
                className='space-y-3 overflow-hidden'
              >
                <div className='flex flex-wrap gap-x-5 gap-y-1 text-sm'>
                  <span className='text-muted-foreground'>
                    Total:{' '}
                    <AnimatedNumber
                      value={summary?.total ?? 0}
                      className='font-semibold text-foreground tabular-nums'
                    />
                  </span>
                  <span className='flex items-center gap-1 text-emerald-600 dark:text-emerald-400'>
                    <CheckCircle2 className='size-3.5' /> Pasados:{' '}
                    <AnimatedNumber
                      value={passed}
                      className='font-semibold tabular-nums'
                    />
                  </span>
                  <span className='flex items-center gap-1 text-destructive'>
                    <AlertCircle className='size-3.5' /> Fallidos/errores:{' '}
                    <AnimatedNumber
                      value={failed + errors}
                      className='font-semibold tabular-nums'
                    />
                  </span>
                  <span className='text-muted-foreground'>
                    Duración:{' '}
                    {summary?.duration != null ? (
                      <AnimatedNumber
                        value={summary.duration}
                        format={(value) => `${value.toFixed(1)}s`}
                        className='font-semibold text-foreground tabular-nums'
                      />
                    ) : (
                      <span className='font-semibold text-foreground tabular-nums'>
                        —
                      </span>
                    )}
                  </span>
                  <span className='text-muted-foreground'>
                    Tasa de éxito:{' '}
                    <AnimatedNumber
                      value={passRate}
                      format={(value) => `${Math.round(value)}%`}
                      className='font-semibold text-foreground tabular-nums'
                    />
                  </span>
                </div>

                <AnimatePresence initial={false}>
                  {status === 'aborted' && (
                    <m.div
                      key='aborted'
                      variants={collapse}
                      initial='hidden'
                      animate='show'
                      exit='exit'
                      className='overflow-hidden'
                    >
                      <p className='flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm'>
                        <Ban className='size-4 text-destructive' />
                        Progreso alcanzado antes del aborto: {progress.current}/
                        {progress.total} ({progress.percentage}%)
                      </p>
                    </m.div>
                  )}
                </AnimatePresence>

                {reportsEnabled ? (
                  <div className='flex flex-wrap items-center gap-2 border-t pt-3'>
                    <Button
                      variant='default'
                      size='sm'
                      onClick={() => setSheetOpen(true)}
                    >
                      <FileText className='size-4' /> Ver reporte
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => void handleExport()}
                      disabled={exporting}
                    >
                      <FileDown className='size-4' />{' '}
                      {exporting ? 'Generando…' : 'Exportar PDF'}
                    </Button>
                    <Button variant='outline' size='sm' asChild>
                      <a
                        href={reportsApi.downloadJsonUrl(reportId)}
                        target='_blank'
                        rel='noreferrer'
                      >
                        <Download className='size-4' /> JSON
                      </a>
                    </Button>
                    <Button variant='outline' size='sm' asChild>
                      <a
                        href={reportsApi.downloadHtmlUrl(reportId)}
                        target='_blank'
                        rel='noreferrer'
                      >
                        <ExternalLink className='size-4' /> HTML
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className='flex flex-wrap items-center gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground'>
                    <span>
                      {featuresError ??
                        'El módulo de reportes no está disponible para este perfil.'}
                    </span>
                    <Button
                      variant='link'
                      size='sm'
                      className='h-auto p-0'
                      asChild
                    >
                      <Link to='/settings'>
                        <Settings className='size-3.5' /> Revisar módulos en
                        Ajustes
                      </Link>
                    </Button>
                  </div>
                )}
              </m.div>
            )}
          </AnimatePresence>
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
