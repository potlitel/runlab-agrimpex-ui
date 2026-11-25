import type { ComponentType } from 'react'
import { Link } from '@tanstack/react-router'
import type { Config, TestTree } from '@/types/contract'
import {
  Bot,
  Check,
  Container,
  Filter,
  FlaskConical,
  FolderKanban,
  FolderOpen,
  Layers,
  Minus,
  PlugZap,
  RefreshCw,
  Settings,
  Sparkles,
  Terminal,
  Users,
} from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { collapse, fadeIn, fadeUp, staggerContainer } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { LastRunOptions } from '../use-execution'
import { ExecutionEmptyState } from './execution-empty-state'
import { contextFrom, useProjectConfig } from './project-context'

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
        <span className='pointer-events-none absolute inset-0 [transform:translateX(-120%)] animate-[mcp-shine_2.8s_ease-in-out_infinite] bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.35),transparent)] opacity-70' />
        <span className='pointer-events-none absolute -inset-px rounded-full bg-gradient-to-r from-cyan-400/30 via-fuchsia-400/20 to-emerald-400/30 blur-[2px]' />
        <span className='relative inline-flex items-center gap-1.5'>
          <span className='relative flex size-5 items-center justify-center rounded-full bg-background/70 ring-1 ring-cyan-400/40'>
            <PlugZap className='size-3.5 text-cyan-500' />
            <Sparkles className='absolute -top-1 -right-1 size-2.5 animate-pulse text-fuchsia-500' />
          </span>
          <Bot className='size-3.5 text-violet-500' />
          <span className='bg-gradient-to-r from-cyan-600 via-violet-600 to-emerald-600 bg-clip-text text-transparent dark:from-cyan-300 dark:via-violet-300 dark:to-emerald-300'>
            MCP integrado
          </span>
          <span className='inline-flex h-2 w-2 animate-ping rounded-full bg-emerald-500/80' />
        </span>
      </div>
      {signals.length > 0 && (
        <span
          className='truncate text-muted-foreground'
          title={signals.join(', ')}
        >
          Señales:{' '}
          <span className='font-mono'>
            {signals.slice(0, 2).join(', ')}
            {signals.length > 2 ? ` +${signals.length - 2}` : ''}
          </span>
        </span>
      )}
    </>
  )
}

