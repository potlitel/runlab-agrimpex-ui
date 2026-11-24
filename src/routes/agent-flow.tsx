import { createFileRoute } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { AgentFlowPage } from '@/features/docker'

export const Route = createFileRoute('/agent-flow')({
  component: () => (
    <AuthenticatedLayout>
      <AgentFlowPage />
    </AuthenticatedLayout>
  ),
})
