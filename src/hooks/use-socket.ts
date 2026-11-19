import { useCallback, useEffect, useMemo, useRef } from 'react'
import type {
  AutomationDonePayload,
  AutomationFailedPayload,
  AutomationLogPayload,
  AutomationProgressPayload,
  DockerExitPayload,
  DockerLogPayload,
  DockerStartedPayload,
  EnvDepsDonePayload,
  EnvFailedPayload,
  EnvLogPayload,
  EnvProgressPayload,
  EnvVenvDonePayload,
  ExecutionAbortedPayload,
  ExecutionCompletedPayload,
  ExecutionPreparingPayload,
  ExecutionPrepareFailedPayload,
  ExecutionStartedPayload,
  ProfilesStatusPayload,
  ProgressPayload,
  ScheduleLogPayload,
  ScheduleRunPayload,
  SystemUpdateEventPayload,
  TestCompletedPayload,
  TestOutputPayload,
  TestStartedPayload,
} from '@/types/contract'
import {
  connect as socketConnect,
  disconnect as socketDisconnect,
  getRawSocket,
  joinProfile,
} from '@/lib/socket'

type Handler<T> = (payload: T) => void

function subscribe<T>(event: string, handler: Handler<T>) {
  const sock = getRawSocket()
  const wrapped = (payload: T) => handler(payload)
  sock.on(event, wrapped as (...args: unknown[]) => void)
  return () => {
    sock.off(event, wrapped as (...args: unknown[]) => void)
  }
}

