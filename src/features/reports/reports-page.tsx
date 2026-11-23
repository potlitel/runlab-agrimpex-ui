import { useState } from 'react'
import {
  BarChart3,
  FileDown,
  Mail,
  MessageCircle,
  RefreshCw,
  Share2,
  SlidersHorizontal,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
import { shareAnalyticsPdf, type ShareChannel } from './pdf/share-reports'
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
  const [sharingAnalyticsChannel, setSharingAnalyticsChannel] = useState<ShareChannel | null>(null)
  const [customizeAnalyticsOpen, setCustomizeAnalyticsOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const selectedReport =
    reports.selectedId != null
      ? reports.reports.find((report) => report.id === reports.selectedId) ?? null
      : null

  const canExportAnalytics =
    !reports.unavailable && !!reports.analytics && reports.analytics.totalRuns > 0
  const analyticsBusy = exportingAnalytics || sharingAnalyticsChannel !== null

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

  const handleAnalyticsShare = async (channel: ShareChannel) => {
    setSharingAnalyticsChannel(channel)
    try {
      const result = await shareAnalyticsPdf({
        channel,
        profileName,
        fallbackAnalytics: reports.analytics,
        fallbackRecentRuns: reports.reports,
      })
      if (result.status === 'shared') {
        toast.success(channel === 'whatsapp' ? 'Reporte analítico compartido por WhatsApp' : 'Reporte analítico compartido por correo')
      } else if (result.status === 'fallback') {
        toast.info(
          channel === 'whatsapp'
            ? 'Se abrió WhatsApp con mensaje prellenado. Adjunta el PDF descargado si es necesario.'
            : 'Se abrió el correo con asunto y mensaje prellenado. Adjunta el PDF descargado.'
        )
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo compartir el PDF analítico')
    } finally {
      setSharingAnalyticsChannel(null)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await reports.refresh()
    } finally {
      setRefreshing(false)
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size='sm'
                      variant='outline'
                      disabled={!canExportAnalytics || analyticsBusy}
                      aria-label='Exportar o compartir'
                    >
                      <Share2 className='size-4' />
                      <span className='hidden sm:inline'>Exportar / Compartir</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem
                      onClick={() => void handleAnalyticsExport()}
                      disabled={!canExportAnalytics || analyticsBusy}
                    >
                      <FileDown className='size-4' />
                      {exportingAnalytics ? 'Generando PDF…' : 'Exportar PDF'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => void handleAnalyticsShare('whatsapp')}
                      disabled={!canExportAnalytics || analyticsBusy}
                    >
                      <MessageCircle className='size-4' />
                      {sharingAnalyticsChannel === 'whatsapp' ? 'Compartiendo…' : 'WhatsApp'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => void handleAnalyticsShare('email')}
                      disabled={!canExportAnalytics || analyticsBusy}
                    >
                      <Mail className='size-4' />
                      {sharingAnalyticsChannel === 'email' ? 'Compartiendo…' : 'Correo'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size='icon'
                      variant='outline'
                      onClick={() => setCustomizeAnalyticsOpen(true)}
                      disabled={!canExportAnalytics || analyticsBusy}
                      aria-label='Personalizar PDF'
                    >
                      <SlidersHorizontal className='size-4' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Personalizar PDF</TooltipContent>
                </Tooltip>
              </>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size='icon'
                  variant='outline'
                  onClick={() => void handleRefresh()}
                  disabled={refreshing || reports.listLoading || reports.analyticsLoading}
                  aria-label='Actualizar'
                >
                  <RefreshCw
                    className={
                      refreshing || reports.listLoading || reports.analyticsLoading
                        ? 'size-4 animate-spin'
                        : 'size-4'
                    }
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Actualizar</TooltipContent>
            </Tooltip>
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
