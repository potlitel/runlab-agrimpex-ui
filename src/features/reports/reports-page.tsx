import { RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { useProfileStore } from '@/stores/profileStore'
import { AnalyticsOverview } from './components/analytics-overview'
import { ReportDetailSheet } from './components/report-detail-sheet'
import { ReportsList } from './components/reports-list'
import { useReports } from './use-reports'

export function ReportsPage() {
  const activeProfileId = useProfileStore((s) => s.activeProfileId)
  const activeProfile = useProfileStore((s) =>
    s.profiles.find((profile) => profile.id === activeProfileId)
  )

  return (
    <ReportsPageView
      key={activeProfileId ?? 'none'}
      profileName={activeProfile?.name}
    />
  )
}

function ReportsPageView({ profileName }: { profileName?: string }) {
  const reports = useReports()
  const selectedReport =
    reports.selectedId != null
      ? reports.reports.find((report) => report.id === reports.selectedId) ?? null
      : null

  return (
    <>
      <Header>
        <div className='flex flex-1 items-center justify-between gap-3'>
          <div>
            <h1 className='text-xl font-semibold tracking-tight'>Reportes</h1>
            <p className='text-sm text-muted-foreground'>
              Historial, analítica y detalle de ejecuciones
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Badge variant='secondary'>
              {profileName ?? 'Sin perfil activo'}
            </Badge>
            <Button
              size='sm'
              variant='outline'
              onClick={reports.refresh}
              disabled={reports.listLoading || reports.analyticsLoading}
            >
              <RefreshCw
                className={
                  reports.listLoading || reports.analyticsLoading
                    ? 'size-4 animate-spin'
                    : 'size-4'
                }
              />
              Actualizar
            </Button>
          </div>
        </div>
      </Header>
      <Main>
        {reports.unavailable ? (
          <Card>
            <CardContent className='p-6 text-sm text-muted-foreground'>
              El módulo de reportes no está disponible para el perfil activo o la API
              rechazó el acceso. Verifica la configuración y los feature flags.
              {reports.featuresError && (
                <span className='mt-2 block text-destructive'>{reports.featuresError}</span>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className='space-y-4'>
            <AnalyticsOverview
              analytics={reports.analytics}
              loading={reports.analyticsLoading}
              error={reports.analyticsError}
            />
            <ReportsList
              reports={reports.reports}
              loading={reports.listLoading}
              error={reports.listError}
              deletingId={reports.deletingId}
              onSelect={reports.selectReport}
              onDelete={reports.deleteReport}
            />
          </div>
        )}
      </Main>

      <ReportDetailSheet
        open={reports.selectedId != null}
        report={selectedReport}
        detail={reports.detail}
        loading={reports.detailLoading}
        error={reports.detailError}
        deleting={reports.deletingId === reports.selectedId && reports.selectedId != null}
        onOpenChange={(open) => {
          if (!open) reports.selectReport(null)
        }}
        onDelete={reports.deleteReport}
      />
    </>
  )
}
