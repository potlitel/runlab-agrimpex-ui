import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Circle,
  Clock3,
  Download,
  Eraser,
  GitBranch,
  Hammer,
  Loader2,
  PackagePlus,
  Play,
  RefreshCw,
  Save,
  Terminal,
  Wrench,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { useAutomationSettings } from '../use-automation-settings'

function ProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
      <div className='h-full bg-primary transition-all' style={{ width: `${clamped}%` }} />
    </div>
  )
}

type Props = {
  settings: ReturnType<typeof useAutomationSettings>
  configProjectPath?: string
}

export function AutomationSection({ settings, configProjectPath }: Props) {
  const initial = settings.config
  return (
    <AutomationInner
      key={`${initial.repoUrl}|${initial.installPath}`}
      initialRepoUrl={initial.repoUrl ?? ''}
      initialInstallPath={initial.installPath ?? ''}
      settings={settings}
      configProjectPath={configProjectPath}
    />
  )
}

function AutomationInner({
  initialRepoUrl,
  initialInstallPath,
  settings,
  configProjectPath,
}: {
  initialRepoUrl: string
  initialInstallPath: string
  settings: ReturnType<typeof useAutomationSettings>
  configProjectPath?: string
}) {
  const [repoUrl, setRepoUrl] = useState(initialRepoUrl)
  const [installPath, setInstallPath] = useState(initialInstallPath)
  const [branch, setBranch] = useState<string>('')
  const [envProjectPath, setEnvProjectPath] = useState(configProjectPath ?? '')
  const [applyPath, setApplyPath] = useState(initialInstallPath || configProjectPath || '')
  const [applyPlaywrightCmd, setApplyPlaywrightCmd] = useState('')
  const [applyPytestCmd, setApplyPytestCmd] = useState('pytest')

  const status = settings.status
  const busy = !!status?.installing || !!status?.pulling || !!status?.envBusy

  const installStatus = settings.installStatus
  const check = settings.check

  const branchOptions = useMemo(() => settings.branches.filter(Boolean), [settings.branches])

  if (settings.configLoading) {
    return <p className='text-sm text-muted-foreground'>Cargando configuración de automatización…</p>
  }

  return (
    <div className='space-y-4'>
      {settings.configError && <p className='text-sm text-destructive'>{settings.configError}</p>}

      <Card>
        <CardHeader>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
            <div>
              <CardTitle>Estado y chequeos</CardTitle>
              <CardDescription>Disponibilidad de herramientas y operaciones en curso.</CardDescription>
            </div>
            <div className='flex flex-wrap gap-2'>
              <Badge variant={status?.installing ? 'default' : 'outline'}>Instalando: {status?.installing ? 'sí' : 'no'}</Badge>
              <Badge variant={status?.pulling ? 'default' : 'outline'}>Actualizando: {status?.pulling ? 'sí' : 'no'}</Badge>
              <Badge variant={status?.envBusy ? 'default' : 'outline'}>Entorno: {status?.envBusy ? 'ocupado' : 'libre'}</Badge>
              <Button size='sm' variant='outline' onClick={settings.refreshStatus} title='Refrescar estado de operaciones'>
                <RefreshCw className='size-4' />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <AutomationChecks
            check={check}
            loading={settings.checkLoading}
            error={settings.checkError}
            requestedAt={settings.checkRequestedAt}
            lastCheckedAt={settings.lastCheckedAt}
            onRun={settings.runCheck}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuración de automatización</CardTitle>
          <CardDescription>Repositorio fuente y ruta de instalación del proyecto de pruebas.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-1.5'>
              <Label htmlFor='auto-repo'>URL del repositorio</Label>
              <Input id='auto-repo' value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder='https://... o git@...' />
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='auto-path'>Ruta de instalación</Label>
              <Input id='auto-path' value={installPath} onChange={(e) => setInstallPath(e.target.value)} placeholder='/ruta/de/instalacion' />
            </div>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button
              variant='outline'
              onClick={() => void settings.saveConfig({ repoUrl, installPath })}
              disabled={settings.savingConfig}
            >
              <Save className='size-4' /> {settings.savingConfig ? 'Guardando…' : 'Guardar config'}
            </Button>
            <Button
              variant='outline'
              onClick={() => void settings.refreshInstallStatus()}
              disabled={!installPath || settings.installStatusLoading}
            >
              <RefreshCw className='size-4' /> Estado de instalación
            </Button>
          </div>
          {installStatus && (
            <div className='flex flex-wrap gap-2 text-sm'>
              <Badge variant={installStatus.repoCloned ? 'default' : 'outline'}>Repo: {installStatus.repoCloned ? 'sí' : 'no'}</Badge>
              <Badge variant={installStatus.venvCreated ? 'default' : 'outline'}>Venv: {installStatus.venvCreated ? 'sí' : 'no'}</Badge>
              <Badge variant={installStatus.depsInstalled ? 'default' : 'outline'}>Deps: {installStatus.depsInstalled ? 'sí' : 'no'}</Badge>
              <Badge variant={installStatus.fullyInstalled ? 'default' : 'secondary'}>Completo: {installStatus.fullyInstalled ? 'sí' : 'no'}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <div className='grid gap-4 xl:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Instalar</CardTitle>
            <CardDescription>Clona e instala el proyecto de automatización.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {settings.installProgress && (
              <div className='space-y-1'>
                <div className='flex justify-between text-xs text-muted-foreground'>
                  <span>{settings.installProgress.label}</span>
                  <span>{settings.installProgress.percent}%</span>
                </div>
                <ProgressBar value={settings.installProgress.percent} />
              </div>
            )}
            <Button
              onClick={() => settings.install({ repoUrl, installPath })}
              disabled={busy || !repoUrl || !installPath || settings.installing}
            >
              <Hammer className='size-4' /> {status?.installing ? 'Instalando…' : 'Iniciar instalación'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actualizar (pull)</CardTitle>
            <CardDescription>Actualiza el repositorio instalado desde una rama remota.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-end'>
              <div className='flex-1 space-y-1.5'>
                <Label>Rama</Label>
                <Select value={branch || undefined} onValueChange={setBranch}>
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder={branchOptions.length ? 'Selecciona una rama' : 'Carga ramas para seleccionar'} />
                  </SelectTrigger>
                  <SelectContent>
                    {branchOptions.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {settings.branchesError && <p className='text-xs text-destructive'>{settings.branchesError}</p>}
              </div>
              <Button
                type='button'
                variant='outline'
                onClick={() => void settings.fetchBranches()}
                disabled={!installPath || settings.branchesLoading}
              >
                <GitBranch className='size-4' /> {settings.branchesLoading ? 'Cargando…' : 'Cargar ramas'}
              </Button>
            </div>
            {settings.updateProgress && (
              <div className='space-y-1'>
                <div className='flex justify-between text-xs text-muted-foreground'>
                  <span>{settings.updateProgress.label}</span>
                  <span>{settings.updateProgress.percent}%</span>
                </div>
                <ProgressBar value={settings.updateProgress.percent} />
              </div>
            )}
            <Button
              onClick={() => settings.update({ installPath, branch: branch || undefined })}
              disabled={busy || !installPath || settings.updating}
            >
              <Download className='size-4' /> {status?.pulling ? 'Actualizando…' : 'Actualizar'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entorno Python (proyecto existente)</CardTitle>
          <CardDescription>Prepara el entorno virtual e instala dependencias sin clonar.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='space-y-1.5'>
            <Label htmlFor='env-project-path'>Ruta del proyecto</Label>
            <Input
              id='env-project-path'
              value={envProjectPath}
              onChange={(e) => setEnvProjectPath(e.target.value)}
              placeholder={configProjectPath || '/ruta/al/proyecto'}
            />
            <p className='text-xs text-muted-foreground'>Si se omite, el backend usará el proyecto configurado.</p>
          </div>
          {settings.envProgress && (
            <div className='space-y-1'>
              <div className='flex justify-between text-xs text-muted-foreground'>
                <span>{settings.envProgress.label ?? 'Procesando…'}</span>
                {typeof settings.envProgress.percent === 'number' && <span>{settings.envProgress.percent}%</span>}
              </div>
              {typeof settings.envProgress.percent === 'number' && <ProgressBar value={settings.envProgress.percent} />}
            </div>
          )}
          <div className='flex flex-wrap gap-2'>
            <Button
              variant='outline'
              onClick={() => settings.setupVenv(envProjectPath || undefined)}
              disabled={busy || settings.envBusy}
            >
              <Wrench className='size-4' /> Crear/validar venv
            </Button>
            <Button
              variant='outline'
              onClick={() => settings.setupDeps(envProjectPath || undefined)}
              disabled={busy || settings.envBusy}
            >
              <PackagePlus className='size-4' /> Instalar dependencias
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aplicar al proyecto</CardTitle>
          <CardDescription>Actualiza la configuración principal con la ruta/comandos del proyecto de automatización.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='grid gap-3 md:grid-cols-3'>
            <div className='space-y-1.5 md:col-span-3'>
              <Label htmlFor='apply-path'>Ruta del proyecto</Label>
              <Input id='apply-path' value={applyPath} onChange={(e) => setApplyPath(e.target.value)} placeholder={installPath || configProjectPath} />
            </div>
            <div className='space-y-1.5 md:col-span-2'>
              <Label htmlFor='apply-pw'>Comando Playwright</Label>
              <Input id='apply-pw' value={applyPlaywrightCmd} onChange={(e) => setApplyPlaywrightCmd(e.target.value)} placeholder='npx playwright test' />
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='apply-py'>Comando Pytest</Label>
              <Input id='apply-py' value={applyPytestCmd} onChange={(e) => setApplyPytestCmd(e.target.value)} placeholder='pytest' />
            </div>
          </div>
          <Button
            onClick={() =>
              void settings.apply({
                projectPath: applyPath || undefined,
                ...(applyPlaywrightCmd ? { playwrightCmd: applyPlaywrightCmd } : {}),
                ...(applyPytestCmd ? { pytestCmd: applyPytestCmd } : {}),
              })
            }
            disabled={settings.applying || !applyPath}
          >
            <Play className='size-4' /> {settings.applying ? 'Aplicando…' : 'Aplicar a configuración'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='border-b pb-4'>
          <div className='flex items-center justify-between gap-2'>
            <CardTitle>Logs y progreso</CardTitle>
            <Button size='sm' variant='outline' onClick={settings.clearLogs} disabled={settings.logs.length === 0}>
              <Eraser className='size-4' /> Limpiar
            </Button>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          <ScrollArea className='h-72'>
            <div className='space-y-1 p-4 font-mono text-xs'>
              {settings.logs.length === 0 ? (
                <p className='font-sans text-sm text-muted-foreground'>Sin eventos. Inicia una operación para ver progreso y logs.</p>
              ) : (
                settings.logs.map((log) => (
                  <div
                    key={log.id}
                    className={
                      log.type === 'error'
                        ? 'text-destructive'
                        : log.type === 'success'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : ''
                    }
                  >
                    <span className='me-2 text-muted-foreground'>[{log.source}] {new Date(log.at).toLocaleTimeString()}</span>
                    {log.message}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

type CheckValue = {
  ok?: boolean
  error?: string
  version?: string
  cmd?: string
  installed?: boolean
  daemonRunning?: boolean
}

type CheckResult = Record<string, unknown> | null

const CHECK_TOOLS: Array<{ key: string; label: string; description: string }> = [
  { key: 'python', label: 'Python', description: 'Intérprete para flujos legacy y utilidades del entorno' },
  { key: 'git', label: 'Git', description: 'Control de versiones para clonado y actualización de repos' },
  { key: 'venv', label: 'Virtualenv', description: 'Creación de entornos virtuales Python (cuando aplica)' },
  { key: 'docker', label: 'Docker', description: 'Motor/contenedores para grid y flujos opcionales' },
  { key: 'platform', label: 'Plataforma', description: 'Sistema operativo detectado por la API' },
]

function formatCheckValue(
  key: string,
  value: unknown
): { ok: boolean | null; detail: string; status: string } {
  if (key === 'platform') {
    const text = typeof value === 'string' ? value : value == null ? '' : String(value)
    return {
      ok: text ? true : null,
      detail: text || 'No detectada',
      status: text ? 'Detectada' : 'Sin datos',
    }
  }

  const v = (value ?? {}) as CheckValue
  const ok = typeof v.ok === 'boolean' ? v.ok : null

  if (key === 'docker') {
    if (ok) {
      const parts = ['Instalado']
      if (v.version) parts.push(`v${v.version}`)
      if (v.daemonRunning === false) parts.push('(daemon no disponible)')
      return { ok, detail: parts.join(' '), status: 'Disponible' }
    }
    return { ok: false, detail: v.error || 'Docker no disponible', status: 'No disponible' }
  }

  if (ok) {
    const parts: string[] = []
    if (v.version) parts.push(`v${v.version}`)
    if (v.cmd) parts.push(`(${v.cmd})`)
    if (v.installed === false) parts.push('no instalado')
    return { ok, detail: parts.join(' ') || 'Herramienta disponible', status: 'OK' }
  }

  return { ok: false, detail: v.error || 'No disponible', status: 'No disponible' }
}

function AutomationChecks({
  check,
  loading,
  error,
  requestedAt,
  lastCheckedAt,
  onRun,
}: {
  check: CheckResult
  loading: boolean
  error: string | null
  requestedAt: number | null
  lastCheckedAt: number | null
  onRun: () => void
}) {
  const [animProgress, setAnimProgress] = useState(0)
  const [animStep, setAnimStep] = useState(0)

  useEffect(() => {
    if (!loading) return

    const started = requestedAt ?? Date.now()
    const tick = window.setInterval(() => {
      const elapsed = Date.now() - started
      const pct = Math.min(92, 8 + Math.round((elapsed / 2400) * 84))
      setAnimProgress(pct)
      setAnimStep(Math.min(CHECK_TOOLS.length - 1, Math.floor((pct / 100) * CHECK_TOOLS.length)))
    }, 180)

    // Inicio diferido para evitar setState síncrono dentro del efecto.
    const init = window.setTimeout(() => {
      setAnimProgress(8)
      setAnimStep(0)
    }, 0)

    return () => {
      window.clearInterval(tick)
      window.clearTimeout(init)
    }
  }, [loading, requestedAt])

  const progress = loading ? animProgress : check || error ? 100 : 0
  const activeStep = loading ? animStep : CHECK_TOOLS.length

  const hasResult = !!check
  const checkedLabel = lastCheckedAt ? new Date(lastCheckedAt).toLocaleString() : null
  const overallState = loading ? 'running' : error ? 'error' : hasResult ? 'done' : 'idle'

  return (
    <div className='space-y-3'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div className='space-y-1'>
          <div className='text-sm font-medium'>Chequeo de herramientas</div>
          <p className='text-xs text-muted-foreground'>
            Verifica dependencias del sistema y del entorno de automatización con estado por herramienta.
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          {checkedLabel && !loading ? (
            <span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
              <Clock3 className='size-3.5' />
              Último chequeo: {checkedLabel}
            </span>
          ) : null}
          <Button size='sm' variant={hasResult ? 'outline' : 'default'} onClick={onRun} disabled={loading}>
            {loading ? <Loader2 className='size-4 animate-spin' /> : <Terminal className='size-4' />}
            {loading ? 'Comprobando…' : hasResult ? 'Volver a comprobar' : 'Comprobar'}
          </Button>
        </div>
      </div>

      {overallState !== 'idle' ? (
        <div className='space-y-2 rounded-md border bg-muted/20 p-3'>
          <div className='flex items-center justify-between gap-2 text-xs text-muted-foreground'>
            <span>
              {overallState === 'running'
                ? 'Ejecutando comprobaciones de estado por herramienta…'
                : overallState === 'error'
                  ? 'El chequeo finalizó con error'
                  : 'Comprobaciones completadas'}
            </span>
            <span className='tabular-nums'>{progress}%</span>
          </div>
          <div className='h-2 w-full overflow-hidden rounded-full bg-muted'>
            <div
              className={cn(
                'h-full transition-all duration-300',
                overallState === 'error'
                  ? 'bg-destructive'
                  : overallState === 'running'
                    ? 'animate-pulse bg-primary/80'
                    : 'bg-green-600'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          {overallState === 'running' ? (
            <p className='text-xs text-muted-foreground'>
              Consultando estado de: {CHECK_TOOLS[Math.min(activeStep, CHECK_TOOLS.length - 1)]?.label ?? 'herramientas'}…
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? <p className='text-sm text-destructive'>{error}</p> : null}

      {!hasResult && !loading && !error ? (
        <div className='rounded-md border border-dashed p-4 text-sm text-muted-foreground'>
          <p className='font-medium text-foreground'>Aún no se ejecutó el chequeo</p>
          <p className='mt-1'>
            Pulsa <span className='font-medium'>Comprobar</span> para validar Python, Git, Virtualenv, Docker y la
            plataforma. Verás progreso y el estado de cada verificación.
          </p>
        </div>
      ) : (
        <div className='grid gap-2 md:grid-cols-2'>
          {CHECK_TOOLS.map((tool, idx) => {
            const rawValue = check ? (check as Record<string, unknown>)[tool.key] : undefined
            const isChecking = loading && idx <= activeStep
            const formatted =
              !loading && (hasResult || rawValue !== undefined)
                ? formatCheckValue(tool.key, rawValue)
                : null

            const state: 'idle' | 'pending' | 'checking' | 'ok' | 'fail' = loading
              ? isChecking
                ? 'checking'
                : 'pending'
              : formatted
                ? formatted.ok === false
                  ? 'fail'
                  : 'ok'
                : error
                  ? 'fail'
                  : 'idle'

            return (
              <div
                key={tool.key}
                className={cn(
                  'rounded-md border p-3 transition-colors',
                  state === 'checking' && 'border-primary/40 bg-primary/5',
                  state === 'pending' && 'border-dashed opacity-80',
                  state === 'ok' && 'border-green-600/30 bg-green-600/5',
                  state === 'fail' && 'border-destructive/30 bg-destructive/5'
                )}
              >
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <div className='flex items-center gap-2'>
                      {state === 'checking' ? (
                        <Loader2 className='size-4 animate-spin text-primary' />
                      ) : state === 'ok' ? (
                        <CheckCircle2 className='size-4 text-green-600' />
                      ) : state === 'fail' ? (
                        <XCircle className='size-4 text-destructive' />
                      ) : state === 'pending' ? (
                        <Loader2 className='size-4 animate-spin text-muted-foreground/60' />
                      ) : (
                        <Circle className='size-4 text-muted-foreground' />
                      )}
                      <span className='font-medium'>{tool.label}</span>
                    </div>
                    <p className='mt-1 text-xs text-muted-foreground'>{tool.description}</p>
                  </div>
                  <Badge
                    variant={state === 'ok' ? 'default' : state === 'fail' ? 'secondary' : 'outline'}
                    className={cn(
                      state === 'ok' && 'bg-green-600 text-white hover:bg-green-600',
                      state === 'checking' && 'border-primary/40 text-primary',
                      state === 'pending' && 'text-muted-foreground'
                    )}
                  >
                    {state === 'checking'
                      ? 'Verificando…'
                      : state === 'pending'
                        ? 'Pendiente'
                        : formatted?.status ?? (error ? 'Sin datos' : '—')}
                  </Badge>
                </div>
                <div className='mt-2 min-h-5 text-sm'>
                  {state === 'checking' ? (
                    <span className='text-muted-foreground'>
                      Comprobando estado de {tool.label.toLowerCase()}…
                    </span>
                  ) : null}
                  {state === 'pending' ? (
                    <span className='text-muted-foreground'>En cola para verificación.</span>
                  ) : null}
                  {!loading && formatted ? (
                    <span className={cn(formatted.ok === false ? 'text-destructive' : 'text-foreground')}>
                      {formatted.detail}
                    </span>
                  ) : null}
                  {!loading && !formatted && error ? (
                    <span className='text-muted-foreground'>No se pudo obtener el estado.</span>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
