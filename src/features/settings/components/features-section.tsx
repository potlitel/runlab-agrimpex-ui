import { useState } from 'react'
import { RefreshCw, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { FeatureFlags } from '@/types/contract'
import type { useFeaturesSettings } from '../use-features-settings'

type Props = {
  settings: ReturnType<typeof useFeaturesSettings>
}

export function FeaturesSection({ settings }: Props) {
  if (settings.loading) return <p className='text-sm text-muted-foreground'>Cargando feature flags…</p>
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

  return <FeaturesForm key={JSON.stringify(settings.flags)} initial={settings.flags} settings={settings} />
}

const KNOWN_LABELS: Record<string, string> = {
  variables: 'Variables y entornos',
  docker: 'Docker',
  schedules: 'Calendarización',
  txtData: 'Datos TXT',
  jsonData: 'Datos JSON',
  reports: 'Reportes',
  errorImages: 'Imágenes de error',
  automation: 'Automatización',
}

function FeaturesForm({
  initial,
  settings,
}: {
  initial: FeatureFlags
  settings: ReturnType<typeof useFeaturesSettings>
}) {
  const [flags, setFlags] = useState<FeatureFlags>(initial)
  const keys = Object.keys(flags).sort((a, b) => {
    const ak = a in KNOWN_LABELS ? 0 : 1
    const bk = b in KNOWN_LABELS ? 0 : 1
    return ak - bk || a.localeCompare(b)
  })

  function toggle(key: string, value: boolean) {
    setFlags((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Módulos y feature flags</CardTitle>
        <CardDescription>
          Habilita o deshabilita módulos disponibles para el perfil activo.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {keys.length === 0 ? (
          <p className='text-sm text-muted-foreground'>No hay feature flags configurados.</p>
        ) : (
          <div className='grid gap-3 sm:grid-cols-2'>
            {keys.map((key) => {
              const value = !!flags[key]
              return (
                <div key={key} className='flex items-center justify-between gap-3 rounded-md border p-3'>
                  <div className='min-w-0'>
                    <Label htmlFor={`flag-${key}`} className='cursor-pointer font-medium'>
                      {KNOWN_LABELS[key] ?? key}
                    </Label>
                    {KNOWN_LABELS[key] && (
                      <p className='truncate font-mono text-xs text-muted-foreground'>{key}</p>
                    )}
                  </div>
                  <Switch id={`flag-${key}`} checked={value} onCheckedChange={(v) => toggle(key, v)} />
                </div>
              )
            })}
          </div>
        )}
        <div className='flex justify-end'>
          <Button onClick={() => void settings.save(flags)} disabled={settings.saving || keys.length === 0}>
            <Save className='size-4' /> {settings.saving ? 'Guardando…' : 'Guardar flags'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
