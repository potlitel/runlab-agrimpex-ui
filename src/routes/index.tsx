import { createFileRoute } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { ExecutionDashboard } from '@/features/execution'

export const Route = createFileRoute('/')({
  component: () => (
    <AuthenticatedLayout>
      <ExecutionDashboard />
    </AuthenticatedLayout>
  ),
})
