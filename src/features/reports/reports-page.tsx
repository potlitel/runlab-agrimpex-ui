import { useState } from 'react'
import { BarChart3, FileDown, RefreshCw, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { HeaderTools } from '@/components/layout/header-tools'
import { Main } from '@/components/layout/main'
import { ProfileHeaderBadge } from '@/components/profile-header-badge'
import { useProfileStore } from '@/stores/profileStore'
import { AnalyticsOverview } from './components/analytics-overview'
import { ExportPdfDialog } from './components/export-pdf-dialog'
import { ReportDetailSheet } from './components/report-detail-sheet'
import { ReportsList } from './components/reports-list'
import { ANALYTICS_PDF_SECTIONS, exportAnalyticsPdf, type AnalyticsExportSection } from './pdf/export-reports'
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
  const [exportingAnalytics, setExportingAnalytics] = useState(false)
  const [customizeAnalyticsOpen, setCustomizeAnalyticsOpen] = useState(false)

  const selectedReport =
    reports.selectedId != null
      ? reports.reports.find((report) => report.id === reports.selectedId) ?? null
      : null

  const canExportAnalytics =
    !reports.unavailable && !!reports.analytics && reports.analytics.totalRuns > 0

  const handleAnalyticsExport = async (sections?: AnalyticsExportSection[]) => {
    setExportingAnalytics(true)
    try {
      await exportAnalyticsPdf({
        profileName,
        sections,
        fallbackAnalytics: reports.analytics,
        fallbackRecentRuns: reports.reports,
      })
      toast.success('PDF analítico generado correctamente')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo generar el PDF analítico')
    } finally {
      setExportingAnalytics(false)
    }
  }

  return (
    <>
      <Header fixed>
        <div className='flex flex-1 items-center justify-between gap-3'>
          <div className='flex items-center gap-2'>
            <BarChart3 className='size-5 text-muted-foreground' />
            <div>
              <h1 className='text-xl font-semibold tracking-tight'>Reportes</h1>
              <p className='text-sm text-muted-foreground'>
                Historial, analítica y detalle de ejecuciones
              </p>
            </div>
          </div>
          <div className='ms-auto flex items-center gap-2'>
            <ProfileHeaderBadge profileName={profileName} />
            {!reports.unavailable && (
              <>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => void handleAnalyticsExport()}
                  disabled={!canExportAnalytics || exportingAnalytics}
                >
                  <FileDown className='size-4' />
                  {exportingAnalytics ? 'Generando…' : 'Exportar PDF analítico'}
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => setCustomizeAnalyticsOpen(true)}
                  disabled={!canExportAnalytics || exportingAnalytics}
                >
                  <SlidersHorizontal className='size-4' />
                  Personalizar PDF…
                </Button>
              </>
            )}
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
            <HeaderTools />
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
              profileName={profileName}
              onSelect={reports.selectReport}
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
        profileName={profileName}
        onOpenChange={(open) => {
          if (!open) reports.selectReport(null)
        }}
      />

      <ExportPdfDialog<AnalyticsExportSection>
        key={customizeAnalyticsOpen ? 'analytics-open' : 'analytics-closed'}
        open={customizeAnalyticsOpen}
        onOpenChange={setCustomizeAnalyticsOpen}
        title='Personalizar PDF analítico'
        description='Selecciona las secciones que quieres incluir en el PDF analítico integral.'
        sections={[
          { id: 'cover', label: 'Portada', description: 'Perfil, fecha y alcance.' },
          { id: 'kpis', label: 'KPIs', description: 'Corridas, tasa de éxito, únicos y duración promedio.' },
          { id: 'trend', label: 'Tendencia', description: 'Gráfico/timeline reciente.' },
          { id: 'byFile', label: 'Desglose por archivo', description: 'Tabla por archivo/módulo.' },
          { id: 'recentRuns', label: 'Corridas recientes', description: 'Tabla breve de corridas recientes.' },
          { id: 'footer', label: 'Pie', description: 'Fecha de generación y paginación.' },
        ]}
        defaultSections={[...ANALYTICS_PDF_SECTIONS]}
        onConfirm={async (sections) => {
          await handleAnalyticsExport(sections)
        }}
      />
    </>
  )
}
