import { createContext, type ReactNode, useContext } from 'react'
import { getRuntimeConfig, type RuntimeConfigState } from '@/lib/runtime-config'

const RuntimeConfigContext = createContext<RuntimeConfigState | null>(null)

export function RuntimeConfigProvider({
  value,
  children,
}: {
  value: RuntimeConfigState
  children: ReactNode
}) {
  return <RuntimeConfigContext.Provider value={value}>{children}</RuntimeConfigContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRuntimeConfig(): RuntimeConfigState {
  return useContext(RuntimeConfigContext) ?? getRuntimeConfig()
}

export function RuntimeConfigBanner() {
  const config = useRuntimeConfig()
  return (
    <div
      role='status'
      data-testid='runtime-config-banner'
      className='flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-1 text-xs text-muted-foreground'
    >
      <span>
        Configuración v{config.configVersion} ·{' '}
        {config.source === 'runtime' ? 'resuelta en ejecución' : 'fallback del bundle'}
      </span>
      {config.degraded && (
        <span role='alert' className='text-amber-600 dark:text-amber-400'>
          No se pudo cargar /public-config.json; se usan las URLs incluidas en la imagen.
        </span>
      )}
    </div>
  )
}
