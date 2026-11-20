import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Cable,
  CheckCircle2,
  CircleDot,
  FileJson2,
  FolderKanban,
  MonitorPlay,
  Play,
  Radio,
  RefreshCw,
  Server,
  Sparkles,
  TerminalSquare,
  Workflow,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type Stage = {
  id: string
  title: string
  detail: string
  icon: React.ComponentType<{ className?: string }>
  accent: string
}

const STAGES: Stage[] = [
  {
    id: 'socket',
    title: '1. Conexión Socket.io',
    detail: 'La UI se conecta al backend y emite profile:join para entrar a la sala profile:<id>.',
    icon: Cable,
    accent: 'from-cyan-500/30 to-sky-500/10',
  },
  {
    id: 'collect',
    title: '2. Catálogo Playwright',
    detail: 'Se ejecuta <playwrightCmd> test --list --reporter=json para descubrir specs y projects.',
    icon: FolderKanban,
    accent: 'from-violet-500/30 to-fuchsia-500/10',
  },
  {
    id: 'run',
    title: '3. Ejecución en vivo',
    detail: 'La API lanza <playwrightCmd> test <targets> ... --reporter=line,json y transmite eventos.',
    icon: Play,
    accent: 'from-emerald-500/30 to-teal-500/10',
  },
  {
    id: 'results',
    title: '4. Resultados y reporte',
    detail: 'La UI muestra progreso, consola, estados por test y consolida reporte/artefactos.',
    icon: CheckCircle2,
    accent: 'from-amber-500/30 to-orange-500/10',
  },
]

const EVENT_STREAM = [
  { label: 'execution:preparing', tone: 'info', text: 'Preparando entorno (p.ej. grid Docker)…' },
  { label: 'execution:started', tone: 'start', text: 'Ejecución iniciada · total: 24 tests' },
  { label: 'test:started', tone: 'test', text: '▶ login.spec.ts › inicia sesión válida' },
  { label: 'test:output', tone: 'output', text: 'npx playwright test login.spec.ts --project=chromium --reporter=line,json' },
  { label: 'progress', tone: 'progress', text: 'Progreso: 7/24 (29%)' },
  { label: 'test:completed', tone: 'ok', text: '✓ login.spec.ts › inicia sesión válida · passed (1.8s)' },
  { label: 'test:completed', tone: 'fail', text: '✘ orders.spec.ts › crea pedido · failed (3.2s)' },
  { label: 'execution:completed', tone: 'done', text: 'Resumen: 21 passed · 2 failed · 1 skipped · reporte generado' },
]

const CMD_ROWS = [
  {
    title: 'Colección',
    cmd: '<playwrightCmd> test --list --reporter=json',
    note: 'Descubre specs/projects sin ejecutar (botón Actualizar en /tests).',
  },
  {
    title: 'Ejecución',
    cmd: '<playwrightCmd> test <targets> [--project=...] [-g "..."] [--workers=N] --reporter=line,json',
    note: 'Ejecuta la selección y habilita streaming + reporte JSON/artefactos.',
  },
]

