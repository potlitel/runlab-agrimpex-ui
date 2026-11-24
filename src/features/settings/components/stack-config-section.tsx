import { useState } from 'react'
import { KeyRound, RefreshCw, RotateCcw, Save, Server, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import type { StackConfigResponse, StackConfigSavePayload, StackSecretOperation } from '@/types/contract'
import { useStackConfigSettings } from '../use-stack-config-settings'

type Settings = ReturnType<typeof useStackConfigSettings>

const LABELS: Record<string, string> = {
  VITE_API_URL: 'URL pública de la API',
  VITE_SOCKET_URL: 'URL pública del socket',
  UI_PORT: 'Puerto de la UI',
  API_PORT: 'Puerto de la API',
  RUNLABQA_DOCKER_TRANSPORT: 'Transporte Docker',
  RUNLABQA_DATA_DIR: 'Directorio de datos',
  RUNLABQA_PROFILES_DIR: 'Directorio de perfiles',
  PLAYWRIGHT_KIT_DIR: 'Kit de Playwright',
  RUNLABQA_NOVNC_HOST: 'Host de noVNC',
  RUNLABQA_NOVNC_PORT: 'Puerto de noVNC',
  TZ: 'Zona horaria',
  RUNLABQA_AGENT_TOKEN: 'Token del agente',
  UPDATE_TOKEN: 'Token de administración del stack',
}

type SecretField = { operation: StackSecretOperation; value: string }

export function StackConfigSection() {
  const settings = useStackConfigSettings()
  const [tokenInput, setTokenInput] = useState(settings.token)

  function connect() {
    settings.setToken(tokenInput.trim())
  }

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <div className='flex items-start justify-between gap-3'>
            <div className='flex items-start gap-2'>
              <Server className='mt-0.5 size-5 text-muted-foreground' />
              <div>
                <CardTitle>Configuración del stack</CardTitle>
                <CardDescription>
                  Variables operativas del <code>.env</code> central. Los secretos nunca se envían al navegador:
                  solo se indica si están configurados.
                </CardDescription>
              </div>
            </div>
            <Button variant='outline' size='sm' onClick={settings.refetch} disabled={settings.loading}>
              <RefreshCw className={settings.loading ? 'size-4 animate-spin' : 'size-4'} /> Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end'>
            <div className='space-y-1.5'>
              <Label htmlFor='stack-admin-token'>Token de administración</Label>
              <Input
                id='stack-admin-token'
                type='password'
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder='Valor de UPDATE_TOKEN'
                autoComplete='off'
                disabled={settings.disabled}
              />
              <p className='text-xs text-muted-foreground'>
                Se guarda solo en <code>sessionStorage</code> de esta pestaña y viaja por el header <code>x-update-token</code>.
              </p>
            </div>
            <Button onClick={connect} disabled={settings.disabled || tokenInput.trim() === settings.token}>
              <KeyRound className='size-4' /> Usar token
            </Button>
          </div>
          {settings.disabled && (
            <p role='alert' className='text-sm text-destructive'>
              Administración deshabilitada: el servidor no tiene <code>UPDATE_TOKEN</code> configurado.
            </p>
          )}
          {settings.needsToken && !settings.disabled && (
            <p className='text-sm text-muted-foreground'>
              Introduce el token de administración para consultar y modificar la configuración.
            </p>
          )}
        </CardContent>
      </Card>

      {settings.disabled ? null : settings.error ? (
        <Card>
          <CardContent className='flex items-center justify-between gap-4 p-6'>
            <p className='text-sm text-destructive'>{settings.error}</p>
            <Button variant='outline' size='sm' onClick={settings.refetch}>
              <RefreshCw className='size-4' /> Reintentar
            </Button>
          </CardContent>
        </Card>
      ) : settings.loading || !settings.data ? (
        <Card><CardContent className='p-6 text-sm text-muted-foreground'>Cargando configuración del stack…</CardContent></Card>
      ) : (
        <StackConfigForm key={settings.data.configVersion} data={settings.data} settings={settings} />
      )}
    </div>
  )
}

