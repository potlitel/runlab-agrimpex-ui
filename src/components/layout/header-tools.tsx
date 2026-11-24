import { ConfigDrawer } from '@/components/config-drawer'
import { HealthStatusBadge } from '@/components/health-status-badge'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { cn } from '@/lib/utils'

type HeaderToolsProps = {
  className?: string
  showSearch?: boolean
}

export function HeaderTools({ className, showSearch = true }: HeaderToolsProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showSearch && <Search className='hidden sm:inline-flex' />}
      <HealthStatusBadge />
      <ThemeSwitch />
      <ConfigDrawer />
    </div>
  )
}
