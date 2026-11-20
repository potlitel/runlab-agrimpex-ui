import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/header'
import { HeaderTools } from '@/components/layout/header-tools'
import { Main } from '@/components/layout/main'
import { useProfileStore } from '@/stores/profileStore'
import { ExecutionConsole } from './components/execution-console'
import { ResultsTable } from './components/results-table'
import { useExecution } from './use-execution'

export function ExecutionDashboard() {
  const activeProfileId = useProfileStore((s) => s.activeProfileId)
  const activeProfile = useProfileStore((s) =>
    s.profiles.find((profile) => profile.id === activeProfileId)
  )

  return (
    <ExecutionDashboardView
      key={activeProfileId ?? 'none'}
      profileName={activeProfile?.name}
    />
  )
}

function ExecutionDashboardView({ profileName }: { profileName?: string }) {
  const execution = useExecution()

  return (
    <>
      <Header>
        <div className='flex flex-1 items-center justify-between gap-3'>
          <div>
            <h1 className='text-xl font-semibold tracking-tight'>Dashboard</h1>
            <p className='text-sm text-muted-foreground'>
              Consola de ejecución en vivo
            </p>
          </div>
          <div className='ms-auto flex items-center gap-2'>
            <Badge variant='secondary'>
              {profileName ?? 'Sin perfil activo'}
            </Badge>
            {execution.running && <Badge>En ejecución</Badge>}
            <HeaderTools />
          </div>
        </div>
      </Header>
      <Main>
        <div className='space-y-4'>
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
