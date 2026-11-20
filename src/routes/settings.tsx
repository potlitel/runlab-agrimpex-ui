import { createFileRoute } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { SettingsPage } from '@/features/settings'

export const Route = createFileRoute('/settings')({
  component: () => (
    <AuthenticatedLayout>
      <SettingsPage />
    </AuthenticatedLayout>
  ),
})
