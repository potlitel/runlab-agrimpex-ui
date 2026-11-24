import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { AxiosError } from 'axios'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'
import { loadRuntimeConfig } from '@/lib/runtime-config'
import { ProfileSessionProvider } from '@/features/profile-session/profile-session-provider'
import { DirectionProvider } from './context/direction-provider'
import { RuntimeConfigBanner, RuntimeConfigProvider } from './context/runtime-config-context'
import { FontProvider } from './context/font-provider'
import { ThemeProvider } from './context/theme-provider'
import { routeTree } from './routeTree.gen'
import './styles/index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // eslint-disable-next-line no-console
        if (import.meta.env.DEV) console.log({ failureCount, error })

        if (failureCount >= 0 && import.meta.env.DEV) return false
        if (failureCount > 3 && import.meta.env.PROD) return false

        return !(
          error instanceof AxiosError &&
          [401, 403].includes(error.response?.status ?? 0)
        )
      },
      refetchOnWindowFocus: import.meta.env.PROD,
      staleTime: 10 * 1000,
    },
    mutations: {
      onError: (error) => {
        handleServerError(error)

        if (error instanceof AxiosError) {
          if (error.response?.status === 304) {
            toast.error('Content not modified!')
          }
        }
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof AxiosError) {
        if (error.response?.status === 500) {
          toast.error('Internal Server Error!')
          if (import.meta.env.PROD) {
            router.navigate({ to: '/500' })
          }
        }
      }
    },
  }),
})

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  // Las URLs de API/socket se aplican antes de crear axios, el socket y el
  // primer render: cambiar el hostname desde Ajustes > Stack no exige rebuild.
  void loadRuntimeConfig().then((runtimeConfig) => {
    const root = ReactDOM.createRoot(rootElement)
    root.render(
      <StrictMode>
        <RuntimeConfigProvider value={runtimeConfig}>
          <RuntimeConfigBanner />
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <FontProvider>
                <DirectionProvider>
                  <ProfileSessionProvider>
                    <RouterProvider router={router} />
                  </ProfileSessionProvider>
                </DirectionProvider>
              </FontProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </RuntimeConfigProvider>
      </StrictMode>
    )
  })
}
