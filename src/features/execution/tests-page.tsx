import { useState } from 'react'
import { FlaskConical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/header'
import { HeaderTools } from '@/components/layout/header-tools'
import { Main } from '@/components/layout/main'
import { ProfileHeaderBadge } from '@/components/profile-header-badge'
import { useProfileStore } from '@/stores/profileStore'
import { TestExplorer } from './components/test-explorer'
import { TestFileDialog } from './components/test-file-dialog'
import { RunControls } from './components/run-controls'
import { ExecutionConsole } from './components/execution-console'
import { ProjectContextCard } from './components/project-context-card'
import { contextFrom, useProjectConfig } from './components/project-context'
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
  const configQuery = useProjectConfig(profileId)
  const context = contextFrom(configQuery.data, null)

  function handleViewFile() {
    const filesFromSelection = Array.from(
      new Set(
        execution.selected
          .map((id) => id.split('::')[0])
          .filter(Boolean)
      )
    )
    setFileToView(filesFromSelection.length === 1 ? filesFromSelection[0] : '')
  }

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
        <ProjectContextCard
          profileId={profileId}
          tree={execution.tree}
          onViewFile={handleViewFile}
        />
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
            projectConfigured={context.configured}
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
            summaryPartial={execution.summaryPartial}
            passRate={execution.passRate}
            loading={execution.loading}
            error={execution.error}
            onRetry={execution.refresh}
            onClear={execution.clearLogs}
          />
          <ResultsTable
            results={execution.results}
            reportId={execution.reportId}
            loading={execution.loading}
            error={execution.error}
            onRetry={execution.refresh}
          />
        </div>
      </Main>
      <TestFileDialog
        file={fileToView}
        onOpenChange={(open) => {
          if (!open) setFileToView(null)
        }}
      />
    </>
  )
}
