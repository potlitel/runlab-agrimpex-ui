import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, CircleHelp, Container, Info, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Schedule, TestTree } from '@/types/contract'

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function parseKeyValue(text: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx <= 0) continue
    out[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
  }
  return out
}

function toKeyValue(obj?: Record<string, string>) {
  if (!obj) return ''
  return Object.entries(obj)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')
}

export type ScheduleFormValues = {
  name: string
  time: string
  enabled: boolean
  days: number[]
  testIds: string[]
  repeat: number
  useDocker: boolean
  params: Record<string, string>
  paramsByTest: Record<string, Record<string, string>>
}

function defaultsFrom(schedule?: Schedule | null): ScheduleFormValues {
  return {
    name: schedule?.name ?? '',
    time: schedule?.time ?? '09:00',
    enabled: schedule?.enabled ?? true,
    days: schedule?.days ?? [],
    testIds: schedule?.testIds ?? [],
    repeat: Math.max(1, Number(schedule?.repeat ?? 1)),
    useDocker: !!schedule?.useDocker,
    params: (schedule?.params as Record<string, string>) ?? {},
    paramsByTest: (schedule?.paramsByTest as Record<string, Record<string, string>>) ?? {},
  }
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedule?: Schedule | null
  testsTree?: TestTree
  testsLoading: boolean
  collectingTests: boolean
  onCollectTests: () => void
  onSubmit: (values: Partial<Schedule>) => Promise<unknown>
  submitting: boolean
}

export function ScheduleFormDialog(props: Props) {
  const { open, schedule } = props
  return (
    <Dialog open={open} onOpenChange={props.onOpenChange}>
      {open ? <ScheduleFormInner key={schedule?.id ?? 'new'} {...props} /> : null}
    </Dialog>
  )
}

