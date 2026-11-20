import { createFileRoute } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { FailureEvidencePage } from '@/features/errors/failure-evidence-page'

export const Route = createFileRoute('/errors')({
  component: () => (
    <AuthenticatedLayout>
      <FailureEvidencePage />
    </AuthenticatedLayout>
  ),
})
