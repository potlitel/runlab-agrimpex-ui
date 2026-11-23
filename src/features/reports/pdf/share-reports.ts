import type { ReportDetail, ReportListItem, ReportsAnalytics } from '@/types/contract'
import {
  buildAnalyticsPdfBlob,
  buildRunPdfBlob,
  type AnalyticsExportSection,
  type RunExportSection,
} from './export-reports'
import { downloadBlob } from './report-pdf'

export type ShareChannel = 'whatsapp' | 'email'

export type ShareResult =
  | { status: 'shared' }
  | { status: 'fallback'; channel: ShareChannel; downloaded: boolean }
  | { status: 'cancelled' }

function isAbortError(error: unknown): boolean {
  return (
    !!error &&
    typeof error === 'object' &&
    'name' in error &&
    (error as { name?: string }).name === 'AbortError'
  )
}

function canShareFiles(files: File[]): boolean {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean
    share?: (data?: ShareData) => Promise<void>
  }
  if (typeof nav.share !== 'function') return false
  if (typeof nav.canShare !== 'function') return false
  try {
    return nav.canShare({ files })
  } catch {
    return false
  }
}

function openWhatsAppFallback(text: string) {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

function openEmailFallback(subject: string, body: string) {
  const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.location.href = url
}

function summarizeRun(payload: {
  reportId: string
  profileName?: string
  timestamp?: string
  total?: number
  passed?: number
  failed?: number
}) {
  const parts = [
    `Reporte RunLab Agrimpex`,
    payload.profileName ? `Perfil: ${payload.profileName}` : null,
    `Corrida: ${payload.reportId}`,
    payload.timestamp ? `Fecha: ${payload.timestamp}` : null,
    payload.total != null
      ? `Resultados: ${payload.passed ?? 0} pasados, ${payload.failed ?? 0} fallidos de ${payload.total}`
      : null,
  ].filter(Boolean)
  return parts.join('\n')
}

function summarizeAnalytics(payload: {
  profileName?: string
  totalRuns?: number
  passRate?: number
  failed?: number
}) {
  const parts = [
    `Reporte analítico RunLab Agrimpex`,
    payload.profileName ? `Perfil: ${payload.profileName}` : null,
    payload.totalRuns != null ? `Corridas: ${payload.totalRuns}` : null,
    payload.passRate != null ? `Tasa de éxito: ${payload.passRate}%` : null,
    payload.failed != null ? `Fallidos únicos: ${payload.failed}` : null,
  ].filter(Boolean)
  return parts.join('\n')
}

export async function sharePdfBlob(args: {
  blob: Blob
  fileName: string
  title: string
  text: string
  channel: ShareChannel
}): Promise<ShareResult> {
  const file = new File([args.blob], args.fileName, { type: 'application/pdf' })

  if (canShareFiles([file])) {
    try {
      await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({
        title: args.title,
        text: args.text,
        files: [file],
      })
      return { status: 'shared' }
    } catch (error) {
      if (isAbortError(error)) return { status: 'cancelled' }
      // fall through to fallback
    }
  }

  downloadBlob(args.blob, args.fileName)
  if (args.channel === 'whatsapp') {
    openWhatsAppFallback(`${args.text}\n\nAdjunté el PDF generado: ${args.fileName}`)
  } else {
    openEmailFallback(args.title, `${args.text}\n\nAdjunta manualmente el PDF generado: ${args.fileName}`)
  }
  return { status: 'fallback', channel: args.channel, downloaded: true }
}

export async function shareRunPdf(args: {
  channel: ShareChannel
  reportId: string
  profileName?: string
  sections?: RunExportSection[]
  fallbackReport?: ReportDetail | ReportListItem | null
}): Promise<ShareResult> {
  const { blob, fileName, payload } = await buildRunPdfBlob(args)
  const summary = payload.summary
  const failed = (summary?.failed ?? 0) + (summary?.errors ?? 0)
  const text = summarizeRun({
    reportId: payload.report.id,
    profileName: payload.profile?.name || args.profileName,
    timestamp: payload.report.timestamp,
    total: summary?.total,
    passed: summary?.passed,
    failed,
  })
  return sharePdfBlob({
    blob,
    fileName,
    title: `Reporte de corrida ${payload.report.id}`,
    text,
    channel: args.channel,
  })
}

export async function shareAnalyticsPdf(args: {
  channel: ShareChannel
  profileName?: string
  sections?: AnalyticsExportSection[]
  fallbackAnalytics?: ReportsAnalytics | null
  fallbackRecentRuns?: ReportListItem[]
}): Promise<ShareResult> {
  const { blob, fileName, payload } = await buildAnalyticsPdfBlob(args)
  const summary = payload.summary
  const text = summarizeAnalytics({
    profileName: payload.profile?.name || args.profileName,
    totalRuns: summary?.totalRuns,
    passRate: summary?.passRate,
    failed: summary?.uniqueFailed,
  })
  return sharePdfBlob({
    blob,
    fileName,
    title: 'Reporte analítico RunLab Agrimpex',
    text,
    channel: args.channel,
  })
}
