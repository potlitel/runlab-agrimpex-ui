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
  const yy = ensureSpace(doc, y, 14)
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

/** Tiempo máximo esperando el asset y la decodificación de imágenes convertidas. */
export const IMAGE_FETCH_TIMEOUT_MS = 15_000
export const IMAGE_LOAD_TIMEOUT_MS = 10_000

const MAX_IMAGE_WIDTH = 150
const MAX_IMAGE_HEIGHT = 80

type PdfImageFormat = 'PNG' | 'JPEG' | 'GIF' | 'BMP'
type ImageBytes = Uint8Array

function bytesFromDataUrl(dataUrl: string): ImageBytes | null {
  const match = /^data:([^;,]*)(;base64)?,([\s\S]*)$/.exec(dataUrl)
  if (!match) return null
  try {
    if (match[2]) {
      const binary = atob(match[3])
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
      return bytes
    }
    return new TextEncoder().encode(decodeURIComponent(match[3]))
  } catch {
    return null
  }
}

function hex(bytes: ImageBytes, from: number, to: number): string {
  return Array.from(bytes.slice(from, to))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function detectImageFormat(bytes: ImageBytes | null, contentType?: string | null): PdfImageFormat | 'WEBP' | null {
  const head = bytes ? hex(bytes, 0, 12) : ''
  if (head.startsWith('89504e470d0a1a0a')) return 'PNG'
  if (head.startsWith('ffd8ff')) return 'JPEG'
  if (head.startsWith('52494646') && head.slice(16, 24) === '57454250') return 'WEBP'
  if (head.startsWith('47494638')) return 'GIF'
  if (head.startsWith('424d')) return 'BMP'

  const mime = String(contentType || '').split(';')[0]!.trim().toLowerCase()
  if (mime === 'image/png') return 'PNG'
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'JPEG'
  if (mime === 'image/webp') return 'WEBP'
  if (mime === 'image/gif') return 'GIF'
  if (mime === 'image/bmp') return 'BMP'
  return null
}

function dimensionsFromBytes(bytes: ImageBytes, format: PdfImageFormat | 'WEBP') {
  if (format === 'PNG' && bytes.length >= 24) {
    const width = (bytes[16]! << 24) | (bytes[17]! << 16) | (bytes[18]! << 8) | bytes[19]!
    const height = (bytes[20]! << 24) | (bytes[21]! << 16) | (bytes[22]! << 8) | bytes[23]!
    return width > 0 && height > 0 ? { width, height } : null
  }
  if (format === 'JPEG') {
    let offset = 2
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset += 1
        continue
      }
      let marker = bytes[offset + 1]!
      while (marker === 0xff) {
        offset += 1
        marker = bytes[offset + 1]!
      }
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2
        continue
      }
      if (marker === 0xd9 || marker === 0xda) break
      const segmentLength = (bytes[offset + 2]! << 8) | bytes[offset + 3]!
      const isSof =
        marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
      if (isSof && offset + 8 < bytes.length) {
        const height = (bytes[offset + 5]! << 8) | bytes[offset + 6]!
        const width = (bytes[offset + 7]! << 8) | bytes[offset + 8]!
        return width > 0 && height > 0 ? { width, height } : null
      }
      offset += 2 + segmentLength
    }
    return null
  }
  if (format === 'WEBP' && bytes.length >= 30) {
    const chunk = String.fromCharCode(...bytes.slice(12, 16))
    if (chunk === 'VP8X' && bytes.length >= 30) {
      const width = 1 + bytes[24]! + (bytes[25]! << 8) + (bytes[26]! << 16)
      const height = 1 + bytes[27]! + (bytes[28]! << 8) + (bytes[29]! << 16)
      return { width, height }
    }
    if (chunk === 'VP8L' && bytes.length >= 25) {
      const bits = bytes[21]! | (bytes[22]! << 8) | (bytes[23]! << 16) | (bytes[24]! << 24)
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
    }
    if (chunk === 'VP8 ' && bytes.length >= 30) {
      const width = bytes[26]! | ((bytes[27]! & 0x3f) << 8)
      const height = bytes[28]! | ((bytes[29]! & 0x3f) << 8)
      return { width, height }
    }
    return null
  }
  if (format === 'GIF' && bytes.length >= 10) {
    return { width: bytes[6]! | (bytes[7]! << 8), height: bytes[8]! | (bytes[9]! << 8) }
  }
  if (format === 'BMP' && bytes.length >= 26) {
    return {
      width: Math.abs(bytes[18]! | (bytes[19]! << 8) | (bytes[20]! << 16) | (bytes[21]! << 24)),
      height: Math.abs(bytes[22]! | (bytes[23]! << 8) | (bytes[24]! << 16) | (bytes[25]! << 24)),
    }
  }
  return null
}

function resolveDimensions(
  metaWidth: unknown,
  metaHeight: unknown,
  bytes: ImageBytes | null,
  format: PdfImageFormat | 'WEBP' | null
) {
  const width = asNumber(metaWidth, 0)
  const height = asNumber(metaHeight, 0)
  if (width > 0 && height > 0) return { width, height }
  return bytes && format ? dimensionsFromBytes(bytes, format) : null
}

function fitImageBox(width: number, height: number) {
  const scale = Math.min(MAX_IMAGE_WIDTH / width, MAX_IMAGE_HEIGHT / height)
  return { w: width * scale, h: height * scale }
}

