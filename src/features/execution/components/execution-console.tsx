import { useEffect, useRef, type ComponentType } from 'react'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  Eraser,
  Loader2,
  Percent,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ExecutionLogEntry, ExecutionProgress } from '../use-execution'
import type { ReportSummary } from '@/types/contract'

export type ExecutionConsoleProps = {
  logs: ExecutionLogEntry[]
  progress: ExecutionProgress
  running: boolean
  summary: ReportSummary | null
  summaryPartial?: boolean
  passRate?: number
  loading?: boolean
  error?: string | null
  onClear?: () => void
  onRetry?: () => void
}

const logTone: Record<ExecutionLogEntry['kind'], string> = {
  info: 'text-muted-foreground',
  error: 'text-destructive',
  success: 'text-emerald-600 dark:text-emerald-400',
  test: 'text-foreground',
  output: 'text-muted-foreground',
  system: 'text-primary',
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(iso))
}

export function ExecutionConsole({
  logs,
  progress,
  running,
  summary,
  summaryPartial = false,
  passRate = 0,
  loading = false,
  error = null,
  onClear,
  onRetry,
}: ExecutionConsoleProps) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [logs])

  return (
    <Card className='flex min-h-0 flex-col'>
      <CardHeader className='border-b pb-4'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              <Activity className='size-4' />
              Consola de ejecución
              <Badge variant={running ? 'default' : 'secondary'}>
                {running ? 'En ejecución' : 'En espera'}
              </Badge>
              {summaryPartial && (
                <Badge variant='outline' title='No se pudo consultar el detalle del reporte'>
                  Resumen parcial
                </Badge>
              )}
            </CardTitle>
            <p className='mt-1 text-sm text-muted-foreground'>
              Progreso y salida en vivo del perfil activo
            </p>
          </div>
          <div className='flex items-center gap-3 text-sm'>
            {loading && <Loader2 className='size-4 animate-spin text-muted-foreground' aria-label='Cargando catálogo' />}
            <span className='tabular-nums text-muted-foreground'>
              {progress.current}/{progress.total || 0}
            </span>
            <span className='tabular-nums font-semibold'>
              {progress.percentage}%
            </span>
            {onClear && (
              <Button
                variant='ghost'
                size='sm'
                className='h-7 px-2'
                onClick={onClear}
                disabled={logs.length === 0}
                title='Limpiar el buffer de logs sin afectar los resultados'
              >
                <Eraser className='size-3.5' /> Limpiar
              </Button>
            )}
          </div>
        </div>
        <div
          role='progressbar'
          aria-label='Progreso de la ejecución'
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.max(0, Math.min(100, progress.percentage))}
          aria-valuetext={`${progress.current} de ${progress.total || 0} tests, ${progress.percentage}%`}
          className='mt-3 h-2 w-full overflow-hidden rounded-full bg-muted'
        >
          <div
            className='h-full rounded-full bg-primary transition-all duration-300'
            style={{ width: `${Math.max(0, Math.min(100, progress.percentage))}%` }}
          />
        </div>
        {summary && (
          <div className='mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 xl:grid-cols-7'>
            <SummaryPill
              icon={Activity}
              label='Total'
              value={summary.total}
              tone='text-foreground'
            />
            <SummaryPill
              icon={CheckCircle2}
              label='Pasados'
              value={summary.passed}
              tone='text-emerald-600 dark:text-emerald-400'
            />
            <SummaryPill
              icon={AlertTriangle}
              label='Fallidos'
              value={summary.failed}
              tone='text-destructive'
            />
            <SummaryPill
              icon={AlertCircle}
              label='Errores'
              value={summary.errors ?? 0}
              tone='text-destructive'
            />
            <SummaryPill
              icon={Ban}
              label='Omitidos'
              value={summary.skipped ?? 0}
              tone='text-muted-foreground'
            />
            <SummaryPill
              icon={Clock}
              label='Duración'
              value={summary.duration != null ? `${summary.duration.toFixed(1)}s` : '—'}
              tone='text-muted-foreground'
            />
            <SummaryPill
              icon={Percent}
              label='Tasa de éxito'
              value={`${passRate}%`}
              tone='text-foreground'
            />
          </div>
        )}
      </CardHeader>
      <CardContent className='min-h-0 flex-1 p-0'>
        {error && (
          <div className='flex flex-wrap items-center gap-2 border-b border-destructive/30 bg-destructive/5 px-4 py-2 text-xs text-destructive'>
            <AlertCircle className='size-3.5' />
            <span>{error}</span>
            {onRetry && (
              <Button variant='link' size='sm' className='h-auto p-0' onClick={onRetry}>
                Reintentar
              </Button>
            )}
          </div>
        )}
        <div
          role='log'
          aria-label='Salida de la ejecución'
          aria-live='polite'
          aria-relevant='additions'
          className='max-h-[360px] overflow-y-auto bg-muted/30 p-4 font-mono text-xs'
        >
          {logs.length === 0 ? (
            <p className='text-muted-foreground'>
              {running
                ? 'Esperando eventos de ejecución…'
                : 'Sin actividad reciente. Inicia una corrida para ver el progreso.'}
            </p>
          ) : (
            <div className='space-y-1'>
              {logs.map((entry) => (
                <div key={entry.id} className='flex gap-2'>
                  <span className='shrink-0 text-muted-foreground/70'>
                    {formatTime(entry.at)}
                  </span>
                  <span className={logTone[entry.kind]}>{entry.text}</span>
                </div>
              ))}
              <div ref={endRef} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function SummaryPill({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string | number
  tone: string
}) {
  return (
    <div className='flex items-center gap-2 rounded-md border bg-card px-2 py-1.5'>
      <Icon className={`size-3.5 ${tone}`} />
      <span className='text-muted-foreground'>{label}</span>
      <span className={`ms-auto tabular-nums font-semibold ${tone}`}>
        {value}
      </span>
    </div>
  )
}
