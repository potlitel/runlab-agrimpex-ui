import { createFileRoute } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { HealthPage } from '@/features/health'

export const Route = createFileRoute('/health')({
  component: () => (
    <AuthenticatedLayout>
      <HealthPage />
    </AuthenticatedLayout>
  ),
})
