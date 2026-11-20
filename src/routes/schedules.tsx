import { createFileRoute } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { SchedulesPage } from '@/features/schedules'

export const Route = createFileRoute('/schedules')({
  component: () => (
    <AuthenticatedLayout>
      <SchedulesPage />
    </AuthenticatedLayout>
  ),
})
