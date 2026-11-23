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

const PAGE_MARGIN = 20
const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2
const PAGE_BOTTOM = PAGE_HEIGHT - 20
const BRAND = {
  primary: [15, 23, 42] as [number, number, number],
  accent: [37, 99, 235] as [number, number, number],
  success: [22, 163, 74] as [number, number, number],
  danger: [220, 38, 38] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  zebra: [248, 250, 252] as [number, number, number],
}

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

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n)
      return Number.isFinite(code) ? String.fromCharCode(code) : _
    })
}

function sanitizeText(value: unknown, maxLength = 500): string {
  if (value == null) return '—'
  let text = String(value)
  text = decodeEntities(text)
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/(p|div|li|tr|h\d)>/gi, '\n')
  text = text.replace(/<li[^>]*>/gi, '- ')
  text = text.replace(/<[^>]+>/g, ' ')
  text = text.replace(/\r/g, '')
  text = text.replace(/[ \t]+\n/g, '\n')
  text = text.replace(/\n{3,}/g, '\n\n')
  text = text.replace(/[ \t]{2,}/g, ' ')
  text = text.trim()
  if (!text) return '—'
  if (text.length > maxLength) return `${text.slice(0, maxLength - 1).trimEnd()}…`
  return text
}

function formatDate(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? sanitizeText(value, 80) : d.toLocaleString()
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
  return PAGE_MARGIN + 8
}

function addPageHeader(doc: PdfDoc, title: string) {
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i)
    doc.setFillColor(...BRAND.primary)
    doc.rect(0, 0, PAGE_WIDTH, 14, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.text('RunLab Agrimpex', PAGE_MARGIN, 9)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(title, PAGE_WIDTH - PAGE_MARGIN, 9, { align: 'right' })
    doc.setTextColor(0, 0, 0)
  }
}

function addFooter(doc: PdfDoc, generatedAt: string) {
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i)
    doc.setDrawColor(...BRAND.border)
    doc.line(PAGE_MARGIN, PAGE_HEIGHT - 12, PAGE_WIDTH - PAGE_MARGIN, PAGE_HEIGHT - 12)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...BRAND.muted)
    doc.text(`RunLab Agrimpex QA Dashboard · Generado: ${generatedAt}`, PAGE_MARGIN, PAGE_HEIGHT - 8)
    doc.text(`Página ${i}/${pages}`, PAGE_WIDTH - PAGE_MARGIN, PAGE_HEIGHT - 8, { align: 'right' })
    doc.setTextColor(0, 0, 0)
  }
}

function addSectionTitle(doc: PdfDoc, text: string, y: number): number {
  let yy = ensureSpace(doc, y, 14)
  doc.setFillColor(241, 245, 249)
  doc.rect(PAGE_MARGIN, yy - 5, CONTENT_WIDTH, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...BRAND.primary)
  doc.text(text, PAGE_MARGIN + 2, yy)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  return yy + 9
}

function addKeyValue(doc: PdfDoc, label: string, value: string, y: number): number {
  const yy = ensureSpace(doc, y, 8)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...BRAND.muted)
  doc.text(`${label}:`, PAGE_MARGIN, yy)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(30, 41, 59)
  const lines = doc.splitTextToSize(sanitizeText(value, 220), CONTENT_WIDTH - 42)
  doc.text(lines, PAGE_MARGIN + 40, yy)
  doc.setTextColor(0, 0, 0)
  return yy + Math.max(6, lines.length * 4.8)
}

function tableDefaults() {
  return {
    theme: 'grid' as const,
    styles: {
      font: 'helvetica' as const,
      fontSize: 9,
      cellPadding: 2.5,
      textColor: [30, 41, 59] as [number, number, number],
      lineColor: BRAND.border,
      lineWidth: 0.2,
      overflow: 'linebreak' as const,
      valign: 'middle' as const,
    },
    headStyles: {
      fillColor: BRAND.primary,
      textColor: [255, 255, 255] as [number, number, number],
      fontStyle: 'bold' as const,
      lineColor: BRAND.primary,
    },
    alternateRowStyles: {
      fillColor: BRAND.zebra,
    },
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
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
          ? sanitizeText(p.label, 24)
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
      file: sanitizeText(r.file ?? r.name ?? '—', 120),
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
      id: sanitizeText(r.id, 120),
      timestamp: typeof r.timestamp === 'string' ? r.timestamp : undefined,
      summary: r.summary && typeof r.summary === 'object' ? (r.summary as ReportSummary) : undefined,
      status: typeof r.status === 'string' ? r.status : undefined,
    }))
}

async function fetchImageDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
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

