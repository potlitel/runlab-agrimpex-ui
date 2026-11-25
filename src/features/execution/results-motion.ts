import type { ExecutionTestResult } from './use-execution'

/** El destello solo describe el instante en que un test termina. */
export function shouldFlashStatus(
  previous: ExecutionTestResult['status'] | undefined,
  current: ExecutionTestResult['status']
) {
  return (
    previous === 'running' &&
    (current === 'passed' || current === 'failed' || current === 'error')
  )
}
