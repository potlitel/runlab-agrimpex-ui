import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  Cable,
  CheckCircle2,
  CircleDot,
  Container,
  FileJson2,
  MonitorPlay,
  Play,
  Radio,
  Server,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Workflow,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { configApi, dockerApi } from '@/lib/api'
import { useProfileStore } from '@/stores/profileStore'
import { cn } from '@/lib/utils'
import type { DockerAgentsResponse } from '@/types/contract'

type Stage = {
  id: string
  title: string
  detail: string
  icon: React.ComponentType<{ className?: string }>
  accent: string
}

const STAGES: Stage[] = [
  {
    id: 'register',
    title: '1. Registro saliente',
    detail: 'El agente abre Socket.io hacia la API con agentId + token y se une a agent:<id>.',
    icon: Cable,
    accent: 'from-cyan-500/30 to-sky-500/10',
  },
  {
    id: 'command',
    title: '2. Comando enrutado',
    detail: 'La API recibe la petición REST y emite agent:command {requestId, op, args} al agente del workstationId.',
    icon: Workflow,
    accent: 'from-violet-500/30 to-fuchsia-500/10',
  },
  {
    id: 'local',
    title: '3. Docker local',
    detail: 'El agente ejecuta docker/compose en su host. El socket del daemon nunca sale de la workstation.',
    icon: Container,
    accent: 'from-emerald-500/30 to-teal-500/10',
  },
  {
    id: 'stream',
    title: '4. Eventos y resultado',
    detail: 'agent:event se reenvía a la sala profile:<id> y agent:result cierra la petición HTTP.',
    icon: Radio,
    accent: 'from-amber-500/30 to-orange-500/10',
  },
  {
    id: 'next',
    title: '5. Siguiente slice',
    detail: 'collect / runTests también en el agente, devolviendo reportes y artefactos a la API central.',
    icon: FileJson2,
    accent: 'from-rose-500/30 to-pink-500/10',
  },
]

const EVENT_STREAM = [
  { label: 'agent:ready', text: 'ws-a registrado en la API central' },
  { label: 'agent:command', text: 'check · requestId=docker-1mz…' },
  { label: 'docker:started', text: 'levantando grid Selenium…' },
  { label: 'docker:log', text: 'Container selenium-hub  Starting' },
  { label: 'agent:event', text: 'evento reenviado a profile:perfil-1' },
  { label: 'agent:result', text: 'ok · check → Docker 29.7.1' },
  { label: 'profiles:status', text: 'perfil-1 corriendo (docker)' },
  { label: 'próximo', text: 'agent:command runTests → reporte + assets' },
]

type WorkstationView = {
  id: string
  label: string
  connectedAt?: string
  real: boolean
}

const SIMULATED: WorkstationView[] = [
  { id: 'ws-a', label: 'Workstation A', real: false },
  { id: 'ws-b', label: 'Workstation B', real: false },
  { id: 'ws-c', label: 'Workstation C', real: false },
]

