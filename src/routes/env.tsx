import { createFileRoute } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { EnvironmentPage } from '@/features/environment'

export const Route = createFileRoute('/env')({
  component: () => (
    <AuthenticatedLayout>
      <EnvironmentPage />
    </AuthenticatedLayout>
  ),
})
