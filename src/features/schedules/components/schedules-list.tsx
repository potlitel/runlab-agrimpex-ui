import { CalendarClock, Pencil, Play, Power, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Schedule } from '@/types/contract'

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function formatDays(days?: number[]) {
  if (!days || days.length === 0) return 'Todos los días'
  if (days.length === 7) return 'Todos los días'
  return [...days]
    .sort((a, b) => a - b)
    .map((d) => DAY_LABELS[d] ?? String(d))
    .join(', ')
}

function formatDate(iso?: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString()
}

function specSelectionInfo(testIds?: string[]) {
  const ids = testIds ?? []
  const specIds = ids.filter((id) => /\.spec\.ts(?::|$)/i.test(id))
  const specFiles = new Set(specIds.map((id) => id.split('::')[0]))
  return {
    isWholeSuite: specIds.length === 0,
    specTests: specIds.length,
    specFiles: specFiles.size,
  }
}

type Props = {
  schedules: Schedule[]
  loading: boolean
  error: string | null
  togglingId: string | null
  removingId: string | null
  runningNowId: string | null
  onEdit: (schedule: Schedule) => void
  onToggle: (id: string) => void
  onRunNow: (id: string) => void
  onDelete: (id: string) => void
}

export function SchedulesList({
  schedules,
  loading,
  error,
  togglingId,
  removingId,
  runningNowId,
  onEdit,
  onToggle,
  onRunNow,
  onDelete,
}: Props) {
  return (
    <Card>
      <CardHeader className='border-b pb-4'>
        <div className='flex items-center justify-between gap-2'>
          <CardTitle>Programaciones</CardTitle>
          <Badge variant='secondary'>{schedules.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className='p-0'>
        {loading ? (
          <div className='space-y-2 p-4'>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className='h-12 animate-pulse rounded bg-muted' />
            ))}
          </div>
        ) : error ? (
          <p className='p-4 text-sm text-destructive'>{error}</p>
        ) : schedules.length === 0 ? (
          <div className='flex flex-col items-center gap-2 p-10 text-center text-muted-foreground'>
            <CalendarClock className='size-10 opacity-50' />
            <p className='text-sm'>No hay programaciones. Crea una para automatizar ejecuciones.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Días</TableHead>
                <TableHead>Tests</TableHead>
                <TableHead>Próxima</TableHead>
                <TableHead>Última</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className='text-end'>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className='font-medium'>{s.name || 'Sin nombre'}</div>
                    <div className='text-xs text-muted-foreground'>
                      rep. {s.repeat ?? 1}{s.useDocker ? ' · Docker' : ''}
                    </div>
                  </TableCell>
                  <TableCell className='font-mono text-sm'>{s.time ?? '—'}</TableCell>
                  <TableCell className='max-w-[180px] text-xs'>{formatDays(s.days)}</TableCell>
                  <TableCell>
                    {(() => {
                      const scope = specSelectionInfo(s.testIds)
                      if (scope.isWholeSuite) {
                        return <Badge variant='secondary'>Suite completa</Badge>
                      }
                      return (
                        <div className='text-xs leading-tight'>
                          <div className='font-medium'>{scope.specTests} test(s)</div>
                          <div className='text-muted-foreground'>
                            {scope.specFiles} archivo(s) .spec.ts
                          </div>
                        </div>
                      )
                    })()}
                  </TableCell>
                  <TableCell className='text-xs'>{formatDate(s.nextRun)}</TableCell>
                  <TableCell className='text-xs'>{formatDate(s.lastRun)}</TableCell>
                  <TableCell>
                    <Badge variant={s.enabled ? 'default' : 'outline'}>
                      {s.enabled ? 'Activa' : 'Pausada'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className='flex justify-end gap-1'>
                      <Button size='sm' variant='ghost' onClick={() => onRunNow(s.id)} disabled={runningNowId === s.id} title='Ejecutar ahora'>
                        <Play className='size-4' />
                      </Button>
                      <Button size='sm' variant='ghost' onClick={() => onToggle(s.id)} disabled={togglingId === s.id} title={s.enabled ? 'Pausar' : 'Activar'}>
                        <Power className='size-4' />
                      </Button>
                      <Button size='sm' variant='ghost' onClick={() => onEdit(s)} title='Editar'>
                        <Pencil className='size-4' />
                      </Button>
                      <Button
                        size='sm'
                        variant='ghost'
                        className='text-destructive hover:text-destructive'
                        disabled={removingId === s.id}
                        title='Eliminar'
                        onClick={() => {
                          const ok = window.confirm(`¿Eliminar la programación "${s.name ?? s.id}"?`)
                          if (ok) onDelete(s.id)
                        }}
                      >
                        <Trash2 className='size-4' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
