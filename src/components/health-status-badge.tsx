import { Activity, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useHealth } from '@/hooks/use-health'
import { cn } from '@/lib/utils'
import type { HealthBadgeStatus } from '@/types/contract'

const LABELS: Record<HealthBadgeStatus, string> = {
  ok: 'OK',
  degraded: 'Degradado',
  unhealthy: 'Sin conexión',
  offline: 'Sin conexión',
}

const VARIANTS: Record<
  HealthBadgeStatus,
  'outline' | 'secondary' | 'destructive'
> = {
  ok: 'outline',
  degraded: 'secondary',
  unhealthy: 'destructive',
  offline: 'destructive',
}

/** Indicador informativo del backend; nunca bloquea ni vacía la pantalla. */
export function HealthStatusBadge({ className }: { className?: string }) {
  const { status, failedChecks, refresh } = useHealth()
  const label = LABELS[status]
  const title = failedChecks.length
    ? `Backend ${label}. Checks fallidos: ${failedChecks.join(', ')}`
    : `Backend ${label}`

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Badge variant={VARIANTS[status]} title={title} aria-label={`Backend ${label}`}>
        <Activity />
        {label}
      </Badge>
      {failedChecks.length > 0 ? (
        <span className='hidden max-w-40 truncate text-xs text-muted-foreground xl:inline'>
          {failedChecks.join(', ')}
        </span>
      ) : null}
      {status !== 'ok' ? (
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='size-7'
          aria-label='Reintentar estado del backend'
          title='Reintentar estado del backend'
          onClick={refresh}
        >
          <RefreshCw />
        </Button>
      ) : null}
    </div>
  )
}