function drawImagePlaceholder(doc: PdfDoc, x: number, y: number, w: number, h: number, label: string) {
  doc.setDrawColor(...BRAND.border)
  doc.setFillColor(248, 250, 252)
  doc.rect(x, y, w, h, 'FD')
  doc.setDrawColor(...BRAND.muted)
  doc.line(x + w / 2 - 6, y + h / 2 - 4, x + w / 2 + 6, y + h / 2 - 4)
  doc.line(x + w / 2 - 6, y + h / 2 - 4, x + w / 2 - 6, y + h / 2 + 6)
  doc.line(x + w / 2 + 6, y + h / 2 - 4, x + w / 2 + 6, y + h / 2 + 6)
  doc.line(x + w / 2 - 6, y + h / 2 + 6, x + w / 2 + 6, y + h / 2 + 6)
  doc.line(x + w / 2 - 6, y + h / 2 + 6, x + w / 2 + 6, y + h / 2 - 4)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...BRAND.muted)
  doc.text(sanitizeText(label, 60), x + w / 2, y + h - 4, { align: 'center' })
  doc.setTextColor(0, 0, 0)
}

function drawTrendChart(doc: PdfDoc, timeline: ReportAnalyticsTimelinePoint[], y: number): number {
  if (timeline.length === 0) return y
  let yy = ensureSpace(doc, y, 75)
  yy = addSectionTitle(doc, 'Tendencia', yy)
  const left = PAGE_MARGIN
  const top = yy
  const width = CONTENT_WIDTH
  const height = 45
  const max = Math.max(
    1,
    ...timeline.map((p) => asNumber(p.passed) + asNumber(p.failed) + asNumber(p.errors))
  )

  doc.setDrawColor(...BRAND.border)
  doc.setFillColor(255, 255, 255)
  doc.rect(left, top, width, height, 'FD')
  const points = timeline.slice(-12)
  const barGap = 2
  const barWidth = Math.max(4, (width - barGap * (points.length + 1)) / points.length)

  points.forEach((p, i) => {
    const passed = asNumber(p.passed)
    const failed = asNumber(p.failed) + asNumber(p.errors)
    const x = left + barGap + i * (barWidth + barGap)
    const passedH = (passed / max) * (height - 8)
    const failedH = (failed / max) * (height - 8)
    const baseY = top + height - 3
    if (passedH > 0) {
      doc.setFillColor(...BRAND.success)
      doc.rect(x, baseY - passedH, barWidth, passedH, 'F')
    }
    if (failedH > 0) {
      doc.setFillColor(...BRAND.danger)
      doc.rect(x, baseY - passedH - failedH, barWidth, failedH, 'F')
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6)
    doc.setTextColor(...BRAND.muted)
    const label = sanitizeText(p.label || '', 6)
    doc.text(label, x + barWidth / 2, top + height + 4, { align: 'center' })
  })

  doc.setFontSize(8)
  doc.setTextColor(30, 41, 59)
  doc.setFillColor(...BRAND.success)
  doc.rect(left, top + height + 8, 3, 3, 'F')
  doc.text('Pasados', left + 5, top + height + 10.5)
  doc.setFillColor(...BRAND.danger)
  doc.rect(left + 28, top + height + 8, 3, 3, 'F')
  doc.text('Fallidos/Errores', left + 33, top + height + 10.5)
  doc.setTextColor(0, 0, 0)
  return top + height + 18
}

function drawCover(doc: PdfDoc, title: string, subtitle: string, rows: Array<[string, string]>) {
  doc.setFillColor(...BRAND.primary)
  doc.rect(0, 0, PAGE_WIDTH, 42, 'F')
  doc.setFillColor(...BRAND.accent)
  doc.rect(0, 42, PAGE_WIDTH, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(255, 255, 255)
  doc.text('RunLab Agrimpex', PAGE_MARGIN, 18)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'normal')
  doc.text(title, PAGE_MARGIN, 28)
  doc.setFontSize(9)
  doc.setTextColor(203, 213, 225)
  doc.text(subtitle, PAGE_MARGIN, 35)
  doc.setTextColor(0, 0, 0)

  autoTable(doc, {
    startY: 54,
    head: [['Campo', 'Valor']],
    body: rows.map(([k, v]) => [k, sanitizeText(v, 180)]),
    ...tableDefaults(),
    columnStyles: { 0: { cellWidth: 45, fontStyle: 'bold' }, 1: { cellWidth: CONTENT_WIDTH - 45 } },
  })

  const y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 54
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...BRAND.muted)
  doc.text('Documento generado automáticamente por RunLab Agrimpex QA Dashboard.', PAGE_MARGIN, y + 12)
  doc.setTextColor(0, 0, 0)
  return y + 18
}

