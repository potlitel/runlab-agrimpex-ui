import { useMemo, useState } from 'react'
import { Download, Eraser, GitBranch, Hammer, PackagePlus, Play, RefreshCw, Save, Terminal, Wrench } from 'lucide-react'
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
              <Button size='sm' variant='outline' onClick={settings.refreshStatus}>
                <RefreshCw className='size-4' />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='flex items-center justify-between gap-2'>
            <div className='text-sm font-medium'>Chequeo de herramientas</div>
            <Button size='sm' variant='outline' onClick={settings.runCheck} disabled={settings.checkLoading}>
              <Terminal className='size-4' /> {settings.checkLoading ? 'Comprobando…' : 'Comprobar'}
            </Button>
          </div>
          {settings.checkError ? (
            <p className='text-sm text-destructive'>{settings.checkError}</p>
          ) : check ? (
            <div className='grid gap-2 sm:grid-cols-3'>
              {Object.entries(check).map(([key, val]) => {
                const ok = typeof val === 'object' && val && 'ok' in val ? !!(val as { ok: boolean }).ok : false
                const err = typeof val === 'object' && val && 'error' in val ? (val as { error?: string }).error : undefined
                return (
                  <div key={key} className='rounded-md border p-3'>
                    <div className='flex items-center justify-between gap-2'>
                      <span className='font-medium capitalize'>{key}</span>
                      <Badge variant={ok ? 'default' : 'secondary'}>{ok ? 'OK' : 'No disponible'}</Badge>
                    </div>
                    {err && <p className='mt-1 text-xs text-muted-foreground'>{err}</p>}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className='text-sm text-muted-foreground'>Ejecuta el chequeo para ver el estado de git, python y venv.</p>
          )}
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
