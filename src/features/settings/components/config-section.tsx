import { useState } from 'react'
import { Camera, FolderOpen, FileSearch, RefreshCw, Save, ShieldCheck, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  EVIDENCE_DEFAULTS,
  type Config,
  type EvidenceConfig,
  type ScreenshotImageFormat,
  type ScreenshotMode,
  type ScreenshotScale,
  type TraceMode,
  type VideoMode,
} from '@/types/contract'
import type { UseConfigSettingsReturn } from '../use-config-settings'

type Props = {
  settings: UseConfigSettingsReturn
}

// Debe cumplir la validación del servidor: /^[A-Za-z0-9._-]{1,64}$/ (server.js).
function generateAgentId() {
  const bytes = new Uint8Array(3)
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256)
  }
  return `ws-${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`
}

export function ConfigSection({ settings }: Props) {
  return (
    <ConfigForm
      key={JSON.stringify(settings.config)}
      initial={settings.config}
      settings={settings}
    />
  )
}

function ConfigForm({ initial, settings }: { initial: Config; settings: UseConfigSettingsReturn }) {
  const [form, setForm] = useState<Config>(initial)

  function set<K extends keyof Config>(key: K, value: Config[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function setEvidence<K extends keyof EvidenceConfig>(key: K, value: EvidenceConfig[K] | undefined) {
    setForm((prev) => {
      const next = { ...(prev.evidence ?? {}) } as EvidenceConfig
      if (value === undefined) {
        delete (next as Record<string, unknown>)[key as string]
      } else {
        next[key] = value
      }
      const cleaned = Object.fromEntries(Object.entries(next).filter(([, v]) => v !== undefined))
      return { ...prev, evidence: Object.keys(cleaned).length ? (cleaned as EvidenceConfig) : undefined }
    })
  }

  async function pick(field: keyof Config, type: 'folder' | 'file') {
    const current = typeof form[field] === 'string' ? (form[field] as string) : ''
    const path = await settings.browse(type, current || undefined)
    if (path) set(field, path)
  }

  async function onDetectEnv() {
    const path = await settings.detectEnv(form.projectPath || undefined)
    if (path) set('envPath', path)
  }

  async function onValidate() {
    await settings.validate({
      projectPath: form.projectPath,
      playwrightCmd: form.playwrightCmd,
      pytestCmd: form.pytestCmd,
    })
  }

  if (settings.loading) {
    return <p className='text-sm text-muted-foreground'>Cargando configuración…</p>
  }

  if (settings.error) {
    return (
      <Card>
        <CardContent className='flex items-center justify-between gap-4 p-6'>
          <p className='text-sm text-destructive'>{settings.error}</p>
          <Button variant='outline' size='sm' onClick={settings.refetch}>
            <RefreshCw className='size-4' /> Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <CardTitle>Proyecto y rutas</CardTitle>
          <CardDescription>
            Configura las rutas del proyecto de pruebas, la workstation que ejecutará Docker y las fuentes de datos.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <PathField
            id='projectPath'
            label='Ruta del proyecto'
            value={form.projectPath ?? ''}
            onChange={(v) => set('projectPath', v)}
            onBrowse={() => void pick('projectPath', 'folder')}
            browsing={settings.browsing === 'folder'}
            placeholder='/ruta/al/proyecto'
          />
          <div className='grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end'>
            <div className='space-y-1.5'>
              <Label htmlFor='workstationId'>ID del agente Docker</Label>
              <Input
                id='workstationId'
                value={form.workstationId ?? ''}
                onChange={(e) => set('workstationId', e.target.value)}
                placeholder='ws-a'
              />
            </div>
            <Button type='button' variant='outline' onClick={() => set('workstationId', generateAgentId())}>
              <Sparkles className='size-4' /> Generar ID
            </Button>
          </div>
          <p className='text-xs text-muted-foreground'>
            Identifica la workstation que ejecutará Docker. Debe coincidir con{' '}
            <code>RUNLABQA_AGENT_ID</code> en el agente. La ruta del proyecto se resuelve allí, no en el
            servidor. Usa <strong>Generar ID</strong> y copia el valor en la workstation; cámbialo solo en
            los perfiles afectados si sustituyes esa máquina.
          </p>
          <div className='grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-end'>
            <div className='space-y-1.5'>
              <Label htmlFor='envPath'>Archivo .env</Label>
              <Input
                id='envPath'
                value={form.envPath ?? ''}
                onChange={(e) => set('envPath', e.target.value)}
                placeholder='/ruta/al/.env'
              />
            </div>
            <Button type='button' variant='outline' onClick={() => void pick('envPath', 'file')} disabled={settings.browsing === 'file'}>
              <FileSearch className='size-4' /> Explorar
            </Button>
            <Button type='button' variant='outline' onClick={() => void onDetectEnv()} disabled={settings.detecting || !form.projectPath}>
              <FolderOpen className='size-4' /> {settings.detecting ? 'Detectando…' : 'Detectar'}
            </Button>
          </div>

          <Separator />

          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-1.5'>
              <Label htmlFor='playwrightCmd'>Comando Playwright</Label>
              <Input
                id='playwrightCmd'
                value={form.playwrightCmd ?? ''}
                onChange={(e) => set('playwrightCmd', e.target.value)}
                placeholder='npx playwright'
              />
              <p className='text-xs text-muted-foreground'>
                Comando base que la API usa para recolectar y ejecutar tests (se antepone a <span className='font-mono'>test</span>). Recomendado: <span className='font-mono'>npx playwright</span>.
              </p>
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='pytestCmd'>Comando Pytest (compatibilidad)</Label>
              <Input
                id='pytestCmd'
                value={form.pytestCmd ?? ''}
                onChange={(e) => set('pytestCmd', e.target.value)}
                placeholder='pytest'
              />
            </div>
          </div>

          <div className='grid gap-4 md:grid-cols-2'>
            <PathField
              id='txtFolderPath'
              label='Carpeta de datos TXT'
              value={form.txtFolderPath ?? ''}
              onChange={(v) => set('txtFolderPath', v)}
              onBrowse={() => void pick('txtFolderPath', 'folder')}
              browsing={settings.browsing === 'folder'}
            />
            <PathField
              id='jsonDataPath'
              label='Carpeta de datos JSON'
              value={form.jsonDataPath ?? ''}
              onChange={(v) => set('jsonDataPath', v)}
              onBrowse={() => void pick('jsonDataPath', 'folder')}
              browsing={settings.browsing === 'folder'}
            />
          </div>

          <div className='grid gap-4 md:grid-cols-2'>
            <PathField
              id='errorImagesPath'
              label='Carpeta de evidencias/imágenes'
              value={form.errorImagesPath ?? ''}
              onChange={(v) => set('errorImagesPath', v)}
              onBrowse={() => void pick('errorImagesPath', 'folder')}
              browsing={settings.browsing === 'folder'}
            />
            <div className='space-y-1.5'>
              <Label htmlFor='seleniumRemoteUrl'>URL remota de Selenium</Label>
              <Input
                id='seleniumRemoteUrl'
                value={form.seleniumRemoteUrl ?? ''}
                onChange={(e) => set('seleniumRemoteUrl', e.target.value)}
                placeholder='http://localhost:4444/wd/hub'
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className='flex items-center gap-2'>
            <Camera className='size-5 text-muted-foreground' />
            <div>
              <CardTitle>Evidencias de ejecución (Playwright)</CardTitle>
              <CardDescription>
                Controla la captura de screenshots, video y trazas para los reportes. Si se deja en “Según proyecto”, se respeta el <span className='font-mono'>playwright.config</span> del proyecto.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-1.5'>
              <Label>Captura de screenshot</Label>
              <Select
                value={form.evidence?.screenshot ?? 'project'}
                onValueChange={(v) => setEvidence('screenshot', v === 'project' ? undefined : (v as ScreenshotMode))}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Según proyecto' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='project'>Según proyecto (sin override)</SelectItem>
                  <SelectItem value='always'>Siempre (passed y failed)</SelectItem>
                  <SelectItem value='only-on-failure'>Solo en fallos</SelectItem>
                  <SelectItem value='off'>Desactivado</SelectItem>
                </SelectContent>
              </Select>
              <p className='text-xs text-muted-foreground'>
                “Siempre” genera una foto por test sin importar el resultado, útil para mostrar una imagen por reporte en el historial.
              </p>
            </div>
            <div className='space-y-1.5'>
              <Label>Video</Label>
              <Select
                value={form.evidence?.video ?? 'project'}
                onValueChange={(v) => setEvidence('video', v === 'project' ? undefined : (v as VideoMode))}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Según proyecto' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='project'>Según proyecto (sin override)</SelectItem>
                  <SelectItem value='on'>Siempre</SelectItem>
                  <SelectItem value='retain-on-failure'>Conservar solo en fallos</SelectItem>
                  <SelectItem value='on-first-retry'>Solo en primer reintento</SelectItem>
                  <SelectItem value='off'>Desactivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-1.5'>
              <Label>Trace</Label>
              <Select
                value={form.evidence?.trace ?? 'project'}
                onValueChange={(v) => setEvidence('trace', v === 'project' ? undefined : (v as TraceMode))}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Según proyecto' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='project'>Según proyecto (sin override)</SelectItem>
                  <SelectItem value='on'>Siempre</SelectItem>
                  <SelectItem value='retain-on-failure'>Conservar solo en fallos</SelectItem>
                  <SelectItem value='on-first-retry'>Solo en primer reintento</SelectItem>
                  <SelectItem value='off'>Desactivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='flex items-center justify-between gap-3 rounded-md border p-3 md:mt-6'>
              <div>
                <Label htmlFor='evidence-fullpage' className='cursor-pointer font-medium'>Screenshot de página completa</Label>
                <p className='text-xs text-muted-foreground'>Aplica cuando la captura de screenshots está activa (fullPage).</p>
              </div>
              <Switch
                id='evidence-fullpage'
                checked={!!form.evidence?.fullPage}
                onCheckedChange={(v) => setEvidence('fullPage', v ? true : undefined)}
              />
            </div>
          </div>

          <Separator />

          <div className='grid gap-4 md:grid-cols-3'>
            <div className='space-y-1.5'>
              <Label htmlFor='evidence-image-format'>Formato de captura</Label>
              <Select
                value={form.evidence?.imageFormat ?? 'default'}
                onValueChange={(v) => setEvidence('imageFormat', v === 'default' ? undefined : (v as ScreenshotImageFormat))}
              >
                <SelectTrigger id='evidence-image-format' className='w-full'>
                  <SelectValue placeholder='Predeterminado' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='default'>Predeterminado ({EVIDENCE_DEFAULTS.imageFormat})</SelectItem>
                  <SelectItem value='png'>PNG</SelectItem>
                  <SelectItem value='jpeg'>JPEG</SelectItem>
                  <SelectItem value='jpg'>JPG</SelectItem>
                </SelectContent>
              </Select>
              <p className='text-xs text-muted-foreground'>El helper del kit usa este formato al guardar la evidencia.</p>
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='evidence-image-quality'>Calidad JPEG (1–100)</Label>
              <Input
                id='evidence-image-quality'
                type='number'
                min={1}
                max={100}
                value={form.evidence?.imageQuality ?? ''}
                onChange={(e) => {
                  const raw = e.target.value
                  const quality = raw === '' ? undefined : Number(raw)
                  setEvidence(
                    'imageQuality',
                    Number.isInteger(quality) && quality! >= 1 && quality! <= 100
                      ? (quality as number)
                      : undefined,
                  )
                }}
                placeholder={`Predeterminado: ${EVIDENCE_DEFAULTS.imageQuality}`}
              />
              <p className='text-xs text-muted-foreground'>Solo afecta a JPEG/JPG; PNG ignora la calidad.</p>
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='evidence-scale'>Escala del screenshot</Label>
              <Select
                value={form.evidence?.scale ?? 'default'}
                onValueChange={(v) => setEvidence('scale', v === 'default' ? undefined : (v as ScreenshotScale))}
              >
                <SelectTrigger id='evidence-scale' className='w-full'>
                  <SelectValue placeholder='Predeterminado' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='default'>Predeterminada ({EVIDENCE_DEFAULTS.scale})</SelectItem>
                  <SelectItem value='css'>CSS</SelectItem>
                  <SelectItem value='device'>Dispositivo</SelectItem>
                </SelectContent>
              </Select>
              <p className='text-xs text-muted-foreground'>Se inyecta como RUNLAB_SCREENSHOT_SCALE en la corrida.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Validación y guardado</CardTitle>
          <CardDescription>
            Valida la configuración del proyecto antes de guardar o aplica los cambios.
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-2'>
            {settings.validation && (
              <Badge variant={settings.validation.valid ? 'default' : 'destructive'}>
                {settings.validation.valid ? 'Válida' : settings.validation.reason || 'Inválida'}
              </Badge>
            )}
          </div>
          <div className='flex flex-wrap gap-2'>
            <Button type='button' variant='outline' onClick={() => void onValidate()} disabled={settings.validating}>
              <ShieldCheck className='size-4' /> {settings.validating ? 'Validando…' : 'Validar'}
            </Button>
            <Button onClick={() => void settings.save(form)} disabled={settings.saving}>
              <Save className='size-4' /> {settings.saving ? 'Guardando…' : 'Guardar configuración'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function PathField({
  id,
  label,
  value,
  onChange,
  onBrowse,
  browsing,
  placeholder,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  onBrowse: () => void
  browsing: boolean
  placeholder?: string
}) {
  return (
    <div className='grid gap-2 md:grid-cols-[1fr_auto] md:items-end'>
      <div className='space-y-1.5'>
        <Label htmlFor={id}>{label}</Label>
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      </div>
      <Button type='button' variant='outline' onClick={onBrowse} disabled={browsing}>
        <FolderOpen className='size-4' /> Explorar
      </Button>
    </div>
  )
}
