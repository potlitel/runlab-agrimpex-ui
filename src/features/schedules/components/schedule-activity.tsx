import { Eraser } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ScheduleActivity } from '../use-schedules'

type Props = {
  activity: ScheduleActivity[]
  onClear: () => void
}

function levelClass(level?: string) {
  if (level === 'error') return 'text-destructive'
  if (level === 'success') return 'text-emerald-600 dark:text-emerald-400'
  return 'text-foreground'
}

export function ScheduleActivityPanel({ activity, onClear }: Props) {
  return (
    <Card>
      <CardHeader className='border-b pb-4'>
        <div className='flex items-center justify-between gap-2'>
          <CardTitle>Actividad</CardTitle>
          <Button size='sm' variant='outline' onClick={onClear} disabled={activity.length === 0}>
            <Eraser className='size-4' /> Limpiar
          </Button>
        </div>
      </CardHeader>
      <CardContent className='p-0'>
        <ScrollArea className='h-64'>
          <div className='space-y-1 p-4 text-xs'>
            {activity.length === 0 ? (
              <p className='text-sm text-muted-foreground'>
                Sin actividad reciente. Los eventos de programaciones aparecerán aquí.
              </p>
            ) : (
              [...activity].reverse().map((item) => (
                <div key={item.id} className='flex gap-2'>
                  <span className='shrink-0 font-mono text-muted-foreground'>
                    {new Date(item.at).toLocaleTimeString()}
                  </span>
                  {item.type === 'run' ? (
                    <span className='text-sky-600 dark:text-sky-400'>
                      ▶ Ejecutando &quot;{item.name ?? item.scheduleId}&quot;
                      {item.total != null ? ` (${item.total} tests)` : ''}
                    </span>
                  ) : (
                    <span className={levelClass(item.level)}>{item.message}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