function convertWebpToPng(dataUrl: string, width = 0, height = 0): Promise<string | null> {
  if (typeof Image === 'undefined' || typeof document === 'undefined') return Promise.resolve(null)
  return new Promise((resolve) => {
    let settled = false
    const finish = (value: string | null) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(value)
    }
    const timer = setTimeout(() => finish(null), IMAGE_LOAD_TIMEOUT_MS)
    try {
      const image = new Image()
      image.onload = () => {
        try {
          const realWidth = image.naturalWidth || image.width || width
          const realHeight = image.naturalHeight || image.height || height
          if (!realWidth || !realHeight) return finish(null)
          const canvas = document.createElement('canvas')
          canvas.width = realWidth
          canvas.height = realHeight
          const context = canvas.getContext('2d')
          if (!context) return finish(null)
          context.drawImage(image, 0, 0, realWidth, realHeight)
          finish(canvas.toDataURL('image/png'))
        } catch {
          finish(null)
        }
      }
      image.onerror = () => finish(null)
      image.src = dataUrl
    } catch {
      finish(null)
    }
  })
}

type FetchedImage = { dataUrl: string; contentType: string | null }

async function fetchImageDataUrl(url: string): Promise<FetchedImage | null> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = controller ? setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS) : undefined
  try {
    const res = await fetch(url, controller ? { signal: controller.signal } : undefined)
    if (!res.ok) return null
    const blob = await res.blob()
    const contentType = res.headers?.get?.('content-type') || blob.type || null
    if (contentType && !contentType.startsWith('image/')) return null
    let dataUrl: string | null = null
    if (typeof FileReader !== 'undefined') {
      dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(blob)
      })
    } else {
      const bytes = new Uint8Array(await blob.arrayBuffer())
      let binary = ''
      for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!)
      const b64 = typeof btoa === 'function' ? btoa(binary) : ''
      dataUrl = b64 ? `data:${contentType || 'image/png'};base64,${b64}` : null
    }
    return dataUrl ? { dataUrl, contentType } : null
  } catch {
    return null
  } finally {
    if (timer) clearTimeout(timer)
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
    } else {
      for (const att of allAttachments) {
        const reference = String(att.assetPath || att.path || att.name || 'adjunto')
        const isImage =
          String(att.kind || att.contentType || '').toLowerCase().includes('image') ||
          /\.(png|jpe?g|gif|webp|bmp)$/i.test(reference)

        if (!isImage) {
          y = ensureSpace(doc, y, 12)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          doc.setTextColor(...BRAND.muted)
          doc.text(
            doc.splitTextToSize(
              `Adjunto no imagen: ${sanitizeText(att.contentType || reference, 120)}`,
              CONTENT_WIDTH
            ),
            PAGE_MARGIN,
            y
          )
          doc.setTextColor(0, 0, 0)
          y += 8
          continue
        }

        const assetUrl =
          att.assetUrl ||
          (att.assetPath && payload.report?.id
            ? reportsApi.assetUrl(payload.report.id, att.assetPath)
            : null)
        const fetched = assetUrl ? await fetchImageDataUrl(assetUrl) : null
        const bytes = fetched ? bytesFromDataUrl(fetched.dataUrl) : null
        const format = fetched ? detectImageFormat(bytes, fetched.contentType) : null
        let dataUrl = fetched?.dataUrl ?? null
        const pdfFormat: PdfImageFormat | null = format === 'WEBP' ? 'PNG' : format
        if (dataUrl && format === 'WEBP') {
          const dimensions = resolveDimensions(att.width, att.height, bytes, format)
          dataUrl = await convertWebpToPng(dataUrl, dimensions?.width, dimensions?.height)
        }

        let box = fitImageBox(16, 9)
        let dimensions: { width: number; height: number } | null = null
        if (dataUrl && pdfFormat) {
          const convertedBytes = bytesFromDataUrl(dataUrl)
          const sourceFormat: PdfImageFormat | 'WEBP' | null = format === 'WEBP' ? 'PNG' : format
          dimensions = resolveDimensions(att.width, att.height, convertedBytes, sourceFormat)
          if (dimensions) box = fitImageBox(dimensions.width, dimensions.height)
        }

        const detail = dimensions
          ? `${Math.round(dimensions.width)}×${Math.round(dimensions.height)} px · ${pdfFormat || 'imagen'}`
          : pdfFormat || 'imagen'
        const label = sanitizeText(
          `${att.testId || ''} — ${att.name || reference} — ${detail}`,
          160
        )
        const labelLines = doc.splitTextToSize(label, CONTENT_WIDTH)
        y = ensureSpace(doc, y, labelLines.length * 3.5 + box.h + 3)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(51, 65, 85)
        doc.text(labelLines, PAGE_MARGIN, y)
        doc.setTextColor(0, 0, 0)
        y += labelLines.length * 3.5 + 1

        if (dataUrl && pdfFormat) {
          try {
            doc.addImage(dataUrl, pdfFormat, PAGE_MARGIN, y, box.w, box.h, undefined, 'FAST')
          } catch {
            drawImagePlaceholder(
              doc,
              PAGE_MARGIN,
              y,
              box.w,
              box.h,
              `Sin evidencia disponible: ${reference}`
            )
          }
        } else {
          const reason = fetched ? 'formato no compatible' : 'referencia no disponible'
          drawImagePlaceholder(doc, PAGE_MARGIN, y, box.w, box.h, `Sin evidencia (${reason}): ${reference}`)
        }
        y += box.h + 4
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
