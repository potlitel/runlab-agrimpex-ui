import { Link } from '@tanstack/react-router'
import {
  Bot,
  FolderKanban,
  FolderOpen,
  PlugZap,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Config, TestTree } from '@/types/contract'
import type { LastRunOptions } from '../use-execution'
import { contextFrom, useProjectConfig } from './project-context'

const MCP_STYLE = `
  @keyframes mcp-shine {
    0% { transform: translateX(-120%); }
    60% { transform: translateX(120%); }
    100% { transform: translateX(120%); }
  }
`

function mcpBadge(config: Config | undefined) {
  if (!config?.projectFeatures?.mcp?.detected) return null
  const signals = config.projectFeatures.mcp.signals ?? []
  return (
    <>
      <div
        className='group relative inline-flex items-center gap-1.5 overflow-hidden rounded-full border border-cyan-400/40 bg-gradient-to-r from-cyan-500/15 via-violet-500/15 to-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-foreground shadow-[0_0_0_1px_rgba(34,211,238,0.08),0_8px_24px_-12px_rgba(56,189,248,0.65)]'
        title={
          signals.length
            ? `Playwright MCP detectado (${signals.join(', ')})`
            : 'Playwright MCP detectado en el proyecto'
        }
      >
        <span className='pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.35),transparent)] opacity-70 [transform:translateX(-120%)] animate-[mcp-shine_2.8s_ease-in-out_infinite]' />
        <span className='pointer-events-none absolute -inset-px rounded-full bg-gradient-to-r from-cyan-400/30 via-fuchsia-400/20 to-emerald-400/30 blur-[2px]' />
        <span className='relative inline-flex items-center gap-1.5'>
          <span className='relative flex size-5 items-center justify-center rounded-full bg-background/70 ring-1 ring-cyan-400/40'>
            <PlugZap className='size-3.5 text-cyan-500' />
            <Sparkles className='absolute -right-1 -top-1 size-2.5 animate-pulse text-fuchsia-500' />
          </span>
          <Bot className='size-3.5 text-violet-500' />
          <span className='bg-gradient-to-r from-cyan-600 via-violet-600 to-emerald-600 bg-clip-text text-transparent dark:from-cyan-300 dark:via-violet-300 dark:to-emerald-300'>
            MCP integrado
          </span>
          <span className='inline-flex h-2 w-2 animate-ping rounded-full bg-emerald-500/80' />
        </span>
      </div>
      {signals.length > 0 && (
        <span className='truncate text-muted-foreground' title={signals.join(', ')}>
          Señales: <span className='font-mono'>{signals.slice(0, 2).join(', ')}{signals.length > 2 ? ` +${signals.length - 2}` : ''}</span>
        </span>
      )}
    </>
  )
}

export type ProjectContextCardProps = {
  profileId: string | null
  /** Opciones guardadas al lanzar la corrida; en /tests se omiten. */
  lastRunOptions?: LastRunOptions | null
  tree?: TestTree
  compact?: boolean
  selectedFiles?: string[]
  onViewFile?: () => void
}