function StackConfigForm({ data, settings }: { data: StackConfigResponse; settings: Settings }) {
  const secretKeys = Object.keys(data.secrets)
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(data.values)
        .filter(([, value]) => value !== null)
        .map(([key, value]) => [key, String(value)]),
    ),
  )
  const [secrets, setSecrets] = useState<Record<string, SecretField>>(() =>
    Object.fromEntries(secretKeys.map((key) => [key, { operation: 'keep', value: '' }])),
  )

  function setSecret(key: string, patch: Partial<SecretField>) {
    setSecrets((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }))
  }

  async function onSave() {
    const payload: StackConfigSavePayload = {
      values,
      secrets: Object.fromEntries(
        Object.entries(secrets).map(([key, field]) => [
          key,
          field.operation === 'set'
            ? { operation: 'set', value: field.value }
            : { operation: field.operation },
        ]),
      ),
    }
    await settings.save(payload)
  }

  async function onRestore() {
    if (!window.confirm('¿Restaurar la configuración anterior? Se descartará el último guardado.')) return
    await settings.restore()
  }

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between gap-3'>
            <CardTitle>Variables permitidas</CardTitle>
            <Badge variant='outline'>configVersion {data.configVersion}</Badge>
          </div>
          <CardDescription>
            Solo estas claves se escriben en el <code>.env</code> del stack; el resto del archivo se conserva tal cual.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {Object.keys(values).map((key) => (
            <div key={key} className='space-y-1.5'>
              <Label htmlFor={`stack-${key}`}>{LABELS[key] ?? key}</Label>
              <code className='block text-xs text-muted-foreground'>{key}</code>
              <Input
                id={`stack-${key}`}
                value={values[key] ?? ''}
                onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder={key.includes('URL') ? 'https://…' : undefined}
              />
            </div>
          ))}

          {secretKeys.length > 0 && <Separator />}

          {secretKeys.map((key) => {
            const configured = data.secrets[key]?.configured === true
            const field = secrets[key] ?? { operation: 'keep' as const, value: '' }
            return (
              <div key={key} className='space-y-2 rounded-md border p-3'>
                <div className='flex flex-wrap items-center gap-2'>
                  <Label htmlFor={`stack-secret-${key}`}>{LABELS[key] ?? key}</Label>
                  <Badge variant={configured ? 'secondary' : 'outline'}>
                    {configured ? 'Configurado (valor oculto)' : 'Sin configurar'}
                  </Badge>
                  <code className='text-xs text-muted-foreground'>{key}</code>
                </div>
                <div className='grid gap-2 md:grid-cols-[1fr_auto]'>
                  <Input
                    id={`stack-secret-${key}`}
                    type='password'
                    value={field.value}
                    onChange={(e) => setSecret(key, { value: e.target.value, operation: e.target.value ? 'set' : 'keep' })}
                    placeholder='Nuevo valor (vacío = conservar)'
                    autoComplete='new-password'
                  />
                  <div className='space-y-1.5'>
                    <Label htmlFor={`stack-operation-${key}`}>Operación para {key}</Label>
                    <select
                      id={`stack-operation-${key}`}
                      className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm'
                      value={field.operation}
                      onChange={(e) => setSecret(key, { operation: e.target.value as StackSecretOperation })}
                    >
                      <option value='keep'>Conservar</option>
                      <option value='set'>Reemplazar</option>
                      <option value='clear'>Limpiar</option>
                    </select>
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {data.pendingApply.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <ShieldCheck className='size-5 text-amber-600 dark:text-amber-400' /> Pendiente de aplicar
            </CardTitle>
            <CardDescription>
              Estos cambios requieren recrear contenedores. La aplicación no ejecuta el comando.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-2'>
            {data.pendingApply.map((item) => (
              <div key={item.key} className='rounded-md border p-3 text-sm'>
                <p className='font-medium'>{LABELS[item.key] ?? item.key}</p>
                <code className='mt-1 block break-all text-xs text-muted-foreground'>{item.command}</code>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className='flex flex-wrap items-center justify-between gap-3 p-6'>
          <Button variant='outline' onClick={() => void onRestore()} disabled={settings.restoring}>
            <RotateCcw className='size-4' /> {settings.restoring ? 'Restaurando…' : 'Restaurar copia anterior'}
          </Button>
          <Button onClick={() => void onSave()} disabled={settings.saving}>
            <Save className='size-4' /> {settings.saving ? 'Guardando…' : 'Guardar configuración del stack'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
