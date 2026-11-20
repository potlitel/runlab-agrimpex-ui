import { useState } from 'react'
import { Play, Square } from 'lucide-react'
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
  const [project, setProject] = useState<string | null>(null)
  const [grep, setGrep] = useState('')
  const [workers, setWorkers] = useState('')
  const [envFile, setEnvFile] = useState('')
  const [useDocker, setUseDocker] = useState(false)
  const [paramsText, setParamsText] = useState('')
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
      envFile: envFile.trim() || undefined,
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

          <div className='space-y-1.5'>
            <Label htmlFor='run-env-file'>Archivo .env</Label>
            <Input
              id='run-env-file'
              value={envFile}
              onChange={(event) => setEnvFile(event.target.value)}
              placeholder='Ej. .env.local'
              className='font-mono'
            />
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