export function AgentFlowOnboarding() {
  const [tick, setTick] = useState(0)
  const [paused, setPaused] = useState(false)
  const activeProfileId = useProfileStore((s) => s.activeProfileId)

  useEffect(() => {
    if (paused) return
    const id = window.setInterval(() => setTick((t) => t + 1), 1600)
    return () => window.clearInterval(id)
  }, [paused])

  const agentsQuery = useQuery({
    queryKey: ['docker', 'agents', 'flow'],
    queryFn: dockerApi.agents,
    retry: false,
    refetchInterval: 5000,
  })
  const configQuery = useQuery({
    queryKey: ['config', activeProfileId],
    queryFn: configApi.get,
    retry: false,
  })

  const active = tick % STAGES.length
  const realAgents = useMemo<DockerAgentsResponse['agents']>(
    () => agentsQuery.data?.agents ?? [],
    [agentsQuery.data?.agents]
  )
  const hasRealData = Array.isArray(agentsQuery.data?.agents)
  const assigned = (configQuery.data?.workstationId || '').trim()
  const transport = agentsQuery.data?.transport ?? 'agent'

  const workstations = useMemo<WorkstationView[]>(() => {
    if (!realAgents.length) return SIMULATED
    return realAgents.slice(0, 3).map((a) => ({
      id: a.agentId,
      label: a.label || a.agentId,
      connectedAt: a.connectedAt,
      real: true,
    }))
  }, [realAgents])

  const visibleEvents = useMemo(() => {
    const end = (tick % EVENT_STREAM.length) + 1
    return EVENT_STREAM.slice(Math.max(0, end - 4), end)
  }, [tick])

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
                <Radio
                  className={cn(
                    'size-3.5',
                    realAgents.length ? 'animate-pulse text-emerald-500' : 'text-muted-foreground'
                  )}
                />
                {hasRealData ? `API · ${realAgents.length} agente(s)` : 'Simulación'}
              </Badge>
              <Badge variant='secondary'>transporte {transport}</Badge>
              {assigned ? <Badge variant='outline'>perfil → {assigned}</Badge> : null}
            </div>
            <CardTitle className='text-xl sm:text-2xl'>
              Cómo el agente ejecuta Docker en cada workstation
            </CardTitle>
            <CardDescription className='max-w-3xl text-sm'>
              La UI y la API son centralizadas; el daemon Docker queda dentro de cada workstation. El
              agente conecta hacia fuera, ejecuta localmente y devuelve eventos y resultados por el
              mismo canal.
            </CardDescription>
          </div>
          <div className='flex shrink-0 flex-wrap items-center gap-2'>
            <Button size='sm' variant='outline' asChild>
              <Link to='/docker'>Ir a Docker</Link>
            </Button>
            <Button size='sm' variant='outline' onClick={() => setPaused((p) => !p)}>
              {paused ? <Play className='size-4' /> : <Activity className='size-4 animate-pulse' />}
              {paused ? 'Reanudar animación' : 'Pausar animación'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className='relative space-y-5 p-4 sm:p-5'>
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-5'>
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
                {isActive ? <span className='pointer-events-none absolute inset-0 animate-pulse bg-primary/5' /> : null}
                <div className='relative flex items-start gap-2'>
                  <div
                    className={cn('rounded-lg border bg-background/80 p-2', isActive && 'ring-2 ring-primary/30')}
                  >
                    <Icon className={cn('size-4', isActive && 'animate-bounce text-primary')} />
                  </div>
                  <div className='min-w-0 space-y-1'>
                    <div className='flex items-center gap-2'>
                      <p className='text-xs font-semibold'>{stage.title}</p>
                      {isActive ? (
                        <span className='inline-flex h-2 w-2 shrink-0 animate-ping rounded-full bg-emerald-500' />
                      ) : (
                        <CircleDot className='size-3.5 shrink-0 text-muted-foreground' />
                      )}
                    </div>
                    <p className='text-[11px] leading-relaxed text-muted-foreground'>{stage.detail}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className='rounded-xl border bg-muted/20 p-3 sm:p-4'>
          <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
            <div className='flex items-center gap-2 text-sm font-medium'>
              <Workflow className='size-4 text-primary' /> Flujo animado (Workstation → Agente → API → UI)
            </div>
            <div className='flex flex-wrap gap-2 text-xs'>
              <Badge variant='outline'>WebSocket saliente</Badge>
              <Badge variant='outline'>sala profile:&lt;id&gt;</Badge>
            </div>
          </div>

          <div className='grid gap-2 lg:grid-cols-[1.2fr_auto_0.8fr_auto_0.8fr] lg:items-stretch'>
            <div className='space-y-2'>
              {workstations.map((w) => (
                <FlowNode
                  key={w.id}
                  active={active === 0 || active === 2}
                  icon={Container}
                  title={w.label}
                  subtitle={w.real ? 'agente conectado' : 'simulada'}
                  highlighted={w.id === assigned}
                  lines={[
                    `ID: ${w.id}`,
                    'docker.sock local (no sale de aquí)',
                    w.connectedAt ? `conectado ${w.connectedAt}` : 'check / run / stop / start',
                  ]}
                />
              ))}
            </div>
            <FlowArrow active={active === 0 || active === 1} label='WebSocket saliente + token' />
            <FlowNode
              active={active === 1 || active === 3}
              icon={Server}
              title='API central'
              subtitle='contenedor del stack'
              lines={[
                'agentRegistry por agentId',
                'no spawnea docker',
                'enruta a profile:<id>',
              ]}
            />
            <FlowArrow active={active === 3} label='Socket.io' />
            <FlowNode
              active={active === 3}
              icon={MonitorPlay}
              title='UI'
              subtitle='centralizada'
              lines={['X-Profile-Id', 'docker:log / docker:exit', 'profiles:status']}
            />
          </div>

          <div className='mt-3 flex items-center gap-2 overflow-hidden rounded-md border bg-background/70 p-2 text-xs'>
            <span className='shrink-0 font-medium text-foreground'>Eventos en tránsito:</span>
            <div className='relative h-6 flex-1 overflow-hidden rounded bg-muted/50'>
              <div className='animate-agent-flow-marquee absolute inset-y-0 left-0 flex items-center gap-2 whitespace-nowrap px-2'>
                {EVENT_STREAM.map((ev) => (
                  <span key={ev.label} className='flex items-center gap-2'>
                    <span className='inline-flex h-2 w-2 rounded-full bg-cyan-500 animate-pulse' />
                    <span>{ev.label}</span>
                    <span className='text-primary'>→</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className='grid gap-3 lg:grid-cols-2'>
          <div className='rounded-xl border bg-background/70 p-3 sm:p-4'>
            <div className='mb-2 flex items-center justify-between gap-2'>
              <div className='flex items-center gap-2 text-sm font-medium'>
                <TerminalSquare className='size-4 text-primary' /> Consola del canal (simulada)
              </div>
              <Badge variant={active === 2 || active === 3 ? 'default' : 'secondary'}>
                {active === 2 || active === 3 ? 'streaming' : 'standby'}
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
                  <span className='rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-300'>
                    {ev.label}
                  </span>
                  <span className='min-w-0 flex-1 text-slate-300'>{ev.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className='rounded-xl border p-3 sm:p-4'>
            <div className='mb-2 flex items-center gap-2 text-sm font-medium'>
              <ShieldCheck className='size-4 text-primary' /> Agentes conectados (estado real)
            </div>
            {!hasRealData ? (
              <p className='text-xs text-muted-foreground'>
                No hay datos reales: se muestra la simulación. Configura{' '}
                <code>RUNLABQA_AGENT_TOKEN</code>, arranca los agentes y vuelve a cargar.
              </p>
            ) : realAgents.length === 0 ? (
              <p className='text-xs text-muted-foreground'>
                La API responde, pero no hay agentes registrados. Los nodos de arriba son simulados.
              </p>
            ) : (
              <ul className='space-y-2'>
                {realAgents.map((a) => (
                  <li
                    key={a.agentId}
                    className='flex items-center justify-between gap-2 rounded-lg border bg-muted/20 px-2.5 py-2 text-xs'
                  >
                    <span className='flex min-w-0 items-center gap-2'>
                      <CheckCircle2 className='size-3.5 shrink-0 text-emerald-500' />
                      <span className='truncate font-medium'>{a.label || a.agentId}</span>
                      {a.agentId === assigned ? (
                        <Badge variant='outline' className='h-5 shrink-0 text-[10px]'>perfil activo</Badge>
                      ) : null}
                    </span>
                    <code className='shrink-0 text-muted-foreground'>{a.agentId}</code>
                  </li>
                ))}
              </ul>
            )}
            <p className='mt-3 text-xs text-muted-foreground'>
              El agente tiene <span className='font-mono text-foreground'>root en su workstation</span> por
              diseño; la API central no monta ningún socket Docker.
            </p>
          </div>
        </div>

        <div className='grid gap-3 md:grid-cols-3'>
          <InfoPill
            icon={Cable}
            title='Conexión saliente'
            text='Sin puertos abiertos en la workstation: funciona detrás de NAT/firewall.'
          />
          <InfoPill
            icon={Container}
            title='Docker local'
            text='check / status / containers / run / stop / start / ensureGrid se ejecutan en la workstation.'
          />
          <InfoPill
            icon={FileJson2}
            title='Playwright, en la API'
            text='Hoy las suites siguen donde corre la API; ejecutarlas en el agente es el siguiente slice.'
          />
        </div>

        <style>{`
          @keyframes agent-flow-marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-agent-flow-marquee {
            animation: agent-flow-marquee 9s linear infinite;
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
  subtitle,
  highlighted,
  lines,
}: {
  active: boolean
  icon: React.ComponentType<{ className?: string }>
  title: string
  subtitle?: string
  highlighted?: boolean
  lines: string[]
}) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-background/80 p-3 transition-all duration-500',
        active && 'border-primary/40 shadow-sm shadow-primary/10 ring-1 ring-primary/20',
        highlighted && 'border-emerald-500/50 ring-1 ring-emerald-500/30'
      )}
    >
      <div className='mb-2 flex items-center gap-2'>
        <div className={cn('rounded-md border p-1.5', active && 'bg-primary/10 text-primary')}>
          <Icon className={cn('size-4', active && 'animate-pulse')} />
        </div>
        <span className='truncate text-sm font-semibold'>{title}</span>
        {active ? <span className='ms-auto inline-flex size-2 shrink-0 animate-ping rounded-full bg-emerald-500' /> : null}
      </div>
      {subtitle ? <p className='mb-1 text-[10px] uppercase tracking-wide text-muted-foreground'>{subtitle}</p> : null}
      <ul className='space-y-1 text-xs text-muted-foreground'>
        {lines.map((line) => (
          <li key={line} className='flex items-center gap-1.5'>
            <span
              className={cn('size-1.5 shrink-0 rounded-full', active ? 'animate-pulse bg-primary' : 'bg-muted-foreground/40')}
            />
            <span className='truncate' title={line}>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function FlowArrow({ active, label }: { active: boolean; label: string }) {
  return (
    <div className='flex items-center justify-center lg:flex-col'>
      <div className='flex w-full flex-col items-center gap-1 text-[10px] text-muted-foreground'>
        <span className='text-center'>{label}</span>
        <div className='relative h-2 w-full overflow-hidden rounded-full bg-muted'>
          <div
            className={cn(
              'absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500',
              active ? 'animate-agent-flow-dot' : 'opacity-30'
            )}
            style={{ left: active ? undefined : '33%' }}
          />
        </div>
        <span className='text-primary'>→</span>
      </div>
      <style>{`
        @keyframes agent-flow-dot {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(320%); }
        }
        .animate-agent-flow-dot {
          animation: agent-flow-dot 1.4s linear infinite;
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
