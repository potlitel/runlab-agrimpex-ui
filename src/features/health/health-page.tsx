import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Activity, ChevronDown, RefreshCw, Settings2 } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { HeaderTools } from '@/components/layout/header-tools'
import { Main } from '@/components/layout/main'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useHealth } from '@/hooks/use-health'
import type { HealthCheck } from '@/types/contract'
import { HealthGauge, HealthSparkline } from './health-charts'
import { HealthPollTimer } from './health-poll-timer'
import {
  CHECK_BADGE_CLASSES,
  CHECK_ICONS,
  CHECK_NAMES,
  CHECK_STATUS_LABELS,
  DEFAULT_CHECK_ICON,
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
  formatRelativeTime,
  formatUptime,
  sanitizeCheckMessage,
  secondsUntilNextPoll,
} from './health-utils'

function CheckList({
  title,
  description,
  checks,
  checkedAt,
  now,
}: {
  title: string
  description: string
  checks: HealthCheck[]
  checkedAt: number | undefined
  now: number
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {checks.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            Sin datos disponibles. Reintenta para consultar el estado.
          </p>
        ) : (
          <ul className='space-y-2'>
            {checks.map((item) => {
              const Icon = CHECK_ICONS[item.id] ?? DEFAULT_CHECK_ICON
              const name = CHECK_NAMES[item.id] ?? item.id
              const statusLabel = CHECK_STATUS_LABELS[item.status]
              const message = sanitizeCheckMessage(item.message, item.status)

              return (
                <li
                  key={item.id}
                  data-testid={`check-${item.id}`}
                  className='rounded-md border px-3 py-2'
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='flex min-w-0 items-start gap-2'>
                      <Icon
                        aria-hidden='true'
                        data-testid={`check-icon-${item.id}`}
                        className='mt-0.5 size-4 shrink-0 text-muted-foreground'
                      />
                      <div className='min-w-0'>
                        <p className='text-sm font-medium'>{name}</p>
                        <p className='text-xs text-muted-foreground'>
                          {formatRelativeTime(checkedAt, now)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={CHECK_BADGE_CLASSES[item.status]}
                      aria-label={`Estado de ${name}: ${statusLabel}`}
                    >
                      {statusLabel}
                    </Badge>
                  </div>

                  {message ? (
                    <Collapsible className='mt-2'>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-6 gap-1 px-2 text-xs'
                        >
                          <ChevronDown className='size-3.5' /> Ver detalle
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <p
                          data-testid={`check-detail-${item.id}`}
                          className='rounded-md bg-muted/50 px-2 py-1.5 text-xs text-muted-foreground'
                        >
                          {message}
                        </p>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : null}

                  {item.status === 'not_configured' ? (
                    <Link
                      to='/settings'
                      className='mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary underline'
                    >
                      <Settings2 className='size-3' /> Configurar ahora
                    </Link>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

/** Vista dedicada al estado del backend; informativa y nunca bloqueante. */
export function HealthPage() {
  const {
    status,
    failedChecks,
    data,
    isError,
    isLoading,
    isFetching,
    dataUpdatedAt,
    history,
    healthPercentage,
    refresh,
  } = useHealth()
  const label = STATUS_LABELS[status]

  // Un único reloj de UI para textos relativos y cuenta regresiva; el sondeo
  // real sigue siendo el de React Query (30 s), no se duplica aquí.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const remainingSeconds = secondsUntilNextPoll(dataUpdatedAt, now)

  return (
    <>
      <Header fixed>
        <div className='flex flex-1 items-center justify-between gap-3'>
          <div className='flex items-center gap-2'>
            <Activity className='size-5 text-muted-foreground' />
            <div>
              <h1 className='text-xl font-semibold tracking-tight'>
                Salud del backend
              </h1>
              <p className='text-sm text-muted-foreground'>
                Liveness y readiness del servicio RunLab
              </p>
            </div>
          </div>
          <div className='ms-auto flex items-center gap-2'>
            <Button size='sm' variant='outline' onClick={refresh}>
              <RefreshCw className='size-4' /> Actualizar
            </Button>
            <HeaderTools />
          </div>
        </div>
      </Header>
      <Main>
        <div className='space-y-4'>
          <Card>
            <CardHeader>
              <div className='flex flex-wrap items-center justify-between gap-3'>
                <div>
                  <CardTitle>Estado general</CardTitle>
                  <CardDescription>
                    Sondeo automático cada 30 s sobre /api/health/detail
                  </CardDescription>
                </div>
                <div className='flex items-center gap-4'>
                  <HealthGauge value={healthPercentage} />
                  <Badge
                    variant='outline'
                    className={`text-sm ${STATUS_BADGE_CLASSES[status]}`}
                    aria-label={`Estado del backend: ${label}`}
                  >
                    {label}
                  </Badge>
                  <HealthPollTimer
                    remainingSeconds={remainingSeconds}
                    dataUpdatedAt={dataUpdatedAt}
                    isFetching={isFetching}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isError || status === 'offline' ? (
                <p
                  role='status'
                  className='rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive'
                >
                  No se pudo consultar el backend. Las vistas siguen disponibles;
                  usa «Actualizar» para reintentar.
                </p>
              ) : null}
              <dl className='grid gap-3 text-sm sm:grid-cols-3'>
                <div>
                  <dt className='text-muted-foreground'>Estado API</dt>
                  <dd className='font-medium'>{data?.status ?? 'Sin datos'}</dd>
                </div>
                <div>
                  <dt className='text-muted-foreground'>Tiempo activo</dt>
                  <dd className='font-medium'>{formatUptime(data?.uptimeSeconds)}</dd>
                </div>
                <div>
                  <dt className='text-muted-foreground'>Checks fallidos</dt>
                  <dd className='font-medium'>
                    {failedChecks.length ? failedChecks.join(', ') : 'Ninguno'}
                  </dd>
                </div>
              </dl>
              <div className='mt-4'>
                <p className='text-xs text-muted-foreground'>
                  Tendencia del tiempo activo
                </p>
                <HealthSparkline
                  history={history}
                  isLoading={isLoading}
                  isError={isError}
                />
              </div>
            </CardContent>
          </Card>

          <div className='grid gap-4 xl:grid-cols-2'>
            <CheckList
              title='Checks críticos'
              description='Si fallan, la API responde 503 y el contenedor se marca unhealthy.'
              checks={data?.checks.critical ?? []}
              checkedAt={dataUpdatedAt}
              now={now}
            />
            <CheckList
              title='Checks informativos'
              description='Avisan de configuración incompleta sin detener el servicio ni bloquear vistas.'
              checks={data?.checks.informational ?? []}
              checkedAt={dataUpdatedAt}
              now={now}
            />
          </div>
        </div>
      </Main>
    </>
  )
}
