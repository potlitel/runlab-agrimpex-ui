import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bot, FlaskConical, FolderKanban, FolderOpen, PlugZap, RefreshCw, Sparkles } from 'lucide-react'
import { configApi } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { HeaderTools } from '@/components/layout/header-tools'
import { Main } from '@/components/layout/main'
import { ProfileHeaderBadge } from '@/components/profile-header-badge'
import { useProfileStore } from '@/stores/profileStore'
import { TestExplorer } from './components/test-explorer'
import { TestFileDialog } from './components/test-file-dialog'
import { RunControls } from './components/run-controls'
import { ExecutionConsole } from './components/execution-console'
import { ResultsTable } from './components/results-table'
import { useExecution } from './use-execution'

export function TestsPage() {
  const activeProfileId = useProfileStore((s) => s.activeProfileId)
  const activeProfile = useProfileStore((s) =>
    s.profiles.find((profile) => profile.id === activeProfileId)
  )

  return (
    <TestsPageView
      key={activeProfileId ?? 'none'}
      profileId={activeProfileId}
      profileName={activeProfile?.name}
    />
  )
}

function TestsPageView({
  profileId,
  profileName,
}: {
  profileId: string | null
  profileName?: string
}) {
  const execution = useExecution()
  const [fileToView, setFileToView] = useState<string | null>(null)
  const configQuery = useQuery({
    queryKey: ['config', profileId],
    queryFn: () => configApi.get(),
    enabled: !!profileId,
    retry: false,
  })

  const config = configQuery.data
  const projectPath = config?.projectPath?.trim() || ''
  const playwrightCmd = config?.playwrightCmd?.trim() || config?.pytestCmd?.trim() || ''
  const configured = !!projectPath
  const mcpDetected = !!config?.projectFeatures?.mcp?.detected
  const mcpSignals = config?.projectFeatures?.mcp?.signals ?? []

  return (
    <>
      <Header fixed>
        <div className='flex flex-1 items-center justify-between gap-3'>
          <div className='flex items-center gap-2'>
            <FlaskConical className='size-5 text-muted-foreground' />
            <div>
              <h1 className='text-xl font-semibold tracking-tight'>Tests</h1>
              <p className='text-sm text-muted-foreground'>
                Explorador de specs y configuración de corrida
              </p>
            </div>
          </div>
          <div className='ms-auto flex flex-wrap items-center gap-2'>
            <ProfileHeaderBadge profileName={profileName} />
            {execution.running && <Badge>En ejecución</Badge>}
            <HeaderTools />
          </div>
        </div>
      </Header>
      <Main>
        <Card className='mb-4 border-primary/20 bg-primary/5'>
          <CardContent className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex min-w-0 items-start gap-3'>
              <div className='mt-0.5 rounded-md border bg-background p-2 text-primary'>
                <FolderKanban className='size-4' />
              </div>
              <div className='min-w-0 space-y-1'>
                <div className='flex flex-wrap items-center gap-2'>
                  <p className='font-medium'>Proyecto de pruebas</p>
                  <Badge variant={configured ? 'default' : 'destructive'}>
                    {configured ? 'Configurado' : 'Sin configurar'}
                  </Badge>
                  {mcpDetected && (
                    <div
                      className='group relative inline-flex items-center gap-1.5 overflow-hidden rounded-full border border-cyan-400/40 bg-gradient-to-r from-cyan-500/15 via-violet-500/15 to-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-foreground shadow-[0_0_0_1px_rgba(34,211,238,0.08),0_8px_24px_-12px_rgba(56,189,248,0.65)]'
                      title={
                        mcpSignals.length
                          ? `Playwright MCP detectado (${mcpSignals.join(', ')})`
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
                  )}
                </div>
                {mcpDetected && (
                  <div className='flex flex-wrap items-center gap-2 text-xs'>
                    <span className='inline-flex items-center gap-1 rounded-md border border-cyan-500/20 bg-cyan-500/5 px-2 py-0.5 text-cyan-700 dark:text-cyan-300'>
                      <Sparkles className='size-3' />
                      Proyecto listo para flujos con Playwright MCP
                    </span>
                    {mcpSignals.length > 0 && (
                      <span className='truncate text-muted-foreground' title={mcpSignals.join(', ')}>
                        Señales: <span className='font-mono'>{mcpSignals.slice(0, 2).join(', ')}{mcpSignals.length > 2 ? ` +${mcpSignals.length - 2}` : ''}</span>
                      </span>
                    )}
                  </div>
                )}
                <p className='truncate font-mono text-xs text-muted-foreground' title={projectPath || undefined}>
                  {configured ? projectPath : 'Configura la ruta del proyecto para habilitar la ejecución y la exploración de archivos.'}
                </p>
                <div className='flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground'>
                  <span>
                    Comando: <span className='font-mono'>{playwrightCmd || '—'}</span>
                  </span>
                  <span>
                    Catálogo: <span className='tabular-nums'>{execution.tree?.total ?? 0}</span> tests
                  </span>
                  {execution.tree?.projects?.length ? (
                    <span>
                      Projects: <span className='font-mono'>{execution.tree.projects.join(', ')}</span>
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className='flex shrink-0 items-center gap-2'>
              <Button
                size='sm'
                variant='outline'
                onClick={() => {
                  const filesFromSelection = Array.from(
                    new Set(
                      execution.selected
                        .map((id) => id.split('::')[0])
                        .filter(Boolean)
                    )
                  )
                  setFileToView(filesFromSelection.length === 1 ? filesFromSelection[0] : '')
                }}
                disabled={!configured}
                title={
                  configured
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

        <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]'>
          <TestExplorer
            tree={execution.tree}
            loading={execution.loading}
            error={execution.error}
            selected={execution.selected}
            onToggleTest={execution.toggleTest}
            onToggleFile={execution.toggleFile}
            onClear={execution.clearSelection}
            onRefresh={execution.refresh}
            projectConfigured={configured}
          />
          <RunControls
            tree={execution.tree}
            selected={execution.selected}
            running={execution.running}
            runPending={execution.runPending}
            abortPending={execution.abortPending}
            onRun={execution.run}
            onAbort={execution.abort}
            parseParams={execution.parseParams}
          />
        </div>
        <div className='mt-4 space-y-4'>
          <ExecutionConsole
            logs={execution.logs}
            progress={execution.progress}
            running={execution.running}
            summary={execution.summary}
          />
          <ResultsTable results={execution.results} />
        </div>
      </Main>
      <TestFileDialog
        file={fileToView}
        onOpenChange={(open) => {
          if (!open) setFileToView(null)
        }}
      />
      {mcpDetected && (
        <style>{`
          @keyframes mcp-shine {
            0% { transform: translateX(-120%); }
            60% { transform: translateX(120%); }
            100% { transform: translateX(120%); }
          }
        `}</style>
      )}
    </>
  )
}
