import { createFileRoute } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { LiveFlowPage } from '@/features/execution'

export const Route = createFileRoute('/live-flow')({
  component: () => (
    <AuthenticatedLayout>
      <LiveFlowPage />
    </AuthenticatedLayout>
  ),
})
