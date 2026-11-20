import { useState } from 'react'
import { FolderOpen, FileSearch, RefreshCw, Save, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type { Config } from '@/types/contract'
import type { UseConfigSettingsReturn } from '../use-config-settings'

type Props = {
  settings: UseConfigSettingsReturn
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
            Configura las rutas del proyecto de pruebas, archivos de entorno y fuentes de datos.
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
                placeholder='npx playwright test'
              />
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
