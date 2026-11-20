import { createFileRoute } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { TestsPage } from '@/features/execution'

export const Route = createFileRoute('/tests')({
  component: () => (
    <AuthenticatedLayout>
      <TestsPage />
    </AuthenticatedLayout>
  ),
})
