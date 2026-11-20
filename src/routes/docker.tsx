import { createFileRoute } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { DockerPage } from '@/features/docker'

export const Route = createFileRoute('/docker')({
  component: () => (
    <AuthenticatedLayout>
      <DockerPage />
    </AuthenticatedLayout>
  ),
})