export async function generateRunPdf(
  payload: ReportRunExportPayload,
  options: GenerateOptions = {}
): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const sections = normalizeSections(options.sections, RUN_PDF_SECTIONS)
  const generatedAt = formatDate(payload.generatedAt || new Date().toISOString())
  let y = PAGE_MARGIN + 8

  if (sections.includes('cover')) {
    y = drawCover(doc, 'Reporte integral de corrida', 'Detalle de ejecución, resultados y evidencias', [
      ['Reporte', payload.report?.id || '—'],
      ['Perfil', payload.profile?.name || payload.profile?.id || '—'],
      ['Fecha corrida', formatDate(payload.report?.timestamp)],
      ['Generado', generatedAt],
    ])
  }

  if (sections.includes('summary')) {
    y = ensureSpace(doc, y, 40)
    y = addSectionTitle(doc, 'Resumen ejecutivo', y)
    autoTable(doc, {
      startY: y,
      head: [['Métrica', 'Valor']],
      body: summaryRows(payload.summary),
      ...tableDefaults(),
      columnStyles: { 0: { cellWidth: 90, fontStyle: 'bold' }, 1: { cellWidth: CONTENT_WIDTH - 90 } },
    })
    y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y
    y += 8
  }

  if (sections.includes('tests')) {
    y = ensureSpace(doc, y, 30)
    y = addSectionTitle(doc, 'Resultados por test', y)
    const tests = Array.isArray(payload.tests) ? payload.tests : []
    if (tests.length === 0) {
      doc.setFontSize(10)
      doc.setTextColor(...BRAND.muted)
      doc.text('No hay resultados de tests.', PAGE_MARGIN, y)
      doc.setTextColor(0, 0, 0)
      y += 8
    } else {
      autoTable(doc, {
        startY: y,
        head: [['Test', 'Estado', 'Duración', 'Error / salida']],
        body: tests.map((t) => [
          sanitizeText(t.id, 160),
          sanitizeText(t.status, 30),
          formatDuration(t.duration),
          sanitizeText(t.errorMsg || t.output || '—', 500),
        ]),
        ...tableDefaults(),
        styles: { ...tableDefaults().styles, fontSize: 8, valign: 'top' },
        columnStyles: {
          0: { cellWidth: 58 },
          1: { cellWidth: 20 },
          2: { cellWidth: 20 },
          3: { cellWidth: CONTENT_WIDTH - 98 },
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 1) {
            const status = String(data.cell.raw || '').toLowerCase()
            if (status.includes('pass')) data.cell.styles.textColor = BRAND.success
            if (status.includes('fail') || status.includes('error')) data.cell.styles.textColor = BRAND.danger
            data.cell.styles.fontStyle = 'bold'
          }
        },
      })
      y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y
      y += 8
    }
  }

  if (sections.includes('evidence')) {
    y = ensureSpace(doc, y, 30)
    y = addSectionTitle(doc, 'Evidencias', y)
    const tests = Array.isArray(payload.tests) ? payload.tests : []
    const allAttachments = tests.flatMap((t) =>
      (t.attachments ?? []).map((a) => ({ ...a, testId: t.id }))
    )

    if (allAttachments.length === 0) {
      doc.setFontSize(10)
      doc.setTextColor(...BRAND.muted)
      doc.text('No hay evidencias adjuntas.', PAGE_MARGIN, y)
      doc.setTextColor(0, 0, 0)
      y += 8
    } else {
      for (const att of allAttachments) {
        y = ensureSpace(doc, y, 58)
        const label = `${sanitizeText(att.testId, 80)} — ${sanitizeText(att.name || att.path || att.assetPath || 'adjunto', 80)}`
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(51, 65, 85)
        doc.text(doc.splitTextToSize(label, CONTENT_WIDTH), PAGE_MARGIN, y)
        doc.setTextColor(0, 0, 0)
        y += 4

        const isImage =
          String(att.kind || att.contentType || '').toLowerCase().includes('image') ||
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
              const fmt = dataUrl.includes('image/jpeg') || dataUrl.includes('image/jpg') ? 'JPEG' : 'PNG'
              doc.addImage(dataUrl, fmt, PAGE_MARGIN, y, 90, 50, undefined, 'FAST')
              y += 54
            } catch {
              drawImagePlaceholder(doc, PAGE_MARGIN, y, 90, 50, 'Sin evidencia disponible')
              y += 54
            }
          } else {
            drawImagePlaceholder(doc, PAGE_MARGIN, y, 90, 50, 'Sin evidencia')
            y += 54
          }
        } else {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          doc.setTextColor(...BRAND.muted)
          doc.text(
            doc.splitTextToSize(
              `Adjunto no imagen: ${sanitizeText(att.contentType || att.path || att.assetPath || att.name || '—', 120)}`,
              CONTENT_WIDTH
            ),
            PAGE_MARGIN,
            y
          )
          doc.setTextColor(0, 0, 0)
          y += 8
        }
      }
    }
  }

  addPageHeader(doc, 'Reporte integral de corrida')
  if (sections.includes('footer')) addFooter(doc, generatedAt)
  return doc.output('blob')
}

