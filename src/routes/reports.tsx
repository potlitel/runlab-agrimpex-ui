import { createFileRoute } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { ReportsPage } from '@/features/reports'

export const Route = createFileRoute('/reports')({
  component: () => (
    <AuthenticatedLayout>
      <ReportsPage />
    </AuthenticatedLayout>
  ),
})
