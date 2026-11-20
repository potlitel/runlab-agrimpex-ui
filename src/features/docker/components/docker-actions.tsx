import { Hammer, Play, Power, RefreshCw, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {
  running: boolean
  runningAction: string | null
  stopping: boolean
  onRun: (action: string) => void
  onStop: () => void
}

const ACTIONS: Array<{ id: string; label: string; description: string; icon: typeof Play; variant?: 'default' | 'outline' | 'destructive' }> = [
  { id: 'up-selenium', label: 'Levantar Selenium', description: 'Inicia el grid Selenium (detach)', icon: Play, variant: 'default' },
  { id: 'up-build', label: 'Up + Build', description: 'Construye y ejecuta el proyecto', icon: Hammer, variant: 'outline' },
  { id: 'rebuild', label: 'Rebuild', description: 'Fuerza recreación y ejecución', icon: RefreshCw, variant: 'outline' },
  { id: 'down', label: 'Down', description: 'Detiene el compose del proyecto', icon: Power, variant: 'outline' },
  { id: 'down-all', label: 'Down (orphans)', description: 'Detiene y elimina huérfanos', icon: Power, variant: 'destructive' },
]

export function DockerActions({ running, runningAction, stopping, onRun, onStop }: Props) {
  return (
    <Card>
      <CardHeader className='border-b pb-4'>
        <div className='flex items-center justify-between gap-2'>
          <CardTitle>Acciones</CardTitle>
          <Button
            size='sm'
            variant='destructive'
            onClick={onStop}
            disabled={!running || stopping}
          >
            <Square className='size-4' /> {stopping ? 'Deteniendo…' : 'Detener'}
          </Button>
        </div>
        <p className='mt-1 text-sm text-muted-foreground'>
          Operaciones sobre Docker Compose del proyecto configurado
        </p>
      </CardHeader>
      <CardContent className='grid gap-2 p-4 sm:grid-cols-2'>
        {ACTIONS.map((action) => {
          const Icon = action.icon
          const busy = runningAction === action.id
          return (
            <Button
              key={action.id}
              variant={action.variant ?? 'outline'}
              className='h-auto justify-start gap-3 py-3 text-left'
              disabled={running || !!runningAction}
              onClick={() => onRun(action.id)}
            >
              <Icon className='size-4 shrink-0' />
              <span className='min-w-0'>
                <span className='block font-medium'>
                  {busy ? 'Iniciando…' : action.label}
                </span>
                <span className='block text-xs font-normal opacity-80'>
                  {action.description}
                </span>
              </span>
            </Button>
          )
        })}
      </CardContent>
    </Card>
  )
}
