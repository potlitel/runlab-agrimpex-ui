import { useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { useProfileStore } from '@/stores/profileStore'
import type { Schedule } from '@/types/contract'
import { ScheduleActivityPanel } from './components/schedule-activity'
import { ScheduleFormDialog } from './components/schedule-form-dialog'
import { SchedulesList } from './components/schedules-list'
import { useSchedules } from './use-schedules'

export function SchedulesPage() {
  const activeProfileId = useProfileStore((s) => s.activeProfileId)
  const activeProfile = useProfileStore((s) =>
    s.profiles.find((profile) => profile.id === activeProfileId)
  )

  return (
    <SchedulesPageView
      key={activeProfileId ?? 'none'}
      profileName={activeProfile?.name}
    />
  )
}

function SchedulesPageView({ profileName }: { profileName?: string }) {
  const schedules = useSchedules()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Schedule | null>(null)

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(schedule: Schedule) {
    setEditing(schedule)
    setFormOpen(true)
  }

  return (
    <>
      <Header>
        <div className='flex flex-1 items-center justify-between gap-3'>
          <div>
            <h1 className='text-xl font-semibold tracking-tight'>Calendarización</h1>
            <p className='text-sm text-muted-foreground'>
              Programaciones automáticas de ejecuciones
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Badge variant='secondary'>{profileName ?? 'Sin perfil activo'}</Badge>
            <Button size='sm' variant='outline' onClick={schedules.refresh}>
              <RefreshCw className='size-4' /> Actualizar
            </Button>
            <Button size='sm' onClick={openCreate} disabled={schedules.unavailable}>
              <Plus className='size-4' /> Nueva
            </Button>
          </div>
        </div>
      </Header>
      <Main>
        {schedules.unavailable ? (
          <Card>
            <CardContent className='p-6 text-sm text-muted-foreground'>
              El módulo de calendarización no está disponible para el perfil activo o el
              acceso fue rechazado. Verifica los feature flags.
            </CardContent>
          </Card>
        ) : (
          <div className='space-y-4'>
            <SchedulesList
              schedules={schedules.schedules}
              loading={schedules.loading}
              error={schedules.error}
              togglingId={schedules.togglingId}
              removingId={schedules.removingId}
              runningNowId={schedules.runningNowId}
              onEdit={openEdit}
              onToggle={schedules.toggle}
              onRunNow={schedules.runNow}
              onDelete={schedules.remove}
            />
            <ScheduleActivityPanel
              activity={schedules.activity}
              onClear={schedules.clearActivity}
            />
          </div>
        )}
      </Main>

      <ScheduleFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditing(null)
        }}
        schedule={editing}
        testsTree={schedules.testsTree}
        testsLoading={schedules.testsLoading}
        collectingTests={schedules.collectingTests}
        onCollectTests={schedules.collectTests}
        onSubmit={async (values) => {
          if (editing) {
            await schedules.update(editing.id, values)
          } else {
            await schedules.create(values)
          }
        }}
        submitting={schedules.creating || schedules.updating}
      />
    </>
  )
}
