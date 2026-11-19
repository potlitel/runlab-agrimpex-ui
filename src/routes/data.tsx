import { createFileRoute } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { ComingSoon } from '@/components/coming-soon'

export const Route = createFileRoute('/data')({
  component: () => (
    <AuthenticatedLayout>
      <ComingSoon />
    </AuthenticatedLayout>
  ),
})
