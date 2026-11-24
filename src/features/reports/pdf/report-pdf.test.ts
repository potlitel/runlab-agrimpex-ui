import jsPDF from 'jspdf'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReportAnalyticsExportPayload, ReportRunExportPayload } from '@/types/contract'
import {
  ANALYTICS_PDF_SECTIONS,
  IMAGE_FETCH_TIMEOUT_MS,
  RUN_PDF_SECTIONS,
  generateAnalyticsPdf,
  generateRunPdf,
} from './report-pdf'

const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

function pngBytes(): Uint8Array {
  const binary = atob(PNG_BASE64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function gifBytes(): Uint8Array {
  const binary = atob('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function webpBytes(width = 16, height = 9): Uint8Array {
  const bytes = new Uint8Array(30)
  bytes.set([0x52, 0x49, 0x46, 0x46, 0x1a, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])
  bytes.set([0x56, 0x50, 0x38, 0x58, 0x0a, 0, 0, 0], 12)
  bytes[24] = (width - 1) & 0xff
  bytes[25] = ((width - 1) >> 8) & 0xff
  bytes[26] = ((width - 1) >> 16) & 0xff
  bytes[27] = (height - 1) & 0xff
  bytes[28] = ((height - 1) >> 8) & 0xff
  bytes[29] = ((height - 1) >> 16) & 0xff
  return bytes
}

function runPayload(
  attachment: Record<string, unknown> = {},
): ReportRunExportPayload {
  return {
    type: 'run',
    report: { id: 'run-evidence' },
    summary: { total: 1, passed: 1, failed: 0 },
    tests: [
      {
        id: 'tests/desaduanes.spec.ts::crear registro',
        status: 'passed',
        attachments: [
          {
            name: 'screenshot-crear-registro.png',
            kind: 'image',
            contentType: 'image/png',
            assetPath: 'attachments/screenshot-crear-registro.png',
            ...attachment,
          },
        ],
      },
    ],
  }
}

function stubFetch(bytes: Uint8Array, contentType: string) {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    blob: async () => new Blob([bytes as BlobPart], { type: contentType }),
    headers: { get: () => contentType },
  }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

type AddImageArgs = [data: string, format: string, x: number, y: number, w: number, h: number]

function spyAddImage() {
  const api = (jsPDF as unknown as {
    API: { addImage: (...args: AddImageArgs) => void }
  }).API
  return vi.spyOn(api, 'addImage')
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('report-pdf', () => {
  it('genera un PDF válido para corrida mínima', async () => {
    const blob = await generateRunPdf({
      type: 'run',
      report: { id: 'run-1', timestamp: '2026-11-23T10:00:00Z' },
      profile: { id: 'p1', name: 'Perfil QA' },
      summary: { total: 2, passed: 1, failed: 1, skipped: 0, duration: 12.3 },
      tests: [
        {
          id: 'tests/a.spec.ts::login',
          status: 'passed',
          duration: 1.2,
          output: 'ok',
          attachments: [],
        },
        {
          id: 'tests/a.spec.ts::checkout',
          status: 'failed',
          duration: 2.1,
          errorMsg: 'Expected true',
          attachments: [
            {
              name: 'note.txt',
              contentType: 'text/plain',
              path: 'note.txt',
              kind: 'other',
            },
          ],
        },
      ],
    })

    expect(blob).toBeInstanceOf(Blob)
    expect(blob.size).toBeGreaterThan(1000)
    expect(blob.type).toContain('pdf')
  })

  it('genera un PDF analítico con tendencia/byFile normalizados', async () => {
    const blob = await generateAnalyticsPdf({
      type: 'analytics',
      profile: { name: 'Perfil QA' },
      summary: {
        totalRuns: 3,
        totalExecutions: 30,
        totalPassed: 25,
        totalFailed: 5,
        passRate: 83.3,
        avgDuration: 45,
        totalAvailable: 10,
        uniqueExecuted: 10,
        uniquePassed: 8,
        uniqueFailed: 2,
        neverExecuted: 0,
        byFile: [],
        timeline: [],
      },
      timeline: [
        { timestamp: '2026-11-20T10:00:00Z', passed: 8, failed: 2 },
        { timestamp: '2026-11-21T10:00:00Z', passed: 9, failed: 1 },
      ],
      byFile: [{ file: 'tests/a.spec.ts', total: 10, passed: 8, failed: 2 }],
      recentRuns: [
        {
          id: 'run-1',
          timestamp: '2026-11-21T10:00:00Z',
          summary: { total: 10, passed: 9, failed: 1 },
        },
      ],
    })

    expect(blob).toBeInstanceOf(Blob)
    expect(blob.size).toBeGreaterThan(1000)
  })

  it('expone secciones por defecto', () => {
    expect(RUN_PDF_SECTIONS).toContain('cover')
    expect(RUN_PDF_SECTIONS).toContain('evidence')
    expect(ANALYTICS_PDF_SECTIONS).toContain('trend')
    expect(ANALYTICS_PDF_SECTIONS).toContain('recentRuns')
  })

  it('no falla con evidencias faltantes o adjuntos no imagen', async () => {
    const blob = await generateRunPdf({
      type: 'run',
      report: { id: 'run-2' },
      summary: { total: 1, passed: 0, failed: 1 },
      tests: [
        {
          id: 't1',
          status: 'failed',
          attachments: [
            { name: 'video.webm', contentType: 'video/webm', path: 'a.webm', kind: 'other' },
            { name: 'missing.png', contentType: 'image/png', assetPath: 'missing.png', kind: 'image' },
          ],
        },
      ],
    })
    expect(blob.size).toBeGreaterThan(1000)
  })

  it('normaliza timeline/byFile malformados sin romper', async () => {
    const blob = await generateAnalyticsPdf({
      type: 'analytics',
      summary: {
        totalRuns: 1,
        totalExecutions: 1,
        totalPassed: 1,
        totalFailed: 0,
        passRate: 100,
        avgDuration: 1,
        totalAvailable: null,
        uniqueExecuted: 1,
        uniquePassed: 1,
        uniqueFailed: 0,
        neverExecuted: null,
        byFile: [],
        timeline: [],
      },
      timeline: [null, { timestamp: 'bad-date', passed: '2', failed: undefined }] as unknown as ReportAnalyticsExportPayload['timeline'],
      byFile: [null, { name: 'x.spec.ts', total: '3', passed: 2, failed: 1 }] as unknown as ReportAnalyticsExportPayload['byFile'],
      recentRuns: [null, { id: 'r1', summary: { total: 3, passed: 2, failed: 1 } }] as unknown as ReportAnalyticsExportPayload['recentRuns'],
    })
    expect(blob.size).toBeGreaterThan(1000)
  })
})

describe('report-pdf — fidelidad de capturas', () => {
  it('ajusta un PNG a sus dimensiones reales y no dibuja el placeholder', async () => {
    const addImage = spyAddImage()
    const fetchMock = stubFetch(pngBytes(), 'image/png')

    const blob = await generateRunPdf(runPayload({ width: 1280, height: 720 }))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(addImage).toHaveBeenCalledTimes(1)
    const call = addImage.mock.calls[0]!
    expect(call[1]).toBe('PNG')
    expect(call[2]).toBe(20)
    expect(call[3]).toBeGreaterThan(20)
    expect(call[4]).toBeCloseTo(142.22, 1)
    expect(call[5]).toBeCloseTo(80, 1)
    expect(await blob.text()).not.toContain('Sin evidencia')
  })

  it('respeta retratos con un recuadro alto y estrecho', async () => {
    const addImage = spyAddImage()
    stubFetch(pngBytes(), 'image/png')

    await generateRunPdf(runPayload({ width: 720, height: 1280 }))

    const call = addImage.mock.calls[0]!
    expect(call[4]).toBeCloseTo(45, 1)
    expect(call[5]).toBeCloseTo(80, 1)
  })

  it('convierte WebP a PNG antes de incrustarlo', async () => {
    const addImage = spyAddImage()
    stubFetch(webpBytes(), 'image/webp')
    vi.stubGlobal(
      'Image',
      class {
        naturalWidth = 16
        naturalHeight = 9
        width = 16
        height = 9
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        set src(_value: string) {
          this.onload?.()
        }
      },
    )
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
      `data:image/png;base64,${PNG_BASE64}`,
    )

    const blob = await generateRunPdf(
      runPayload({
        name: 'captura.webp',
        contentType: 'image/webp',
        assetPath: 'attachments/captura.webp',
        width: 16,
        height: 9,
      }),
    )

    expect(addImage).toHaveBeenCalledTimes(1)
    const call = addImage.mock.calls[0]!
    expect(call[0]).toContain('data:image/png;base64')
    expect(call[1]).toBe('PNG')
    expect(call[4]).toBeCloseTo(142.22, 1)
    expect(call[5]).toBeCloseTo(80, 1)
    expect(blob.size).toBeGreaterThan(1000)
  })

  it('aborta la descarga del asset cuando supera el timeout sin romper el PDF', async () => {
    vi.useFakeTimers()
    const addImage = spyAddImage()
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('abortada')))
        }),
      ),
    )

    const pending = generateRunPdf(runPayload({ width: 1280, height: 720 }))
    await vi.advanceTimersByTimeAsync(IMAGE_FETCH_TIMEOUT_MS)
    const blob = await pending

    expect(addImage).not.toHaveBeenCalled()
    expect(blob.size).toBeGreaterThan(1000)
  })

  it('usa assetUrl directamente cuando el adjunto no tiene assetPath', async () => {
    const addImage = spyAddImage()
    const fetchMock = stubFetch(pngBytes(), 'image/png')

    await generateRunPdf(
      runPayload({
        assetPath: undefined,
        assetUrl: 'https://cdn.example.com/evidencias/captura.png',
        width: 1280,
        height: 720,
      }),
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'https://cdn.example.com/evidencias/captura.png',
      expect.anything(),
    )
    expect(addImage).toHaveBeenCalledTimes(1)
  })

  it('marca el adjunto sin assetPath ni assetUrl sin intentar descargarlo', async () => {
    const addImage = spyAddImage()
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const blob = await generateRunPdf(
      runPayload({ assetPath: undefined, assetUrl: undefined, name: 'captura-local.png' }),
    )

    expect(fetchMock).not.toHaveBeenCalled()
    expect(addImage).not.toHaveBeenCalled()
    expect(await blob.text()).toContain('referencia no disponible')
    expect(blob.size).toBeGreaterThan(1000)
  })

  it('respeta formatos distintos de PNG/JPEG con GIF', async () => {
    const addImage = spyAddImage()
    stubFetch(gifBytes(), 'image/gif')

    await generateRunPdf(runPayload({ width: 16, height: 9 }))

    expect(addImage).toHaveBeenCalledTimes(1)
    expect(addImage.mock.calls[0]![1]).toBe('GIF')
  })

  it('señala la referencia faltante y continúa con la exportación', async () => {
    const addImage = spyAddImage()
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })))

    const blob = await generateRunPdf(
      runPayload({
        assetPath: 'attachments/captura-inexistente.jpg',
        name: 'captura-inexistente.jpg',
        width: 1280,
        height: 720,
      }),
    )

    expect(addImage).not.toHaveBeenCalled()
    const text = await blob.text()
    expect(text).toContain('referencia no disponible')
    expect(text).toContain('captura-inexistente.jpg')
    expect(blob.size).toBeGreaterThan(1000)
  })
})
