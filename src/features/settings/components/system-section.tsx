import { useState } from 'react'
import { Download, Eraser, RefreshCw, ShieldAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { useSystemSettings } from '../use-system-settings'

type Props = {
  settings: ReturnType<typeof useSystemSettings>
}

export function SystemSection({ settings }: Props) {
  const [token, setToken] = useState('')
  const updates = settings.updates
  const enabled = updates?.enabled === true
  const repos = updates?.repos ?? []

  async function onUpdate() {
    try {
      await settings.update(token)
      setToken('')
    } catch {
      // toast manejado en hook
    }
  }

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <CardTitle>Actualizaciones del sistema</CardTitle>
              <CardDescription>
                Estado de repositorios y ejecución de actualización remota.
              </CardDescription>
            </div>
            <Button variant='outline' size='sm' onClick={settings.refetch} disabled={settings.loading}>
              <RefreshCw className={settings.loading ? 'size-4 animate-spin' : 'size-4'} /> Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          {settings.error ? (
            <p className='text-sm text-destructive'>{settings.error}</p>
          ) : settings.loading ? (
            <p className='text-sm text-muted-foreground'>Consultando estado…</p>
          ) : (
            <>
              <div className='flex items-center gap-2'>
                <Badge variant={enabled ? 'default' : 'secondary'}>
                  {enabled ? 'Actualización remota habilitada' : 'Actualización remota deshabilitada'}
                </Badge>
              </div>

              {repos.length > 0 && (
                <div className='space-y-2'>
                  {repos.map((repo, idx) => (
                    <div key={String(repo.key ?? idx)} className='rounded-md border p-3 text-sm'>
                      <div className='flex items-center justify-between gap-2'>
                        <span className='font-medium'>{String(repo.key ?? `Repositorio ${idx + 1}`)}</span>
                        {'updated' in repo && (
                          <Badge variant={repo.updated ? 'default' : 'outline'}>
                            {repo.updated ? 'Actualizado' : 'Sin cambios / pendiente'}
                          </Badge>
                        )}
                      </div>
                      <pre className='mt-2 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground'>
                        {JSON.stringify(repo, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}

              <div className='space-y-3 rounded-md border p-4'>
                <div className='flex items-start gap-2'>
                  <ShieldAlert className='mt-0.5 size-4 text-muted-foreground' />
                  <p className='text-sm text-muted-foreground'>
                    La actualización ejecuta operaciones en el servidor. Requiere el token configurado en el backend
                    (<code>UPDATE_TOKEN</code>) y no se almacena en el cliente.
                  </p>
                </div>
                <div className='grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end'>
                  <div className='space-y-1.5'>
                    <Label htmlFor='update-token'>Token de actualización</Label>
                    <Input
                      id='update-token'
                      type='password'
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder='Ingresa el token'
                      autoComplete='off'
                    />
                  </div>
                  <Button onClick={() => void onUpdate()} disabled={settings.updating || !token.trim()}>
                    <Download className='size-4' /> {settings.updating ? 'Actualizando…' : 'Ejecutar actualización'}
                  </Button>
                </div>
                {!enabled && (
                  <p className='text-xs text-muted-foreground'>
                    El backend reporta la función como deshabilitada; la solicitud puede ser rechazada si no hay token configurado.
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='border-b pb-4'>
          <div className='flex items-center justify-between gap-2'>
            <CardTitle>Eventos del sistema</CardTitle>
            <Button size='sm' variant='outline' onClick={settings.clearLogs} disabled={settings.logs.length === 0}>
              <Eraser className='size-4' /> Limpiar
            </Button>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          <ScrollArea className='h-56'>
            <div className='space-y-1 p-4 font-mono text-xs'>
              {settings.logs.length === 0 ? (
                <p className='font-sans text-sm text-muted-foreground'>Sin eventos recibidos.</p>
              ) : (
                settings.logs.map((log) => (
                  <div key={log.id} className={log.type === 'error' ? 'text-destructive' : log.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                    <span className='me-2 text-muted-foreground'>{new Date(log.at).toLocaleTimeString()}</span>
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