export function RealtimeExecutionOnboarding() {
  const [tick, setTick] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const id = window.setInterval(() => {
      setTick((t) => t + 1)
    }, 1400)
    return () => window.clearInterval(id)
  }, [paused])

  const active = tick % STAGES.length

  const visibleEvents = useMemo(() => {
    const end = (tick % EVENT_STREAM.length) + 1
    const start = Math.max(0, end - 4)
    return EVENT_STREAM.slice(start, end)
  }, [tick])

  const progress = (tick % 100) + 1

  return (
    <Card className='overflow-hidden border-primary/20 bg-gradient-to-br from-background via-background to-primary/5'>
      <CardHeader className='relative border-b pb-4'>
        <div className='pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(168,85,247,0.16),transparent_30%),radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.14),transparent_35%)]' />
        <div className='relative flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
          <div className='space-y-2'>
            <div className='flex flex-wrap items-center gap-2'>
              <Badge className='gap-1 bg-primary/90'>
                <Sparkles className='size-3.5' /> Onboarding en vivo
              </Badge>
              <Badge variant='outline' className='gap-1'>
                <Radio className='size-3.5 animate-pulse text-emerald-500' /> Socket.io + Playwright
              </Badge>
              <Badge variant='secondary'>UI en tiempo real</Badge>
            </div>
            <CardTitle className='text-xl sm:text-2xl'>Cómo la UI muestra ejecuciones Playwright en vivo</CardTitle>
            <CardDescription className='max-w-3xl text-sm'>
              Flujo visual del recorrido completo: conexión por perfil, catálogo, ejecución con{' '}
              <span className='font-mono text-foreground'>playwrightCmd</span>, streaming de eventos y consolidación de
              resultados/reportes.
            </CardDescription>
          </div>
          <div className='flex shrink-0 items-center gap-2'>
            <Button size='sm' variant='outline' onClick={() => setPaused((p) => !p)}>
              {paused ? <Play className='size-4' /> : <Activity className='size-4 animate-pulse' />}
              {paused ? 'Reanudar animación' : 'Pausar animación'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className='relative space-y-5 p-4 sm:p-5'>
        <div className='grid gap-4 xl:grid-cols-[1.15fr_0.85fr]'>
          <div className='space-y-4'>
            <div className='grid gap-3 sm:grid-cols-2'>
              {STAGES.map((stage, idx) => {
                const Icon = stage.icon
                const isActive = idx === active
                return (
                  <div
                    key={stage.id}
                    className={cn(
                      'relative overflow-hidden rounded-xl border p-3 transition-all duration-500',
                      'bg-gradient-to-br',
                      stage.accent,
                      isActive && 'scale-[1.01] border-primary/40 shadow-md shadow-primary/10',
                      !isActive && 'opacity-90'
                    )}
                  >
                    {isActive && <span className='pointer-events-none absolute inset-0 animate-pulse bg-primary/5' />}
                    <div className='relative flex items-start gap-3'>
                      <div className={cn('rounded-lg border bg-background/80 p-2', isActive && 'ring-2 ring-primary/30')}>
                        <Icon className={cn('size-4', isActive && 'animate-bounce text-primary')} />
                      </div>
                      <div className='min-w-0 space-y-1'>
                        <div className='flex items-center gap-2'>
                          <p className='text-sm font-semibold'>{stage.title}</p>
                          {isActive ? (
                            <span className='inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-ping' />
                          ) : (
                            <CircleDot className='size-3.5 text-muted-foreground' />
                          )}
                        </div>
                        <p className='text-xs leading-relaxed text-muted-foreground'>{stage.detail}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className='rounded-xl border bg-muted/20 p-3 sm:p-4'>
              <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
                <div className='flex items-center gap-2 text-sm font-medium'>
                  <Workflow className='size-4 text-primary' /> Flujo animado (UI ↔ API ↔ Playwright)
                </div>
                <div className='flex flex-wrap gap-2 text-xs'>
                  <Badge variant='outline'>X-Profile-Id</Badge>
                  <Badge variant='outline'>sala profile:&lt;id&gt;</Badge>
                </div>
              </div>
              <div className='grid gap-2 md:grid-cols-5 md:items-stretch'>
                <FlowNode
                  active={active === 0}
                  icon={MonitorPlay}
                  title='UI'
                  lines={['Perfil activo', 'profile:join', 'Consola/progreso/resultados']}
                />
                <FlowArrow active={active === 0 || active === 3} label='HTTP / Socket.io' />
                <FlowNode
                  active={active === 1 || active === 2}
                  icon={Server}
                  title='API'
                  lines={['collect/run/abort', 'Emite execution/test/progress', 'Guarda reportes/assets']}
                />
                <FlowArrow active={active === 1 || active === 2} label='spawn (cwd=projectPath)' />
                <FlowNode
                  active={active === 1 || active === 2}
                  icon={TerminalSquare}
                  title='Playwright'
                  lines={['playwrightCmd (base)', '--list / test', 'reporter=line,json']}
                />
              </div>
              <div className='mt-3 flex items-center gap-2 overflow-hidden rounded-md border bg-background/70 p-2 text-xs'>
                <span className='shrink-0 font-medium text-foreground'>Eventos en tránsito:</span>
                <div className='relative h-6 flex-1 overflow-hidden rounded bg-muted/50'>
                  <div className='animate-flow-marquee absolute inset-y-0 left-0 flex items-center gap-2 whitespace-nowrap px-2'>
                    <span className='inline-flex h-2 w-2 rounded-full bg-cyan-500 animate-pulse' />
                    <span>profile:join</span>
                    <span className='text-primary'>→</span>
                    <span>execution:started</span>
                    <span className='text-primary'>→</span>
                    <span>test:output</span>
                    <span className='text-primary'>→</span>
                    <span>progress</span>
                    <span className='text-primary'>→</span>
                    <span>test:completed</span>
                    <span className='text-primary'>→</span>
                    <span>execution:completed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='space-y-4'>
            <div className='rounded-xl border bg-background/70 p-3 sm:p-4'>
              <div className='mb-2 flex items-center justify-between gap-2'>
                <div className='flex items-center gap-2 text-sm font-medium'>
                  <TerminalSquare className='size-4 text-primary' /> Consola en vivo (simulada)
                </div>
                <Badge variant={active === 2 ? 'default' : 'secondary'} className={cn(active === 2 && 'animate-pulse')}>
                  {active === 2 ? 'streaming' : 'standby'}
                </Badge>
              </div>
              <div className='space-y-2 rounded-lg border bg-slate-950 p-3 font-mono text-[11px] text-slate-200 shadow-inner'>
                {visibleEvents.map((ev, i) => (
                  <div
                    key={`${ev.label}-${tick}-${i}`}
                    className={cn(
                      'flex flex-wrap items-start gap-x-2 gap-y-0.5 rounded px-2 py-1 transition-all',
                      i === visibleEvents.length - 1 ? 'bg-white/5' : 'opacity-90'
                    )}
                  >
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                        ev.tone === 'ok' && 'bg-emerald-500/20 text-emerald-300',
                        ev.tone === 'fail' && 'bg-red-500/20 text-red-300',
                        ev.tone === 'done' && 'bg-amber-500/20 text-amber-300',
                        ev.tone === 'progress' && 'bg-sky-500/20 text-sky-300',
                        ev.tone === 'test' && 'bg-violet-500/20 text-violet-300',
                        ev.tone === 'output' && 'bg-slate-500/30 text-slate-200',
                        (ev.tone === 'info' || ev.tone === 'start') && 'bg-cyan-500/20 text-cyan-300'
                      )}
                    >
                      {ev.label}
                    </span>
                    <span className='min-w-0 flex-1 text-slate-300'>{ev.text}</span>
                  </div>
                ))}
              </div>
              <div className='mt-3 space-y-1.5'>
                <div className='flex items-center justify-between text-xs text-muted-foreground'>
                  <span>Progreso agregado (progress)</span>
                  <span className='tabular-nums'>{Math.min(progress, 100)}%</span>
                </div>
                <div className='h-2 overflow-hidden rounded-full bg-muted'>
                  <div
                    className='h-full rounded-full bg-gradient-to-r from-cyan-500 via-emerald-500 to-amber-400 transition-all duration-700'
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className='rounded-xl border p-3 sm:p-4'>
              <div className='mb-2 flex items-center gap-2 text-sm font-medium'>
                <FileJson2 className='size-4 text-primary' /> Composición de <span className='font-mono'>playwrightCmd</span>
              </div>
              <div className='space-y-2'>
                {CMD_ROWS.map((row) => (
                  <div key={row.title} className='rounded-lg border bg-muted/20 p-2.5'>
                    <div className='mb-1 flex items-center justify-between gap-2'>
                      <span className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>{row.title}</span>
                      <Badge variant='outline' className='h-5 text-[10px]'>base + args</Badge>
                    </div>
                    <code className='block overflow-x-auto rounded bg-background/80 p-2 text-[11px] leading-relaxed text-foreground'>
                      {row.cmd}
                    </code>
                    <p className='mt-1 text-xs text-muted-foreground'>{row.note}</p>
                  </div>
                ))}
                <p className='text-xs text-muted-foreground'>
                  Recomendado: <span className='font-mono text-foreground'>npx playwright</span> (sin <span className='font-mono'>test</span>). La API agrega targets, filtros y reporters.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className='grid gap-3 md:grid-cols-3'>
          <InfoPill
            icon={Radio}
            title='Sala por perfil'
            text='Socket.io: profile:join → room profile:<id>. Solo recibes eventos del perfil activo (X-Profile-Id).'
          />
          <InfoPill
            icon={RefreshCw}
            title='Catálogo sincronizado'
            text='En /tests usa Actualizar para recolectar desde el projectPath actual y evitar caché desfasada.'
          />
          <InfoPill
            icon={FileJson2}
            title='Reporte y artefactos'
            text='Al finalizar se guarda reporte JSON y assets (playwright-report/test-results) en profiles/<id>/reports/.'
          />
        </div>

        <style>{`
          @keyframes flow-marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-30%); }
          }
          .animate-flow-marquee {
            animation: flow-marquee 4s linear infinite;
          }
        `}</style>
      </CardContent>
    </Card>
  )
}

function FlowNode({
  active,
  icon: Icon,
  title,
  lines,
}: {
  active: boolean
  icon: React.ComponentType<{ className?: string }>
  title: string
  lines: string[]
}) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-background/80 p-3 transition-all duration-500',
        active && 'border-primary/40 shadow-sm shadow-primary/10 ring-1 ring-primary/20'
      )}
    >
      <div className='mb-2 flex items-center gap-2'>
        <div className={cn('rounded-md border p-1.5', active && 'bg-primary/10 text-primary')}>
          <Icon className={cn('size-4', active && 'animate-pulse')} />
        </div>
        <span className='text-sm font-semibold'>{title}</span>
        {active && <span className='ms-auto inline-flex h-2 w-2 animate-ping rounded-full bg-emerald-500' />}
      </div>
      <ul className='space-y-1 text-xs text-muted-foreground'>
        {lines.map((line) => (
          <li key={line} className='flex items-center gap-1.5'>
            <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-primary animate-pulse' : 'bg-muted-foreground/40')} />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function FlowArrow({ active, label }: { active: boolean; label: string }) {
  return (
    <div className='hidden items-center justify-center md:flex'>
      <div className='flex w-full flex-col items-center gap-1 text-[10px] text-muted-foreground'>
        <span>{label}</span>
        <div className='relative h-2 w-full overflow-hidden rounded-full bg-muted'>
          <div
            className={cn(
              'absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500',
              active ? 'animate-[flow-dot_1.2s_linear_infinite]' : 'opacity-30'
            )}
            style={{ left: active ? undefined : '33%' }}
          />
        </div>
        <span className='text-primary'>→</span>
      </div>
      <style>{`
        @keyframes flow-dot {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(320%); }
        }
      `}</style>
    </div>
  )
}

function InfoPill({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  text: string
}) {
  return (
    <div className='flex items-start gap-3 rounded-lg border bg-muted/10 p-3'>
      <div className='rounded-md border bg-background p-2 text-primary'>
        <Icon className='size-4' />
      </div>
      <div>
        <p className='text-sm font-medium'>{title}</p>
        <p className='mt-0.5 text-xs leading-relaxed text-muted-foreground'>{text}</p>
      </div>
    </div>
  )
}