export function ProjectContextCard({
  profileId,
  lastRunOptions = null,
  tree,
  compact = false,
  selectedFiles = [],
  onViewFile,
}: ProjectContextCardProps) {
  const configQuery = useProjectConfig(profileId)
  const config = configQuery.data
  const context = contextFrom(config, lastRunOptions)

  if (compact) {
    return (
      <>
        <Card className='mb-4'>
          <CardContent className='space-y-2 p-4 text-sm'>
            <div className='flex flex-wrap items-center gap-2'>
              <FolderKanban className='size-4 text-primary' />
              <span className='font-medium'>Contexto de ejecución</span>
              {context.configured ? (
                <Badge variant='secondary'>Proyecto configurado</Badge>
              ) : (
                <Badge variant='destructive'>Proyecto sin configurar</Badge>
              )}
              {context.mcpDetected && (
                <Badge variant='outline' title={context.mcpSignals.join(', ') || undefined}>
                  <PlugZap className='me-1 size-3' /> MCP detectado
                </Badge>
              )}
            </div>
            {configQuery.isError ? (
              <div className='flex flex-wrap items-center gap-2 text-xs text-destructive'>
                <span>{configQuery.error?.message ?? 'No se pudo consultar la configuración del proyecto.'}</span>
                <Button
                  variant='link'
                  size='sm'
                  className='h-auto p-0'
                  onClick={() => void configQuery.refetch()}
                  disabled={configQuery.isFetching}
                >
                  Reintentar
                </Button>
                <Button variant='link' size='sm' className='h-auto p-0' asChild>
                  <Link to='/settings'>Ir a Ajustes</Link>
                </Button>
              </div>
            ) : (
              <dl className='grid grid-cols-1 gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2'>
                <div>
                  <dt className='inline'>Proyecto: </dt>
                  <dd className='inline font-mono text-foreground'>
                    {context.projectPath || 'No disponible'}
                  </dd>
                </div>
                <div>
                  <dt className='inline'>Entorno: </dt>
                  <dd className='inline font-mono text-foreground'>
                    {context.environment ?? 'No registrado en esta corrida'}
                  </dd>
                </div>
                <div>
                  <dt className='inline'>Docker: </dt>
                  <dd className='inline text-foreground'>
                    {context.useDocker === undefined
                      ? 'No registrado'
                      : context.useDocker ? 'Sí' : 'No'}
                  </dd>
                </div>
                <div>
                  <dt className='inline'>Workers: </dt>
                  <dd className='inline font-mono text-foreground tabular-nums'>
                    {context.workers ?? 'No registrado'}
                  </dd>
                </div>
                <div>
                  <dt className='inline'>Grep: </dt>
                  <dd className='inline font-mono text-foreground'>
                    {context.grep || 'No registrado'}
                  </dd>
                </div>
                <div>
                  <dt className='inline'>Comando: </dt>
                  <dd className='inline font-mono text-foreground'>
                    {context.command || '—'}
                  </dd>
                </div>
                {context.paramsCount !== undefined && (
                  <div>
                    <dt className='inline'>Parámetros: </dt>
                    <dd className='inline text-foreground tabular-nums'>{context.paramsCount}</dd>
                  </div>
                )}
              </dl>
            )}
            {!context.configured && !configQuery.isError && (
              <p className='text-xs text-muted-foreground'>
                Configura el proyecto en{' '}
                <Link to='/settings' className='underline'>
                  Ajustes
                </Link>
                .
              </p>
            )}
            <div className='flex flex-wrap items-center justify-between gap-2 border-t pt-2'>
              <span className='text-xs text-muted-foreground'>
                Las corridas se inician desde Tests.
              </span>
              <Button variant='outline' size='sm' asChild>
                <Link to='/tests'>Ir a Tests</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        {context.mcpDetected && <style>{MCP_STYLE}</style>}
      </>
    )
  }

  return (
    <>
      <Card className='mb-4 border-primary/20 bg-primary/5'>
        <CardContent className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex min-w-0 items-start gap-3'>
            <div className='mt-0.5 rounded-md border bg-background p-2 text-primary'>
              <FolderKanban className='size-4' />
            </div>
            <div className='min-w-0 space-y-1'>
              <div className='flex flex-wrap items-center gap-2'>
                <p className='font-medium'>Proyecto de pruebas</p>
                <Badge variant={context.configured ? 'default' : 'destructive'}>
                  {context.configured ? 'Configurado' : 'Sin configurar'}
                </Badge>
                {context.mcpDetected && mcpBadge(config)}
              </div>
              {context.mcpDetected && (
                <div className='flex flex-wrap items-center gap-2 text-xs'>
                  <span className='inline-flex items-center gap-1 rounded-md border border-cyan-500/20 bg-cyan-500/5 px-2 py-0.5 text-cyan-700 dark:text-cyan-300'>
                    <Sparkles className='size-3' />
                    Proyecto listo para flujos con Playwright MCP
                  </span>
                  {context.mcpSignals.length > 0 && (
                    <span className='truncate text-muted-foreground' title={context.mcpSignals.join(', ')}>
                      Señales: <span className='font-mono'>{context.mcpSignals.slice(0, 2).join(', ')}{context.mcpSignals.length > 2 ? ` +${context.mcpSignals.length - 2}` : ''}</span>
                    </span>
                  )}
                </div>
              )}
              <p className='truncate font-mono text-xs text-muted-foreground' title={context.projectPath || undefined}>
                {context.configured
                  ? context.projectPath
                  : 'Configura la ruta del proyecto para habilitar la ejecución y la exploración de archivos.'}
              </p>
              <div className='flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground'>
                <span>
                  Comando: <span className='font-mono'>{context.command || '—'}</span>
                </span>
                <span>
                  Catálogo: <span className='tabular-nums'>{tree?.total ?? 0}</span> tests
                </span>
                {tree?.projects?.length ? (
                  <span>
                    Projects: <span className='font-mono'>{tree.projects.join(', ')}</span>
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className='flex shrink-0 items-center gap-2'>
            <Button
              size='sm'
              variant='outline'
              onClick={onViewFile}
              disabled={!context.configured}
              title={
                context.configured
                  ? 'Abrir y visualizar cualquier archivo del proyecto. Si hay tests seleccionados de un único archivo, se abre automáticamente.'
                  : 'Configura el proyecto para visualizar archivos'
              }
            >
              <FolderOpen className='size-4' />
              Ver archivo
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => void configQuery.refetch()}
              disabled={configQuery.isFetching}
              title='Refrescar configuración del proyecto'
            >
              <RefreshCw className={configQuery.isFetching ? 'size-4 animate-spin' : 'size-4'} />
              Refrescar config
            </Button>
          </div>
        </CardContent>
      </Card>
      {context.mcpDetected && <style>{MCP_STYLE}</style>}
      {selectedFiles.length > 0 && (
        <span className='sr-only'>Archivos seleccionados: {selectedFiles.join(', ')}</span>
      )}
    </>
  )
}
