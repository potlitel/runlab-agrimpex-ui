import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { configApi } from '@/lib/api'
import type { Config } from '@/types/contract'
import type { LastRunOptions } from '../use-execution'

export function useProjectConfig(profileId: string | null): UseQueryResult<Config, Error> {
  return useQuery({
    queryKey: ['config', profileId],
    queryFn: () => configApi.get(),
    enabled: !!profileId,
    retry: false,
  })
}

export function contextFrom(config: Config | undefined, options: LastRunOptions | null) {
  const projectPath = config?.projectPath?.trim() || ''
  const configured = !!projectPath
  const command = config?.playwrightCmd?.trim() || config?.pytestCmd?.trim() || ''
  const mcpDetected = !!config?.projectFeatures?.mcp?.detected
  const mcpSignals = config?.projectFeatures?.mcp?.signals ?? []

  return {
    projectPath,
    configured,
    command,
    mcpDetected,
    mcpSignals,
    environment: options?.profileName || options?.envFile || null,
    useDocker: options?.useDocker,
    workers: options?.workers,
    grep: options?.grep,
    paramsCount: options?.paramsCount,
  }
}