function ScheduleFormInner({
  onOpenChange,
  schedule,
  testsTree,
  testsLoading,
  collectingTests,
  onCollectTests,
  onSubmit,
  submitting,
}: Props) {
  const initial = useMemo(() => defaultsFrom(schedule), [schedule])
  const [name, setName] = useState(initial.name)
  const [time, setTime] = useState(initial.time)
  const [enabled, setEnabled] = useState(initial.enabled)
  const [days, setDays] = useState<number[]>(initial.days)
  const [testIds, setTestIds] = useState<string[]>(initial.testIds)
  const [repeat, setRepeat] = useState(String(initial.repeat))
  const [useDocker, setUseDocker] = useState(initial.useDocker)
  const [paramsText, setParamsText] = useState(toKeyValue(initial.params))
  const [paramsByTestText, setParamsByTestText] = useState(
    Object.keys(initial.paramsByTest).length ? JSON.stringify(initial.paramsByTest, null, 2) : ''
  )
  const [paramsByTestError, setParamsByTestError] = useState<string | null>(null)
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({})

  const files = useMemo(() => testsTree?.files ?? {}, [testsTree])
  const fileNames = useMemo(() => Object.keys(files).sort(), [files])
  const allTestIds = useMemo(() => fileNames.flatMap((f) => files[f] ?? []), [fileNames, files])
  const hasSpecSelected = useMemo(
    () => testIds.some((id) => /\.spec\.ts(?::|$)/i.test(id)),
    [testIds]
  )
  const schedulesWholeSuite = !hasSpecSelected

  function toggleDay(day: number) {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()))
  }

  function toggleTest(id: string) {
    setTestIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  function toggleFile(file: string) {
    const ids = files[file] ?? []
    const allSelected = ids.every((id) => testIds.includes(id))
    setTestIds((prev) => {
      if (allSelected) return prev.filter((id) => !ids.includes(id))
      const set = new Set(prev)
      ids.forEach((id) => set.add(id))
      return Array.from(set)
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setParamsByTestError(null)
    let paramsByTest: Record<string, Record<string, string>> = {}
    if (paramsByTestText.trim()) {
      try {
        const parsed = JSON.parse(paramsByTestText)
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('Debe ser un objeto JSON')
        }
        paramsByTest = parsed as Record<string, Record<string, string>>
      } catch {
        setParamsByTestError('paramsByTest debe ser un JSON válido (objeto).')
        return
      }
    }
    const payload: Partial<Schedule> = {
      name: name.trim() || 'Sin nombre',
      time,
      enabled,
      days,
      testIds,
      repeat: Math.max(1, Number(repeat) || 1),
      useDocker,
      params: parseKeyValue(paramsText),
      paramsByTest,
    }
    await onSubmit(payload)
    onOpenChange(false)
  }

  return (
    <DialogContent className='max-h-[90vh] overflow-hidden sm:max-w-3xl'>
      <DialogHeader>
        <DialogTitle>{schedule ? 'Editar programación' : 'Nueva programación'}</DialogTitle>
        <DialogDescription>
          Define horario, días, tests y opciones de ejecución.
        </DialogDescription>
      </DialogHeader>
      <form className='flex min-h-0 flex-col' onSubmit={handleSubmit}>
        <ScrollArea className='max-h-[62vh] pr-3'>
          <div className='space-y-5 py-1'>
            <div className='grid gap-3 sm:grid-cols-2'>
              <div className='space-y-1.5 sm:col-span-2'>
                <Label htmlFor='sch-name'>Nombre</Label>
                <Input id='sch-name' value={name} onChange={(e) => setName(e.target.value)} placeholder='Ej. Smoke diario' />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='sch-time'>Hora (HH:MM)</Label>
                <Input id='sch-time' type='time' value={time} onChange={(e) => setTime(e.target.value)} required />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='sch-repeat'>Repeticiones</Label>
                <Input id='sch-repeat' type='number' min={1} value={repeat} onChange={(e) => setRepeat(e.target.value)} />
              </div>
            </div>

            <div className='flex flex-wrap items-center gap-4'>
              <label className='flex items-center gap-2 text-sm'>
                <Switch checked={enabled} onCheckedChange={setEnabled} /> Habilitada
              </label>
              <div className='flex items-center gap-1.5 text-sm'>
                <label className='flex cursor-pointer items-center gap-2'>
                  <Switch checked={useDocker} onCheckedChange={setUseDocker} /> Usar Docker
                </label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type='button'
                      className='inline-flex text-muted-foreground hover:text-foreground'
                      aria-label='Información sobre Usar Docker'
                    >
                      <CircleHelp className='size-4' />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side='top' className='max-w-xs'>
                    <span className='flex items-center gap-2'>
                      <Container className='size-4 shrink-0' />
                      Ejecuta la programación dentro de un contenedor Docker configurado para el proyecto.
                    </span>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            <div className='space-y-1.5'>
              <Label>Días (vacío = todos)</Label>
              <div className='flex flex-wrap gap-2'>
                {DAY_LABELS.map((label, idx) => (
                  <Button
                    key={label}
                    type='button'
                    size='sm'
                    variant={days.includes(idx) ? 'default' : 'outline'}
                    onClick={() => toggleDay(idx)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <div className='space-y-2'>
              <div className='flex items-center justify-between gap-2'>
                <Label>Tests ({testIds.length} seleccionados)</Label>
                <div className='flex gap-2'>
                  <div className='flex items-center gap-1.5'>
                    <Button type='button' size='sm' variant='outline' onClick={onCollectTests} disabled={collectingTests}>
                      <RefreshCw className={collectingTests ? 'size-4 animate-spin' : 'size-4'} /> Actualizar catálogo
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type='button'
                          className='inline-flex text-muted-foreground hover:text-foreground'
                          aria-label='Información sobre Actualizar catálogo'
                        >
                          <CircleHelp className='size-4' />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side='top' className='max-w-xs'>
                        <span className='flex items-center gap-2'>
                          <RefreshCw className='size-4 shrink-0' />
                          Vuelve a recopilar el catálogo de tests del proyecto para mostrar los archivos y casos disponibles.
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {allTestIds.length > 0 && (
                    <Button
                      type='button'
                      size='sm'
                      variant='ghost'
                      onClick={() => setTestIds(testIds.length === allTestIds.length ? [] : allTestIds)}
                    >
                      {testIds.length === allTestIds.length ? 'Quitar todos' : 'Seleccionar todos'}
                    </Button>
                  )}
                </div>
              </div>
              {schedulesWholeSuite && (
                <div className='flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200'>
                  <Info className='mt-0.5 size-4 shrink-0' />
                  <p>
                    No se ha seleccionado ningún fichero <span className='font-mono'>.spec.ts</span>. Se programará la ejecución de toda la suite.
                  </p>
                </div>
              )}
              <div className='max-h-56 overflow-auto rounded-md border p-2'>
                {testsLoading ? (
                  <p className='p-2 text-sm text-muted-foreground'>Cargando catálogo…</p>
                ) : fileNames.length === 0 ? (
                  <p className='p-2 text-sm text-muted-foreground'>
                    No hay catálogo disponible. Actualiza para cargar los tests del proyecto.
                  </p>
                ) : (
                  <div className='space-y-1'>
                    {fileNames.map((file) => {
                      const ids = files[file] ?? []
                      const selectedCount = ids.filter((id) => testIds.includes(id)).length
                      const all = ids.length > 0 && selectedCount === ids.length
                      const open = expandedFiles[file] ?? true
                      return (
                        <div key={file} className='rounded-md'>
                          <div className='flex items-center gap-2 px-1 py-1'>
                            <button
                              type='button'
                              className='text-muted-foreground hover:text-foreground'
                              onClick={() => setExpandedFiles((p) => ({ ...p, [file]: !open }))}
                              aria-label={open ? 'Contraer' : 'Expandir'}
                            >
                              {open ? <ChevronDown className='size-4' /> : <ChevronRight className='size-4' />}
                            </button>
                            <Checkbox checked={all} onCheckedChange={() => toggleFile(file)} aria-label={`Seleccionar ${file}`} />
                            <span className='min-w-0 flex-1 truncate font-mono text-xs'>{file}</span>
                            <span className='text-xs text-muted-foreground'>{selectedCount}/{ids.length}</span>
                          </div>
                          {open && (
                            <div className='ms-9 space-y-1 pb-1'>
                              {ids.map((id) => (
                                <label key={id} className='flex items-start gap-2 text-xs'>
                                  <Checkbox checked={testIds.includes(id)} onCheckedChange={() => toggleTest(id)} />
                                  <span className='break-all font-mono'>{id.split('::').slice(1).join(' :: ') || id}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='sch-params'>Parámetros (KEY=VALUE)</Label>
              <Textarea
                id='sch-params'
                value={paramsText}
                onChange={(e) => setParamsText(e.target.value)}
                placeholder={'API_URL=https://…\nUSER=qa'}
                className='min-h-20 font-mono text-xs'
              />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='sch-params-by-test'>Parámetros por test (JSON, avanzado)</Label>
              <Textarea
                id='sch-params-by-test'
                value={paramsByTestText}
                onChange={(e) => setParamsByTestText(e.target.value)}
                placeholder={'{\n  "tests/file.spec.ts::Suite::Test": { "KEY": "VALUE" }\n}'}
                className='min-h-24 font-mono text-xs'
              />
              {paramsByTestError && <p className='text-xs text-destructive'>{paramsByTestError}</p>}
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className='mt-4'>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type='submit' disabled={submitting || !time}>
            {submitting ? 'Guardando…' : schedule ? 'Guardar cambios' : 'Crear programación'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
