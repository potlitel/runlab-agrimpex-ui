import { useEffect, useRef } from 'react'
import { Activity, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ExecutionLogEntry, ExecutionProgress } from '../use-execution'
import type { ReportSummary } from '@/types/contract'

type ExecutionConsoleProps = {
  logs: ExecutionLogEntry[]
  progress: ExecutionProgress
  running: boolean
  summary: ReportSummary | null
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

export function ExecutionConsole({ logs, progress, running, summary }: ExecutionConsoleProps) {
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
            </CardTitle>
            <p className='mt-1 text-sm text-muted-foreground'>
              Progreso y salida en vivo del perfil activo
            </p>
          </div>
          <div className='flex items-center gap-3 text-sm'>
            <span className='tabular-nums text-muted-foreground'>
              {progress.current}/{progress.total || 0}
            </span>
            <span className='tabular-nums font-semibold'>
              {progress.percentage}%
            </span>
          </div>
        </div>
        <div className='mt-3 h-2 w-full overflow-hidden rounded-full bg-muted'>
          <div
            className='h-full rounded-full bg-primary transition-all duration-300'
            style={{ width: `${Math.max(0, Math.min(100, progress.percentage))}%` }}
          />
        </div>
        {summary && (
          <div className='mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4'>
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
              icon={Clock}
              label='Duración'
              value={`${summary.duration ?? 0}s`}
              tone='text-muted-foreground'
            />
            <SummaryPill
              icon={Activity}
              label='Total'
              value={summary.total}
              tone='text-foreground'
            />
          </div>
        )}
      </CardHeader>
      <CardContent className='min-h-0 flex-1 p-0'>
        <div className='max-h-[360px] overflow-y-auto bg-muted/30 p-4 font-mono text-xs'>
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
  icon: React.ComponentType<{ className?: string }>
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
