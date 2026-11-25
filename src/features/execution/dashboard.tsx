import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { LayoutDashboard, Workflow } from 'lucide-react'
import { m, useReducedMotion } from 'motion/react'
import { useProfileStore } from '@/stores/profileStore'
import { featuresApi } from '@/lib/api'
import { fadeUp, staggerContainer } from '@/lib/motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { HeaderTools } from '@/components/layout/header-tools'
import { Main } from '@/components/layout/main'
import { ProfileHeaderBadge } from '@/components/profile-header-badge'
import { ExecutionConsole } from './components/execution-console'
import { LastRunCard } from './components/last-run-card'
import { ProjectContextCard } from './components/project-context-card'
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
      profileId={activeProfileId}
      profileName={activeProfile?.name}
    />
  )
}

function ExecutionDashboardView({
  profileId,
  profileName,
}: {
  profileId: string | null
  profileName?: string
}) {
  const execution = useExecution()
  const featuresQuery = useQuery({
    queryKey: ['features', profileId],
    queryFn: () => featuresApi.get(),
    staleTime: 60_000,
    retry: false,
  })
  const reportsEnabled = featuresQuery.data?.reports !== false
  const featuresError =
    featuresQuery.error instanceof Error ? featuresQuery.error.message : null
  const reducedMotion = useReducedMotion()
  const itemVariants = reducedMotion ? undefined : fadeUp

  return (
    <>
      <Header fixed>
        <div className='flex flex-1 items-center justify-between gap-3'>
          <div className='flex items-center gap-2'>
            <LayoutDashboard className='size-5 text-muted-foreground' />
            <div>
              <h1 className='text-xl font-semibold tracking-tight'>
                Dashboard
              </h1>
              <p className='text-sm text-muted-foreground'>
                Consola de ejecución en vivo
              </p>
            </div>
          </div>
          <div className='ms-auto flex items-center gap-2'>
            <ProfileHeaderBadge profileName={profileName} />
            {execution.running && <Badge>En ejecución</Badge>}
            <HeaderTools />
          </div>
        </div>
      </Header>
      <Main>
        <m.div
          className='space-y-4'
          variants={reducedMotion ? undefined : staggerContainer}
          initial={reducedMotion ? false : 'hidden'}
          animate={reducedMotion ? false : 'show'}
        >
          <m.div
            variants={itemVariants}
            className='flex flex-col gap-3 rounded-lg border border-dashed bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between'
          >
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Workflow className='size-4 text-primary' />
              <span>
                Consulta la guía visual de cómo funciona la ejecución en tiempo
                real.
              </span>
            </div>
            <Button variant='outline' size='sm' asChild>
              <Link to='/live-flow'>Ver flujo en vivo</Link>
            </Button>
          </m.div>
          <m.div variants={itemVariants}>
            <ProjectContextCard
              profileId={profileId}
              lastRunOptions={execution.lastRunOptions}
              compact
            />
          </m.div>
          <m.div variants={itemVariants}>
            <LastRunCard
              reportId={execution.reportId}
              timestamp={execution.reportTimestamp}
              summary={execution.summary}
              progress={execution.progress}
              status={execution.lastRunStatus}
              reportsEnabled={reportsEnabled}
              featuresError={featuresError}
              profileName={profileName}
            />
          </m.div>
          <m.div variants={itemVariants}>
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
          </m.div>
          <m.div variants={itemVariants}>
            <ResultsTable
              results={execution.results}
              reportId={execution.reportId}
              loading={execution.loading}
              error={execution.error}
              onRetry={execution.refresh}
            />
          </m.div>
        </m.div>
      </Main>
    </>
  )
}
