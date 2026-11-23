import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { reportsApi } from '@/lib/api'
import type {
  ReportAnalyticsByFileRow,
  ReportAnalyticsExportPayload,
  ReportAnalyticsExportSectionId,
  ReportAnalyticsRecentRun,
  ReportAnalyticsTimelinePoint,
  ReportRunExportPayload,
  ReportRunExportSectionId,
  ReportSummary,
} from '@/types/contract'

export type RunPdfSection = ReportRunExportSectionId
export type AnalyticsPdfSection = ReportAnalyticsExportSectionId

export const RUN_PDF_SECTIONS: RunPdfSection[] = [
  'cover',
  'summary',
  'tests',
  'evidence',
  'footer',
]

export const ANALYTICS_PDF_SECTIONS: AnalyticsPdfSection[] = [
  'cover',
  'kpis',
  'trend',
  'byFile',
  'recentRuns',
  'footer',
]

type PdfDoc = jsPDF

type GenerateOptions = {
  sections?: string[]
  fileName?: string
}

const PAGE_MARGIN = 14
const PAGE_BOTTOM = 280

function normalizeSections<T extends string>(requested: string[] | undefined, defaults: T[]): T[] {
  if (!requested || requested.length === 0) return defaults
  const allowed = new Set(defaults)
  const selected = requested.filter((s): s is T => allowed.has(s as T))
  return selected.length > 0 ? selected : defaults
}

function asNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

function formatDate(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString()
}