export async function generateAnalyticsPdf(
  payload: ReportAnalyticsExportPayload,
  options: GenerateOptions = {}
): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const sections = normalizeSections(options.sections, ANALYTICS_PDF_SECTIONS)
  const generatedAt = formatDate(payload.generatedAt || new Date().toISOString())
  let y = PAGE_MARGIN + 8

  const timeline = normalizeTimeline(payload.timeline ?? payload.summary?.timeline)
  const byFile = normalizeByFile(payload.byFile ?? payload.summary?.byFile)
  const recentRuns = normalizeRecentRuns(payload.recentRuns)

  if (sections.includes('cover')) {
    y = drawCover(doc, 'Reporte analítico integral', 'KPIs, tendencias y desglose agregado de ejecuciones', [
      ['Perfil', payload.profile?.name || payload.profile?.id || '—'],
      ['Generado', generatedAt],
      ['Alcance', 'Analítica agregada de reportes'],
    ])
  }

  if (sections.includes('kpis')) {
    y = ensureSpace(doc, y, 45)
    y = addSectionTitle(doc, 'KPIs', y)
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
      ...tableDefaults(),
      columnStyles: { 0: { cellWidth: 100, fontStyle: 'bold' }, 1: { cellWidth: CONTENT_WIDTH - 100 } },
    })
    y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y
    y += 8
  }

  if (sections.includes('trend')) {
    if (timeline.length > 0) {
      y = drawTrendChart(doc, timeline, y)
    } else {
      y = ensureSpace(doc, y, 12)
      y = addSectionTitle(doc, 'Tendencia', y)
      doc.setFontSize(10)
      doc.setTextColor(...BRAND.muted)
      doc.text('No hay datos de tendencia disponibles.', PAGE_MARGIN, y)
      doc.setTextColor(0, 0, 0)
      y += 8
    }
  }

  if (sections.includes('byFile')) {
    y = ensureSpace(doc, y, 30)
    y = addSectionTitle(doc, 'Desglose por archivo', y)
    if (byFile.length === 0) {
      doc.setFontSize(10)
      doc.setTextColor(...BRAND.muted)
      doc.text('No hay desglose por archivo disponible.', PAGE_MARGIN, y)
      doc.setTextColor(0, 0, 0)
      y += 8
    } else {
      autoTable(doc, {
        startY: y,
        head: [['Archivo', 'Total', 'Pasados', 'Fallidos', 'Errores', 'Omitidos']],
        body: byFile.map((r) => [
          sanitizeText(r.file ?? r.name ?? '—', 100),
          String(asNumber(r.total)),
          String(asNumber(r.passed)),
          String(asNumber(r.failed)),
          String(asNumber(r.errors)),
          String(asNumber(r.skipped)),
        ]),
        ...tableDefaults(),
        styles: { ...tableDefaults().styles, fontSize: 8 },
        columnStyles: { 0: { cellWidth: 72 } },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 3) {
            if (asNumber(data.cell.raw) > 0) data.cell.styles.textColor = BRAND.danger
          }
          if (data.section === 'body' && data.column.index === 2) {
            if (asNumber(data.cell.raw) > 0) data.cell.styles.textColor = BRAND.success
          }
        },
      })
      y = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y
      y += 8
    }
  }

  if (sections.includes('recentRuns')) {
    y = ensureSpace(doc, y, 30)
    y = addSectionTitle(doc, 'Corridas recientes', y)
    if (recentRuns.length === 0) {
      doc.setFontSize(10)
      doc.setTextColor(...BRAND.muted)
      doc.text('No hay corridas recientes disponibles.', PAGE_MARGIN, y)
      doc.setTextColor(0, 0, 0)
    } else {
      autoTable(doc, {
        startY: y,
        head: [['ID', 'Fecha', 'Total', 'Pasados', 'Fallidos']],
        body: recentRuns.slice(0, 20).map((r) => {
          const summary = r.summary
          const failed = asNumber(summary?.failed) + asNumber(summary?.errors)
          return [
            sanitizeText(r.id, 80),
            formatDate(r.timestamp),
            String(asNumber(summary?.total)),
            String(asNumber(summary?.passed)),
            String(failed),
          ]
        }),
        ...tableDefaults(),
        styles: { ...tableDefaults().styles, fontSize: 8 },
        columnStyles: { 0: { cellWidth: 60 } },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 4) {
            if (asNumber(data.cell.raw) > 0) data.cell.styles.textColor = BRAND.danger
          }
          if (data.section === 'body' && data.column.index === 3) {
            if (asNumber(data.cell.raw) > 0) data.cell.styles.textColor = BRAND.success
          }
        },
      })
    }
  }

  addPageHeader(doc, 'Reporte analítico integral')
  if (sections.includes('footer')) addFooter(doc, generatedAt)
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