function ContextValue({
  icon: Icon,
  label,
  value,
  present,
  mono = false,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string | number
  present: boolean
  mono?: boolean
}) {
  return (
    <m.div
      variants={fadeUp}
      className={cn(
        'flex min-w-0 items-center gap-2 rounded-md border px-2.5 py-2 text-xs',
        present ? 'border-emerald-500/30 bg-emerald-500/5' : 'bg-muted/20'
      )}
    >
      <Icon
        aria-hidden='true'
        className={cn(
          'size-3.5 shrink-0',
          present
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-muted-foreground'
        )}
      />
      <div className='min-w-0'>
        <span className='block text-muted-foreground'>{label}</span>
        <span
          className={cn(
            'block truncate',
            present ? 'text-foreground' : 'text-muted-foreground',
            mono && 'font-mono'
          )}
          title={String(value)}
        >
          {value}
        </span>
      </div>
      {present ? (
        <Check
          aria-hidden='true'
          className='ms-auto size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400'
        />
      ) : (
        <Minus
          aria-hidden='true'
          className='ms-auto size-3.5 shrink-0 text-muted-foreground'
        />
      )}
    </m.div>
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
                <Badge
                  variant='outline'
                  title={context.mcpSignals.join(', ') || undefined}
                >
                  <PlugZap className='me-1 size-3' /> MCP detectado
                </Badge>
              )}
            </div>
            <AnimatePresence mode='wait' initial={false}>
              {configQuery.isError ? (
                <m.div
                  key='error'
                  variants={collapse}
                  initial='hidden'
                  animate='show'
                  exit='exit'
                  className='overflow-hidden'
                >
                  <m.div
                    variants={fadeIn}
                    initial='hidden'
                    animate='show'
                    className='flex flex-wrap items-center gap-2 text-xs text-destructive'
                  >
                    <span>
                      {configQuery.error?.message ??
                        'No se pudo consultar la configuración del proyecto.'}
                    </span>
                    <Button
                      variant='link'
                      size='sm'
                      className='h-auto p-0'
                      onClick={() => void configQuery.refetch()}
                      disabled={configQuery.isFetching}
                    >
                      <RefreshCw className='size-3.5' /> Reintentar
                    </Button>
                    <Button
                      variant='link'
                      size='sm'
                      className='h-auto p-0'
                      asChild
                    >
                      <Link to='/settings'>
                        <Settings className='size-3.5' /> Ir a Ajustes
                      </Link>
                    </Button>
                  </m.div>
                </m.div>
              ) : (
                <m.div
                  key='context'
                  variants={collapse}
                  initial='hidden'
                  animate='show'
                  exit='exit'
                  className='overflow-hidden'
                >
                  <m.div
                    className='grid grid-cols-1 gap-2 sm:grid-cols-2 2xl:grid-cols-3'
                    variants={staggerContainer}
                    initial='hidden'
                    animate='show'
                  >
                    <ContextValue
                      icon={FolderOpen}
                      label='Proyecto'
                      value={context.projectPath || 'No registrado'}
                      present={context.configured}
                      mono
                    />
                    <ContextValue
                      icon={Layers}
                      label='Entorno'
                      value={
                        context.environment ?? 'No registrado en esta corrida'
                      }
                      present={!!context.environment}
                      mono
                    />
                    <ContextValue
                      icon={Container}
                      label='Docker'
                      value={
                        context.useDocker === undefined
                          ? 'No registrado'
                          : context.useDocker
                            ? 'Sí'
                            : 'No'
                      }
                      present={context.useDocker !== undefined}
                    />
                    <ContextValue
                      icon={Users}
                      label='Workers'
                      value={context.workers ?? 'No registrado'}
                      present={context.workers !== undefined}
                      mono
                    />
                    <ContextValue
                      icon={Filter}
                      label='Grep'
                      value={context.grep || 'No registrado'}
                      present={!!context.grep}
                      mono
                    />
                    <ContextValue
                      icon={Terminal}
                      label='Comando'
                      value={context.command || '—'}
                      present={!!context.command}
                      mono
                    />
                    {context.paramsCount !== undefined && (
                      <ContextValue
                        icon={Sparkles}
                        label='Parámetros'
                        value={context.paramsCount}
                        present
                      />
                    )}
                  </m.div>
                </m.div>
              )}
            </AnimatePresence>
            <AnimatePresence initial={false}>
              {!context.configured && !configQuery.isError && (
                <m.div
                  key='empty'
                  variants={collapse}
                  initial='hidden'
                  animate='show'
                  exit='exit'
                  className='overflow-hidden'
                >
                  <ExecutionEmptyState
                    icon={FolderOpen}
                    title='Proyecto sin configurar'
                    description='Configura la ruta del proyecto para habilitar la ejecución y la exploración de archivos.'
                    action={
                      <Button variant='outline' size='sm' asChild>
                        <Link to='/settings'>
                          <Settings className='size-4' /> Configurar Proyecto
                        </Link>
                      </Button>
                    }
                  />
                </m.div>
              )}
            </AnimatePresence>
            <div className='flex flex-wrap items-center justify-between gap-2 border-t pt-2'>
              <span className='text-xs text-muted-foreground'>
                Las corridas se inician desde Tests.
              </span>
              <Button variant='outline' size='sm' asChild>
                <Link to='/tests'>
                  <FlaskConical className='size-4' /> Ir a Tests
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
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
                    <span
                      className='truncate text-muted-foreground'
                      title={context.mcpSignals.join(', ')}
                    >
                      Señales:{' '}
                      <span className='font-mono'>
                        {context.mcpSignals.slice(0, 2).join(', ')}
                        {context.mcpSignals.length > 2
                          ? ` +${context.mcpSignals.length - 2}`
                          : ''}
                      </span>
                    </span>
                  )}
                </div>
              )}
              <p
                className='truncate font-mono text-xs text-muted-foreground'
                title={context.projectPath || undefined}
              >
                {context.configured
                  ? context.projectPath
                  : 'Configura la ruta del proyecto para habilitar la ejecución y la exploración de archivos.'}
              </p>
              <div className='flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground'>
                <span>
                  Comando:{' '}
                  <span className='font-mono'>{context.command || '—'}</span>
                </span>
                <span>
                  Catálogo:{' '}
                  <span className='tabular-nums'>{tree?.total ?? 0}</span> tests
                </span>
                {tree?.projects?.length ? (
                  <span>
                    Projects:{' '}
                    <span className='font-mono'>
                      {tree.projects.join(', ')}
                    </span>
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
              <RefreshCw
                className={
                  configQuery.isFetching ? 'size-4 animate-spin' : 'size-4'
                }
              />
              Refrescar config
            </Button>
          </div>
        </CardContent>
      </Card>
      {selectedFiles.length > 0 && (
        <span className='sr-only'>
          Archivos seleccionados: {selectedFiles.join(', ')}
        </span>
      )}
    </>
  )
}
