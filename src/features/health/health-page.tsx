import { Activity, RefreshCw } from 'lucide-react'
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
import { useHealth } from '@/hooks/use-health'
import type {
  HealthBadgeStatus,
  HealthCheck,
  HealthCheckStatus,
} from '@/types/contract'

const STATUS_LABELS: Record<HealthBadgeStatus, string> = {
  ok: 'OK',
  degraded: 'Degradado',
  unhealthy: 'Sin conexión',
  offline: 'Sin conexión',
}

const STATUS_VARIANTS: Record<
  HealthBadgeStatus,
  'outline' | 'secondary' | 'destructive'
> = {
  ok: 'outline',
  degraded: 'secondary',
  unhealthy: 'destructive',
  offline: 'destructive',
}

const CHECK_STATUS_LABELS: Record<HealthCheckStatus, string> = {
  ok: 'OK',
  degraded: 'Degradado',
  unhealthy: 'Crítico',
  not_configured: 'Sin configurar',
}

const CHECK_STATUS_VARIANTS: Record<
  HealthCheckStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  ok: 'default',
  degraded: 'secondary',
  unhealthy: 'destructive',
  not_configured: 'outline',
}

const CHECK_NAMES: Record<string, string> = {
  profiles: 'Perfiles',
  reports: 'Reportes',
  evidenceGallery: 'Galería de evidencias',
  profile: 'Perfil activo',
  projectPath: 'Ruta del proyecto',
  playwrightKit: 'Kit Playwright',
  scheduler: 'Programador',
  socket: 'Socket.io',
  dockerGrid: 'Docker / Grid',
}

function formatUptime(seconds?: number) {
  if (typeof seconds !== 'number') return '—'
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return minutes ? `${minutes} min ${rest} s` : `${rest} s`
}

function CheckList({
  title,
  description,
  checks,
}: {
  title: string
  description: string
  checks: HealthCheck[]
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
            {checks.map((item) => (
              <li
                key={item.id}
                className='flex items-start justify-between gap-3 rounded-md border px-3 py-2'
              >
                <div className='min-w-0'>
                  <p className='text-sm font-medium'>
                    {CHECK_NAMES[item.id] ?? item.id}
                  </p>
                  {item.message ? (
                    <p className='text-xs text-muted-foreground'>{item.message}</p>
                  ) : null}
                </div>
                <Badge variant={CHECK_STATUS_VARIANTS[item.status]}>
                  {CHECK_STATUS_LABELS[item.status]}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

/** Vista dedicada al estado del backend; informativa y nunca bloqueante. */
export function HealthPage() {
  const { status, failedChecks, data, isError, refresh } = useHealth()
  const label = STATUS_LABELS[status]

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
                <Badge
                  variant={STATUS_VARIANTS[status]}
                  className='text-sm'
                  aria-label={`Estado del backend: ${label}`}
                >
                  {label}
                </Badge>
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
            </CardContent>
          </Card>

          <div className='grid gap-4 xl:grid-cols-2'>
            <CheckList
              title='Checks críticos'
              description='Si fallan, la API responde 503 y el contenedor se marca unhealthy.'
              checks={data?.checks.critical ?? []}
            />
            <CheckList
              title='Checks informativos'
              description='Avisan de configuración incompleta sin detener el servicio ni bloquear vistas.'
              checks={data?.checks.informational ?? []}
            />
          </div>
        </div>
      </Main>
    </>
  )
}
