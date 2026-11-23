import { reportsApi } from '@/lib/api'
import type {
  ReportAnalyticsExportPayload,
  ReportAnalyticsExportSectionId,
  ReportDetail,
  ReportListItem,
  ReportRunExportPayload,
  ReportRunExportSectionId,
  ReportsAnalytics,
} from '@/types/contract'
import {
  ANALYTICS_PDF_SECTIONS,
  RUN_PDF_SECTIONS,
  downloadBlob,
  generateAnalyticsPdf,
  generateRunPdf,
} from './report-pdf'

export type RunExportSection = ReportRunExportSectionId
export type AnalyticsExportSection = ReportAnalyticsExportSectionId

function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object'
}

function normalizeRunPayload(
  payload: unknown,
  fallback: { report?: ReportDetail | ReportListItem | null; profileName?: string }
): ReportRunExportPayload {
  const p = isObject(payload) ? payload : {}
  const reportObj = isObject(p.report) ? p.report : {}
  const fallbackReport = fallback.report
  const reportId = String(reportObj.id ?? fallbackReport?.id ?? '')
  return {
    type: 'run',
    generatedAt: typeof p.generatedAt === 'string' ? p.generatedAt : new Date().toISOString(),
    profile:
      isObject(p.profile)
        ? (p.profile as ReportRunExportPayload['profile'])
        : fallback.profileName
          ? { name: fallback.profileName }
          : undefined,
    report: {
      id: reportId,
      timestamp:
        typeof reportObj.timestamp === 'string'
          ? reportObj.timestamp
          : fallbackReport?.timestamp,
    },
    summary:
      isObject(p.summary)
        ? (p.summary as ReportRunExportPayload['summary'])
        : (fallbackReport?.summary as ReportRunExportPayload['summary']),
    tests: Array.isArray(p.tests)
      ? (p.tests as ReportRunExportPayload['tests'])
      : ((fallbackReport as ReportDetail | null)?.tests ?? []),
    sections: Array.isArray(p.sections)
      ? (p.sections.filter((s): s is RunExportSection => typeof s === 'string') as RunExportSection[])
      : undefined,
    source: typeof p.source === 'string' ? p.source : 'frontend-fallback',
  }
}

function normalizeAnalyticsPayload(
  payload: unknown,
  fallback: { analytics?: ReportsAnalytics | null; recentRuns?: ReportListItem[]; profileName?: string }
): ReportAnalyticsExportPayload {
  const p = isObject(payload) ? payload : {}
  const summary = isObject(p.summary)
    ? (p.summary as ReportsAnalytics)
    : (fallback.analytics as ReportsAnalytics)
  return {
    type: 'analytics',
    generatedAt: typeof p.generatedAt === 'string' ? p.generatedAt : new Date().toISOString(),
    profile:
      isObject(p.profile)
        ? (p.profile as ReportAnalyticsExportPayload['profile'])
        : fallback.profileName
          ? { name: fallback.profileName }
          : undefined,
    summary,
    timeline: Array.isArray(p.timeline)
      ? (p.timeline as ReportAnalyticsExportPayload['timeline'])
      : (summary?.timeline as ReportAnalyticsExportPayload['timeline']),
    byFile: Array.isArray(p.byFile)
      ? (p.byFile as ReportAnalyticsExportPayload['byFile'])
      : (summary?.byFile as ReportAnalyticsExportPayload['byFile']),
    recentRuns: Array.isArray(p.recentRuns)
      ? (p.recentRuns as ReportAnalyticsExportPayload['recentRuns'])
      : fallback.recentRuns?.map((r) => ({
          id: r.id,
          timestamp: r.timestamp,
          summary: r.summary,
        })),
    sections: Array.isArray(p.sections)
      ? (p.sections.filter((s): s is AnalyticsExportSection => typeof s === 'string') as AnalyticsExportSection[])
      : undefined,
    source: typeof p.source === 'string' ? p.source : 'frontend-fallback',
  }
}

export async function buildRunPdfBlob(args: {
  reportId: string
  profileName?: string
  sections?: RunExportSection[]
  fallbackReport?: ReportDetail | ReportListItem | null
}): Promise<{ blob: Blob; fileName: string; payload: ReportRunExportPayload }> {
  let payload: unknown
  try {
    payload = await reportsApi.exportRun(args.reportId)
  } catch {
    let detail = args.fallbackReport ?? null
    if (!detail || !('tests' in detail)) {
      try {
        detail = await reportsApi.get(args.reportId)
      } catch {
        // keep fallback
      }
    }
    payload = { type: 'run', report: { id: args.reportId }, source: 'frontend-fallback' }
    payload = normalizeRunPayload(payload, { report: detail, profileName: args.profileName })
  }
  const normalized = normalizeRunPayload(payload, {
    report: args.fallbackReport ?? null,
    profileName: args.profileName,
  })
  const blob = await generateRunPdf(normalized, { sections: args.sections })
  const safeId = args.reportId.replace(/[^a-zA-Z0-9._-]+/g, '-')
  return { blob, fileName: `reporte-${safeId}.pdf`, payload: normalized }
}

export async function buildAnalyticsPdfBlob(args: {
  profileName?: string
  sections?: AnalyticsExportSection[]
  fallbackAnalytics?: ReportsAnalytics | null
  fallbackRecentRuns?: ReportListItem[]
}): Promise<{ blob: Blob; fileName: string; payload: ReportAnalyticsExportPayload }> {
  let payload: unknown
  try {
    payload = await reportsApi.exportAnalytics()
  } catch {
    payload = normalizeAnalyticsPayload(
      { type: 'analytics', source: 'frontend-fallback' },
      {
        analytics: args.fallbackAnalytics,
        recentRuns: args.fallbackRecentRuns,
        profileName: args.profileName,
      }
    )
  }
  const normalized = normalizeAnalyticsPayload(payload, {
    analytics: args.fallbackAnalytics,
    recentRuns: args.fallbackRecentRuns,
    profileName: args.profileName,
  })
  const blob = await generateAnalyticsPdf(normalized, { sections: args.sections })
  const date = new Date().toISOString().slice(0, 10)
  return { blob, fileName: `reporte-analitico-${date}.pdf`, payload: normalized }
}

export async function exportRunPdf(args: {
  reportId: string
  profileName?: string
  sections?: RunExportSection[]
  fallbackReport?: ReportDetail | ReportListItem | null
}): Promise<void> {
  const { blob, fileName } = await buildRunPdfBlob(args)
  downloadBlob(blob, fileName)
}

export async function exportAnalyticsPdf(args: {
  profileName?: string
  sections?: AnalyticsExportSection[]
  fallbackAnalytics?: ReportsAnalytics | null
  fallbackRecentRuns?: ReportListItem[]
}): Promise<void> {
  const { blob, fileName } = await buildAnalyticsPdfBlob(args)
  downloadBlob(blob, fileName)
}

export { RUN_PDF_SECTIONS, ANALYTICS_PDF_SECTIONS }
