import { AlertCircle, CheckCircle2, Loader2, PlayCircle, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DockerCheckResponse, DockerStatus } from '@/types/contract'

type Props = {
  check: DockerCheckResponse | null
  checkLoading: boolean
  checkError: string | null
  status: DockerStatus | null
  statusLoading: boolean
  statusError: string | null
  startingDesktop: boolean
  onStartDesktop: () => void
}

function boolLabel(value: unknown) {
  if (value === true) return 'Sí'
  if (value === false) return 'No'
  if (value == null) return '—'
  return String(value)
}

export function DockerStatusPanel({
  check,
  checkLoading,
  checkError,
  status,
  statusLoading,
  statusError,
  startingDesktop,
  onStartDesktop,
}: Props) {
  const checkOk = check ? (check.ok ?? check.ready ?? check.installed) === true : false
  const canStart = check ? check.ok !== true && (check as { permission?: boolean }).permission !== true : false

  return (
    <Card>
      <CardHeader className='border-b pb-4'>
        <CardTitle>Estado y diagnóstico</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4 p-4'>
        <div className='space-y-2'>
          <div className='flex items-center justify-between gap-2'>
            <span className='text-sm font-medium'>Diagnóstico</span>
            {checkLoading ? (
              <Badge variant='secondary'>Verificando…</Badge>
            ) : check ? (
              <Badge variant={checkOk ? 'default' : 'destructive'}>
                {checkOk ? 'Disponible' : 'No disponible'}
              </Badge>
            ) : (
              <Badge variant='outline'>—</Badge>
            )}
          </div>
          {checkError ? (
            <p className='text-sm text-destructive'>{checkError}</p>
          ) : check ? (
            <div className='space-y-1 text-sm text-muted-foreground'>
              {'version' in check && check.version ? (
                <p>
                  <span className='font-medium text-foreground'>Versión:</span>{' '}
                  {String(check.version)}
                </p>
              ) : null}
              {check.error ? (
                <p className='flex items-start gap-2 text-destructive'>
                  <AlertCircle className='mt-0.5 size-4 shrink-0' />
                  <span>{String(check.error)}</span>
                </p>
              ) : checkOk ? (
                <p className='flex items-center gap-2 text-emerald-600 dark:text-emerald-400'>
                  <CheckCircle2 className='size-4' /> Docker responde correctamente.
                </p>
              ) : null}
              {canStart && (
                <Button
                  size='sm'
                  variant='outline'
                  className='mt-2'
                  onClick={onStartDesktop}
                  disabled={startingDesktop}
                >
                  {startingDesktop ? (
                    <Loader2 className='size-4 animate-spin' />
                  ) : (
                    <PlayCircle className='size-4' />
                  )}
                  {startingDesktop ? 'Iniciando…' : 'Iniciar Docker'}
                </Button>
              )}
            </div>
          ) : checkLoading ? (
            <div className='h-10 animate-pulse rounded bg-muted' />
          ) : (
            <p className='text-sm text-muted-foreground'>Sin información de diagnóstico.</p>
          )}
        </div>

        <div className='space-y-2 border-t pt-3'>
          <div className='flex items-center justify-between gap-2'>
            <span className='text-sm font-medium'>Operación actual</span>
            {statusLoading ? (
              <Badge variant='secondary'>Cargando…</Badge>
            ) : status?.running ? (
              <Badge className='gap-1'>
                <Loader2 className='size-3 animate-spin' /> En ejecución
              </Badge>
            ) : (
              <Badge variant='outline'>Inactivo</Badge>
            )}
          </div>
          {statusError ? (
            <p className='text-sm text-destructive'>{statusError}</p>
          ) : status ? (
            <dl className='grid grid-cols-2 gap-x-3 gap-y-1 text-sm'>
              <dt className='text-muted-foreground'>Acción</dt>
              <dd className='font-mono text-xs'>{status.action ? String(status.action) : '—'}</dd>
              <dt className='text-muted-foreground'>Proyecto</dt>
              <dd className='truncate font-mono text-xs' title={String(status.projectPath ?? '')}>
                {status.projectPath ? String(status.projectPath) : '—'}
              </dd>
              <dt className='text-muted-foreground'>Grid Selenium</dt>
              <dd className='flex items-center gap-1'>
                {status.gridUp ? (
                  <CheckCircle2 className='size-3.5 text-emerald-500' />
                ) : (
                  <XCircle className='size-3.5 text-muted-foreground' />
                )}
                {boolLabel(status.gridUp)}
              </dd>
              <dt className='text-muted-foreground'>Contenedores proyecto</dt>
              <dd>{boolLabel(status.projectUp)}</dd>
            </dl>
          ) : statusLoading ? (
            <div className='h-16 animate-pulse rounded bg-muted' />
          ) : (
            <p className='text-sm text-muted-foreground'>Sin estado disponible.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
