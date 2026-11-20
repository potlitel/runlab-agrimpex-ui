import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { useProfileStore } from '@/stores/profileStore'
import { TestExplorer } from './components/test-explorer'
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
      profileName={activeProfile?.name}
    />
  )
}

function TestsPageView({ profileName }: { profileName?: string }) {
  const execution = useExecution()

  return (
    <>
      <Header>
        <div className='flex flex-1 items-center justify-between gap-3'>
          <div>
            <h1 className='text-xl font-semibold tracking-tight'>Tests</h1>
            <p className='text-sm text-muted-foreground'>
              Explorador de specs y configuración de corrida
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Badge variant='secondary'>
              {profileName ?? 'Sin perfil activo'}
            </Badge>
            {execution.running && <Badge>En ejecución</Badge>}
          </div>
        </div>
      </Header>
      <Main>
        <div className='grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]'>
          <TestExplorer
            tree={execution.tree}
            loading={execution.loading}
            error={execution.error}
            running={execution.running}
            selected={execution.selected}
            onToggleTest={execution.toggleTest}
            onToggleFile={execution.toggleFile}
            onClear={execution.clearSelection}
            onRefresh={execution.refresh}
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
    </>
  )
}
