import { createFileRoute } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { TestDataPage } from '@/features/test-data'

export const Route = createFileRoute('/data')({
  component: () => (
    <AuthenticatedLayout>
      <TestDataPage />
    </AuthenticatedLayout>
  ),
})
