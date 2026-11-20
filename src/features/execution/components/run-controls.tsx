import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Play, Square } from 'lucide-react'
import { envApi, profilesApi } from '@/lib/api'
import { useProfileStore } from '@/stores/profileStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { RunOptions } from '../use-execution'
import type { TestTree } from '@/types/contract'

type RunControlsProps = {
  tree?: TestTree
  selected: string[]
  running: boolean
  runPending: boolean
  abortPending: boolean
  onRun: (options: RunOptions) => void
  onAbort: () => void
  parseParams: (text: string) => Record<string, string>
}

type EnvSource = 'none' | 'file' | 'saved'

export function RunControls({
  tree,
  selected,
  running,
  runPending,
  abortPending,
  onRun,
  onAbort,
  parseParams,
}: RunControlsProps) {
  const activeProfileId = useProfileStore((s) => s.activeProfileId)
  const [project, setProject] = useState<string | null>(null)
  const [grep, setGrep] = useState('')
  const [workers, setWorkers] = useState('')
  const [envSource, setEnvSource] = useState<EnvSource>('none')
  const [envFile, setEnvFile] = useState('')
  const [profileName, setProfileName] = useState('')
  const [useDocker, setUseDocker] = useState(false)
  const [paramsText, setParamsText] = useState('')

  const filesQuery = useQuery({
    queryKey: ['env', activeProfileId, 'files'],
    queryFn: () => envApi.files(),
    enabled: !!activeProfileId,
    staleTime: 30_000,
    retry: false,
  })
  const savedQuery = useQuery({
    queryKey: ['env', activeProfileId, 'saved'],
    queryFn: () => profilesApi.list(),
    enabled: !!activeProfileId,
    staleTime: 30_000,
    retry: false,
  })

  const envFiles = filesQuery.data?.files ?? []
  const savedNames = Object.keys(savedQuery.data ?? {})
  const resolvedEnvFile =
    envSource === 'file'
      ? envFile && envFiles.includes(envFile)
        ? envFile
        : (envFiles[0] ?? '')
      : ''
  const resolvedProfileName =
    envSource === 'saved'
      ? profileName && savedNames.includes(profileName)
        ? profileName
        : (savedNames[0] ?? '')
      : ''

  const projectValue =
    project ?? (tree?.projects.length === 1 ? tree.projects[0] : '')

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const params = parseParams(paramsText)
    onRun({
      testIds: selected,
      project: projectValue || undefined,
      grep: grep.trim() || undefined,
      workers: workers.trim() || undefined,
      profileName: resolvedProfileName || undefined,
      envFile: resolvedEnvFile || undefined,
      useDocker,
      params: Object.keys(params).length ? params : undefined,
    })
  }

  return (
    <Card className='h-fit'>
      <CardHeader className='border-b pb-4'>
        <CardTitle>Configuración de corrida</CardTitle>
        <p className='mt-1 text-sm text-muted-foreground'>
          Parámetros de la ejecución para el perfil activo
        </p>
      </CardHeader>
      <CardContent>
        <form className='space-y-4' onSubmit={handleSubmit}>
          <div className='grid gap-3 sm:grid-cols-2'>
            <div className='space-y-1.5'>
              <Label htmlFor='run-project'>Proyecto</Label>
              <Select
                value={projectValue || '__all__'}
                onValueChange={(value) =>
                  setProject(value === '__all__' ? null : value)
                }
              >
                <SelectTrigger id='run-project' className='w-full'>
                  <SelectValue placeholder='Todos los proyectos' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='__all__'>Todos los proyectos</SelectItem>
                  {(tree?.projects ?? []).map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='run-workers'>Workers</Label>
              <Input
                id='run-workers'
                value={workers}
                onChange={(event) => setWorkers(event.target.value)}
                placeholder='Auto'
                inputMode='numeric'
              />
            </div>
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='run-grep'>Filtro grep</Label>
            <Input
              id='run-grep'
              value={grep}
              onChange={(event) => setGrep(event.target.value)}
              placeholder='Ej. @smoke'
              className='font-mono'
            />
          </div>

          <div className='space-y-3 rounded-md border p-3'>
            <div className='space-y-1.5'>
              <Label htmlFor='run-env-source'>Fuente de variables</Label>
              <Select
                value={envSource}
                onValueChange={(value) => setEnvSource(value as EnvSource)}
              >
                <SelectTrigger id='run-env-source' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>Por defecto del proyecto</SelectItem>
                  <SelectItem value='file'>Archivo .env del proyecto</SelectItem>
                  <SelectItem value='saved'>Entorno guardado del perfil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {envSource === 'file' && (
              <div className='space-y-1.5'>
                <Label htmlFor='run-env-file'>Archivo .env</Label>
                {envFiles.length > 0 ? (
                  <Select
                    value={resolvedEnvFile || undefined}
                    onValueChange={setEnvFile}
                  >
                    <SelectTrigger id='run-env-file' className='w-full'>
                      <SelectValue placeholder='Selecciona un archivo' />
                    </SelectTrigger>
                    <SelectContent>
                      {envFiles.map((file) => (
                        <SelectItem key={file} value={file}>
                          {file}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className='text-xs text-muted-foreground'>
                    No se encontraron archivos .env en el proyecto.
                  </p>
                )}
              </div>
            )}

            {envSource === 'saved' && (
              <div className='space-y-1.5'>
                <Label htmlFor='run-profile-name'>Entorno guardado</Label>
                {savedNames.length > 0 ? (
                  <Select
                    value={resolvedProfileName || undefined}
                    onValueChange={setProfileName}
                  >
                    <SelectTrigger id='run-profile-name' className='w-full'>
                      <SelectValue placeholder='Selecciona un entorno' />
                    </SelectTrigger>
                    <SelectContent>
                      {savedNames.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className='text-xs text-muted-foreground'>
                    No hay entornos guardados para este perfil.
                  </p>
                )}
              </div>
            )}

            <p className='text-xs text-muted-foreground'>
              El entorno guardado tiene prioridad sobre el archivo .env si ambos
              aplican. Los parámetros definidos abajo se combinan al ejecutar.
            </p>
          </div>

          <div className='flex items-center justify-between rounded-md border px-3 py-2'>
            <div>
              <Label htmlFor='run-docker'>Usar Docker</Label>
              <p className='text-xs text-muted-foreground'>
                Levanta Selenium Grid antes de ejecutar
              </p>
            </div>
            <Switch
              id='run-docker'
              checked={useDocker}
              onCheckedChange={setUseDocker}
            />
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='run-params'>Variables (KEY=VALUE)</Label>
            <Textarea
              id='run-params'
              value={paramsText}
              onChange={(event) => setParamsText(event.target.value)}
              placeholder={'API_URL=https://…\nUSER=qa'}
              className='min-h-20 font-mono text-xs'
            />
            <p className='text-xs text-muted-foreground'>
              Una variable por línea; se envían como `params`.
            </p>
          </div>

          <Separator />

          <div className='flex items-center gap-2'>
            <Button type='submit' disabled={selected.length === 0 || running}>
              <Play className='size-4' />
              {runPending ? 'Iniciando…' : `Ejecutar ${selected.length || ''} test${selected.length === 1 ? '' : 's'}`}
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={onAbort}
              disabled={!running || abortPending}
            >
              <Square className='size-4' />
              Abortar
            </Button>
          </div>
          {selected.length === 0 && (
            <p className='text-xs text-muted-foreground'>
              Selecciona al menos un test en el catálogo.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