function formatDuration(seconds?: number | null): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return '—'
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}m ${s}s`
}

function ensureSpace(doc: PdfDoc, y: number, needed = 20): number {
  if (y + needed <= PAGE_BOTTOM) return y
  doc.addPage()
  return 20
}

function addTitle(doc: PdfDoc, text: string, y: number): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(text, PAGE_MARGIN, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  return y + 8
}

function addKeyValue(doc: PdfDoc, label: string, value: string, y: number): number {
  const yy = ensureSpace(doc, y, 8)
  doc.setFont('helvetica', 'bold')
  doc.text(`${label}:`, PAGE_MARGIN, yy)
  doc.setFont('helvetica', 'normal')
  const lines = doc.splitTextToSize(value || '—', 160)
  doc.text(lines, PAGE_MARGIN + 38, yy)
  return yy + Math.max(6, lines.length * 5)
}

function addFooter(doc: PdfDoc, generatedAt: string) {
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(110)
    doc.text(`RunLab Agrimpex QA Dashboard · Generado: ${generatedAt}`, PAGE_MARGIN, 290)
    doc.text(`Página ${i}/${pages}`, 190, 290, { align: 'right' })
    doc.setTextColor(0)
  }
}

function summaryRows(summary: ReportSummary | undefined) {
  const failed = asNumber(summary?.failed) + asNumber(summary?.errors)
  return [
    ['Total', String(asNumber(summary?.total))],
    ['Pasados', String(asNumber(summary?.passed))],
    ['Fallidos/Errores', String(failed)],
    ['Omitidos', String(asNumber(summary?.skipped))],
    ['Duración', formatDuration(summary?.duration)],
  ]
}

function normalizeTimeline(timeline: unknown): ReportAnalyticsTimelinePoint[] {
  if (!Array.isArray(timeline)) return []
  return timeline
    .filter((p): p is Record<string, unknown> => !!p && typeof p === 'object')
    .map((p, index) => ({
      timestamp: typeof p.timestamp === 'string' ? p.timestamp : undefined,
      label:
        typeof p.label === 'string'
          ? p.label
          : typeof p.timestamp === 'string'
            ? new Date(p.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            : `${index + 1}`,
      passed: asNumber(p.passed),
      failed: asNumber(p.failed),
      errors: asNumber(p.errors),
      skipped: asNumber(p.skipped),
      total: asNumber(p.total),
      duration: asNumber(p.duration),
    }))
}

function normalizeByFile(byFile: unknown): ReportAnalyticsByFileRow[] {
  if (!Array.isArray(byFile)) return []
  return byFile
    .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
    .map((r) => ({
      file: typeof r.file === 'string' ? r.file : typeof r.name === 'string' ? r.name : '—',
      total: asNumber(r.total),
      passed: asNumber(r.passed),
      failed: asNumber(r.failed),
      errors: asNumber(r.errors),
      skipped: asNumber(r.skipped),
      passRate: r.passRate == null ? undefined : asNumber(r.passRate),
      duration: r.duration == null ? undefined : asNumber(r.duration),
    }))
}

function normalizeRecentRuns(runs: unknown): ReportAnalyticsRecentRun[] {
  if (!Array.isArray(runs)) return []
  return runs
    .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object' && typeof r.id === 'string')
    .map((r) => ({
      id: String(r.id),
      timestamp: typeof r.timestamp === 'string' ? r.timestamp : undefined,
      summary: r.summary && typeof r.summary === 'object' ? (r.summary as ReportSummary) : undefined,
      status: typeof r.status === 'string' ? r.status : undefined,
    }))
}

async function fetchImageDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { credentials: 'include' })
    if (!res.ok) return null
    const blob = await res.blob()
    if (!blob.type.startsWith('image/')) return null
    if (typeof FileReader !== 'undefined') {
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(blob)
      })
    }
    const bytes = new Uint8Array(await blob.arrayBuffer())
    let binary = ''
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!)
    const b64 = typeof btoa === 'function' ? btoa(binary) : ''
    return b64 ? `data:${blob.type};base64,${b64}` : null
  } catch {
    return null
  }
}

function drawTrendChart(doc: PdfDoc, timeline: ReportAnalyticsTimelinePoint[], y: number): number {
  if (timeline.length === 0) return y
  let yy = ensureSpace(doc, y, 70)
  yy = addTitle(doc, 'Tendencia', yy)
  const left = PAGE_MARGIN
  const top = yy
  const width = 180
  const height = 45
  const max = Math.max(
    1,
    ...timeline.map((p) => asNumber(p.passed) + asNumber(p.failed) + asNumber(p.errors))
  )
  doc.setDrawColor(180)
  doc.rect(left, top, width, height)
  const barGap = 2
  const barWidth = Math.max(4, (width - barGap * (timeline.length + 1)) / timeline.length)
  timeline.slice(-12).forEach((p, i) => {
    const passed = asNumber(p.passed)
    const failed = asNumber(p.failed) + asNumber(p.errors)
    const total = passed + failed
    const x = left + barGap + i * (barWidth + barGap)
    const passedH = (passed / max) * (height - 6)
    const failedH = (failed / max) * (height - 6)
    const baseY = top + height - 2
    if (passedH > 0) {
      doc.setFillColor(46, 160, 67)
      doc.rect(x, baseY - passedH, barWidth, passedH, 'F')
    }
    if (failedH > 0) {
      doc.setFillColor(220, 38, 38)
      doc.rect(x, baseY - passedH - failedH, barWidth, failedH, 'F')
    }
    doc.setFontSize(6)
    doc.setTextColor(90)
    const label = (p.label || '').slice(0, 6)
    doc.text(label, x + barWidth / 2, top + height + 4, { align: 'center' })
    doc.setTextColor(0)
    if (total === 0) {
      doc.setDrawColor(210)
      doc.line(x, baseY, x + barWidth, baseY)
    }
  })
  doc.setFontSize(8)
  doc.setFillColor(46, 160, 67)
  doc.rect(left, top + height + 8, 3, 3, 'F')
  doc.text('Pasados', left + 5, top + height + 11)
  doc.setFillColor(220, 38, 38)
  doc.rect(left + 28, top + height + 8, 3, 3, 'F')
  doc.text('Fallidos/Errores', left + 33, top + height + 11)
  doc.setFontSize(10)
  return top + height + 18
}

export async function generateRunPdf(
  payload: ReportRunExportPayload,
  options: GenerateOptions = {}
): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const sections = normalizeSections(options.sections, RUN_PDF_SECTIONS)
  const generatedAt = formatDate(payload.generatedAt || new Date().toISOString())
  let y = 20

  if (sections.includes('cover')) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('Reporte integral de corrida', PAGE_MARGIN, y)
    y += 10
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    y = addKeyValue(doc, 'Reporte', payload.report?.id || '—', y)
    y = addKeyValue(doc, 'Perfil', payload.profile?.name || payload.profile?.id || '—', y)
    y = addKeyValue(doc, 'Fecha corrida', formatDate(payload.report?.timestamp), y)
    y = addKeyValue(doc, 'Generado', generatedAt, y)
    y += 2
  }

  if (sections.includes('summary')) {
    y = ensureSpace(doc, y, 40)
    y = addTitle(doc, 'Resumen ejecutivo', y)
    autoTable(doc, {
      startY: y,
      head: [['Métrica', 'Valor']],
      body: summaryRows(payload.summary),
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    })
    y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y
    y += 8
  }

  if (sections.includes('tests')) {
    y = ensureSpace(doc, y, 30)
    y = addTitle(doc, 'Resultados por test', y)
    const tests = Array.isArray(payload.tests) ? payload.tests : []
    if (tests.length === 0) {
      doc.text('No hay resultados de tests.', PAGE_MARGIN, y)
      y += 8
    } else {
      autoTable(doc, {
        startY: y,
        head: [['Test', 'Estado', 'Duración', 'Error / salida']],
        body: tests.map((t) => [
          t.id,
          t.status,
          formatDuration(t.duration),
          (t.errorMsg || t.output || '—').slice(0, 300),
        ]),
        theme: 'grid',
        styles: { fontSize: 8, cellWidth: 'wrap' },
        columnStyles: {
          0: { cellWidth: 55 },
          1: { cellWidth: 20 },
          2: { cellWidth: 20 },
          3: { cellWidth: 85 },
        },
        headStyles: { fillColor: [37, 99, 235] },
        margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
      })
      y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y
      y += 8
    }
  }

  if (sections.includes('evidence')) {
    y = ensureSpace(doc, y, 30)
    y = addTitle(doc, 'Evidencias', y)
    const tests = Array.isArray(payload.tests) ? payload.tests : []
    const allAttachments = tests.flatMap((t) =>
      (t.attachments ?? []).map((a) => ({ ...a, testId: t.id }))
    )
    if (allAttachments.length === 0) {
      doc.text('No hay evidencias adjuntas.', PAGE_MARGIN, y)
    } else {
      for (const att of allAttachments) {
        y = ensureSpace(doc, y, 45)
        const label = `${att.testId} — ${att.name || att.path || att.assetPath || 'adjunto'}`
        doc.setFontSize(8)
        doc.text(doc.splitTextToSize(label, 180), PAGE_MARGIN, y)
        y += 4
        const isImage = String(att.kind || att.contentType || '').toLowerCase().includes('image') ||
          /\.(png|jpe?g|gif|webp)$/i.test(String(att.assetPath || att.path || att.name || ''))
        if (isImage) {
          const assetUrl =
            att.assetUrl ||
            (att.assetPath && payload.report?.id
              ? reportsApi.assetUrl(payload.report.id, att.assetPath)
              : null)
          const dataUrl = assetUrl ? await fetchImageDataUrl(assetUrl) : null
          if (dataUrl) {
            try {
              const fmt = dataUrl.includes('image/jpeg') ? 'JPEG' : 'PNG'
              doc.addImage(dataUrl, fmt, PAGE_MARGIN, y, 80, 45, undefined, 'FAST')
              y += 49
            } catch {
              doc.text('[Imagen no disponible para renderizar]', PAGE_MARGIN, y)
              y += 6
            }
          } else {
            doc.text('[Imagen no disponible]', PAGE_MARGIN, y)
            y += 6
          }
        } else {
          doc.text(`[Adjunto no imagen] ${att.contentType || att.path || att.assetPath || ''}`, PAGE_MARGIN, y)
          y += 6
        }
      }
    }
  }

  if (sections.includes('footer')) {
    addFooter(doc, generatedAt)
  }

  return doc.output('blob')
}

export async function generateAnalyticsPdf(
  payload: ReportAnalyticsExportPayload,
  options: GenerateOptions = {}
): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const sections = normalizeSections(options.sections, ANALYTICS_PDF_SECTIONS)
  const generatedAt = formatDate(payload.generatedAt || new Date().toISOString())
  let y = 20

  const timeline = normalizeTimeline(payload.timeline ?? payload.summary?.timeline)
  const byFile = normalizeByFile(payload.byFile ?? payload.summary?.byFile)
  const recentRuns = normalizeRecentRuns(payload.recentRuns)

  if (sections.includes('cover')) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text('Reporte analítico integral', PAGE_MARGIN, y)
    y += 10
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    y = addKeyValue(doc, 'Perfil', payload.profile?.name || payload.profile?.id || '—', y)
    y = addKeyValue(doc, 'Generado', generatedAt, y)
    y = addKeyValue(doc, 'Alcance', 'Analítica agregada de reportes', y)
    y += 2
  }

  if (sections.includes('kpis')) {
    y = ensureSpace(doc, y, 45)
    y = addTitle(doc, 'KPIs', y)
    const s = payload.summary
    const rows = [
      ['Corridas', String(asNumber(s?.totalRuns))],
      ['Ejecuciones totales', String(asNumber(s?.totalExecutions))],
      ['Tasa de éxito', `${asNumber(s?.passRate)}%`],
      ['Únicos pasados', String(asNumber(s?.uniquePassed))],
      ['Únicos fallidos', String(asNumber(s?.uniqueFailed))],
      ['Nunca ejecutados', s?.neverExecuted == null ? '—' : String(s.neverExecuted)],
      ['Duración promedio', formatDuration(s?.avgDuration)],
    ]
    autoTable(doc, {
      startY: y,
      head: [['KPI', 'Valor']],
      body: rows,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    })
    y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y
    y += 8
  }

  if (sections.includes('trend')) {
    if (timeline.length > 0) {
      y = drawTrendChart(doc, timeline, y)
    } else {
      y = ensureSpace(doc, y, 12)
      y = addTitle(doc, 'Tendencia', y)
      doc.text('No hay datos de tendencia disponibles.', PAGE_MARGIN, y)
      y += 8
    }
  }

  if (sections.includes('byFile')) {
    y = ensureSpace(doc, y, 30)
    y = addTitle(doc, 'Desglose por archivo', y)
    if (byFile.length === 0) {
      doc.text('No hay desglose por archivo disponible.', PAGE_MARGIN, y)
      y += 8
    } else {
      autoTable(doc, {
        startY: y,
        head: [['Archivo', 'Total', 'Pasados', 'Fallidos', 'Errores', 'Omitidos']],
        body: byFile.map((r) => [
          String(r.file ?? r.name ?? '—'),
          String(asNumber(r.total)),
          String(asNumber(r.passed)),
          String(asNumber(r.failed)),
          String(asNumber(r.errors)),
          String(asNumber(r.skipped)),
        ]),
        theme: 'grid',
        styles: { fontSize: 8, cellWidth: 'wrap' },
        columnStyles: { 0: { cellWidth: 70 } },
        headStyles: { fillColor: [37, 99, 235] },
        margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
      })
      y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y
      y += 8
    }
  }

  if (sections.includes('recentRuns')) {
    y = ensureSpace(doc, y, 30)
    y = addTitle(doc, 'Corridas recientes', y)
    if (recentRuns.length === 0) {
      doc.text('No hay corridas recientes disponibles.', PAGE_MARGIN, y)
    } else {
      autoTable(doc, {
        startY: y,
        head: [['ID', 'Fecha', 'Total', 'Pasados', 'Fallidos']],
        body: recentRuns.slice(0, 20).map((r) => {
          const summary = r.summary
          const failed = asNumber(summary?.failed) + asNumber(summary?.errors)
          return [
            r.id,
            formatDate(r.timestamp),
            String(asNumber(summary?.total)),
            String(asNumber(summary?.passed)),
            String(failed),
          ]
        }),
        theme: 'grid',
        styles: { fontSize: 8, cellWidth: 'wrap' },
        columnStyles: { 0: { cellWidth: 55 } },
        headStyles: { fillColor: [37, 99, 235] },
        margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
      })
    }
  }

  if (sections.includes('footer')) {
    addFooter(doc, generatedAt)
  }

  return doc.output('blob')
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
