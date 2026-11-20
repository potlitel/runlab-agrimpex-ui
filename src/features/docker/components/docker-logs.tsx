import { useEffect, useRef } from 'react'
import { Eraser } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { DockerLogEntry } from '../use-docker'

type Props = {
  logs: DockerLogEntry[]
  onClear: () => void
}

function logClass(type: string) {
  if (type === 'error') return 'text-destructive'
  if (type === 'success') return 'text-emerald-600 dark:text-emerald-400'
  if (type === 'cmd') return 'text-sky-600 dark:text-sky-400'
  return 'text-foreground'
}

export function DockerLogs({ logs, onClear }: Props) {
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [logs.length])

  return (
    <Card>
      <CardHeader className='border-b pb-4'>
        <div className='flex items-center justify-between gap-2'>
          <CardTitle>Logs</CardTitle>
          <Button size='sm' variant='outline' onClick={onClear} disabled={logs.length === 0}>
            <Eraser className='size-4' /> Limpiar
          </Button>
        </div>
      </CardHeader>
      <CardContent className='p-0'>
        <ScrollArea className='h-80'>
          <div className='space-y-0.5 p-4 font-mono text-xs'>
            {logs.length === 0 ? (
              <p className='font-sans text-sm text-muted-foreground'>
                Sin eventos. Ejecuta una acción para ver logs en tiempo real.
              </p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className={`whitespace-pre-wrap break-all ${logClass(log.type)}`}>
                  <span className='me-2 text-muted-foreground'>
                    {new Date(log.at).toLocaleTimeString()}
                  </span>
                  {log.message}
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