export function useSocket(profileId?: string | null) {
  const joinedProfileRef = useRef<string | null>(null)

  const connect = useCallback(() => {
    socketConnect(profileId ?? undefined)
  }, [profileId])

  const disconnect = useCallback(() => {
    socketDisconnect()
  }, [])

  useEffect(() => {
    if (!profileId) return
    if (joinedProfileRef.current === profileId) return
    // Sale de la sala anterior y entra a la nueva (joinProfile lo gestiona)
    joinProfile(profileId)
    joinedProfileRef.current = profileId
  }, [profileId])

  const onExecution = useCallback(
    (handlers: {
      started?: Handler<ExecutionStartedPayload>
      completed?: Handler<ExecutionCompletedPayload>
      aborted?: Handler<ExecutionAbortedPayload>
      preparing?: Handler<ExecutionPreparingPayload>
      prepareFailed?: Handler<ExecutionPrepareFailedPayload>
    }) => {
      const unsubs: Array<() => void> = []
      if (handlers.started) unsubs.push(subscribe('execution:started', handlers.started))
      if (handlers.completed) unsubs.push(subscribe('execution:completed', handlers.completed))
      if (handlers.aborted) unsubs.push(subscribe('execution:aborted', handlers.aborted))
      if (handlers.preparing) unsubs.push(subscribe('execution:preparing', handlers.preparing))
      if (handlers.prepareFailed)
        unsubs.push(subscribe('execution:prepare-failed', handlers.prepareFailed))
      return () => unsubs.forEach((u) => u())
    },
    []
  )

  const onTest = useCallback(
    (handlers: {
      started?: Handler<TestStartedPayload>
      completed?: Handler<TestCompletedPayload>
      output?: Handler<TestOutputPayload>
    }) => {
      const unsubs: Array<() => void> = []
      if (handlers.started) unsubs.push(subscribe('test:started', handlers.started))
      if (handlers.completed) unsubs.push(subscribe('test:completed', handlers.completed))
      if (handlers.output) unsubs.push(subscribe('test:output', handlers.output))
      return () => unsubs.forEach((u) => u())
    },
    []
  )

  const onProgress = useCallback((handler: Handler<ProgressPayload>) => {
    return subscribe('progress', handler)
  }, [])

  const onDocker = useCallback(
    (handlers: {
      log?: Handler<DockerLogPayload>
      started?: Handler<DockerStartedPayload>
      exit?: Handler<DockerExitPayload>
    }) => {
      const unsubs: Array<() => void> = []
      if (handlers.log) unsubs.push(subscribe('docker:log', handlers.log))
      if (handlers.started) unsubs.push(subscribe('docker:started', handlers.started))
      if (handlers.exit) unsubs.push(subscribe('docker:exit', handlers.exit))
      return () => unsubs.forEach((u) => u())
    },
    []
  )

  const onAutomation = useCallback(
    (handlers: {
      progress?: Handler<AutomationProgressPayload>
      updateProgress?: Handler<AutomationProgressPayload>
      log?: Handler<AutomationLogPayload>
      done?: Handler<AutomationDonePayload>
      failed?: Handler<AutomationFailedPayload>
      updateDone?: Handler<Record<string, unknown>>
      updateFailed?: Handler<AutomationFailedPayload>
    }) => {
      const unsubs: Array<() => void> = []
      if (handlers.progress) unsubs.push(subscribe('automation:progress', handlers.progress))
      if (handlers.updateProgress)
        unsubs.push(subscribe('automation:update-progress', handlers.updateProgress))
      if (handlers.log) unsubs.push(subscribe('automation:log', handlers.log))
      if (handlers.done) unsubs.push(subscribe('automation:done', handlers.done))
      if (handlers.failed) unsubs.push(subscribe('automation:failed', handlers.failed))
      if (handlers.updateDone) unsubs.push(subscribe('automation:update-done', handlers.updateDone))
      if (handlers.updateFailed)
        unsubs.push(subscribe('automation:update-failed', handlers.updateFailed))
      return () => unsubs.forEach((u) => u())
    },
    []
  )

  const onEnv = useCallback(
    (handlers: {
      progress?: Handler<EnvProgressPayload>
      log?: Handler<EnvLogPayload>
      venvDone?: Handler<EnvVenvDonePayload>
      depsDone?: Handler<EnvDepsDonePayload>
      failed?: Handler<EnvFailedPayload>
    }) => {
      const unsubs: Array<() => void> = []
      if (handlers.progress) unsubs.push(subscribe('env:progress', handlers.progress))
      if (handlers.log) unsubs.push(subscribe('env:log', handlers.log))
      if (handlers.venvDone) unsubs.push(subscribe('env:venv-done', handlers.venvDone))
      if (handlers.depsDone) unsubs.push(subscribe('env:deps-done', handlers.depsDone))
      if (handlers.failed) unsubs.push(subscribe('env:failed', handlers.failed))
      return () => unsubs.forEach((u) => u())
    },
    []
  )

  const onSchedule = useCallback(
    (handlers: {
      run?: Handler<ScheduleRunPayload>
      log?: Handler<ScheduleLogPayload>
    }) => {
      const unsubs: Array<() => void> = []
      if (handlers.run) unsubs.push(subscribe('schedule:run', handlers.run))
      if (handlers.log) unsubs.push(subscribe('schedule:log', handlers.log))
      return () => unsubs.forEach((u) => u())
    },
    []
  )

  const onProfileStatus = useCallback((handler: Handler<ProfilesStatusPayload>) => {
    // profiles:status se emite como broadcast global (array), no en sala de perfil
    return subscribe('profiles:status', handler)
  }, [])

  const onSystem = useCallback((handler: Handler<SystemUpdateEventPayload>) => {
    return subscribe('system:update', handler)
  }, [])

  return useMemo(
    () => ({
      connect,
      disconnect,
      joinProfile,
      onExecution,
      onTest,
      onProgress,
      onDocker,
      onAutomation,
      onEnv,
      onSchedule,
      onProfileStatus,
      onSystem,
      socket: getRawSocket(),
    }),
    [
      connect,
      disconnect,
      onExecution,
      onTest,
      onProgress,
      onDocker,
      onAutomation,
      onEnv,
      onSchedule,
      onProfileStatus,
      onSystem,
    ]
  )
}

export type UseSocketReturn = ReturnType<typeof useSocket>
