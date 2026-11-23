import { beforeEach, describe, expect, it, vi } from 'vitest'

const buildRunPdfBlobMock = vi.fn()
const buildAnalyticsPdfBlobMock = vi.fn()
const downloadBlobMock = vi.fn()

vi.mock('./export-reports', () => ({
  buildRunPdfBlob: buildRunPdfBlobMock,
  buildAnalyticsPdfBlob: buildAnalyticsPdfBlobMock,
}))

vi.mock('./report-pdf', () => ({
  downloadBlob: downloadBlobMock,
}))

function setNavigator(value: unknown) {
  Object.defineProperty(globalThis, 'navigator', {
    value,
    configurable: true,
    writable: true,
  })
}

function setWindow(value: unknown) {
  Object.defineProperty(globalThis, 'window', {
    value,
    configurable: true,
    writable: true,
  })
}

describe('share-reports', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    buildRunPdfBlobMock.mockResolvedValue({
      blob: new Blob(['pdf'], { type: 'application/pdf' }),
      fileName: 'reporte-run-1.pdf',
      payload: {
        type: 'run',
        report: { id: 'run-1', timestamp: '2026-11-23T10:00:00Z' },
        summary: { total: 3, passed: 2, failed: 1 },
        tests: [],
        profile: { name: 'Perfil QA' },
      },
    })
    setWindow({ open: vi.fn(), location: { href: '' } })
    setNavigator({})
  })

  it('usa Web Share API cuando soporta archivos', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    const canShare = vi.fn().mockReturnValue(true)
    setNavigator({ share, canShare })

    const { shareRunPdf } = await import('./share-reports')
    const result = await shareRunPdf({ channel: 'whatsapp', reportId: 'run-1' })

    expect(result.status).toBe('shared')
    expect(share).toHaveBeenCalledTimes(1)
    expect(downloadBlobMock).not.toHaveBeenCalled()
  })

  it('usa fallback wa.me y descarga PDF cuando no hay soporte de archivos', async () => {
    const open = vi.fn()
    setWindow({ open, location: { href: '' } })
    setNavigator({})

    const { shareRunPdf } = await import('./share-reports')
    const result = await shareRunPdf({ channel: 'whatsapp', reportId: 'run-1' })

    expect(result).toEqual({ status: 'fallback', channel: 'whatsapp', downloaded: true })
    expect(downloadBlobMock).toHaveBeenCalledTimes(1)
    expect(open).toHaveBeenCalledTimes(1)
    expect(String(open.mock.calls[0]?.[0])).toContain('wa.me')
  })

  it('usa fallback mailto y descarga PDF cuando no hay soporte de archivos', async () => {
    const location = { href: '' }
    setWindow({ open: vi.fn(), location })
    setNavigator({ share: vi.fn(), canShare: vi.fn().mockReturnValue(false) })

    const { shareRunPdf } = await import('./share-reports')
    const result = await shareRunPdf({ channel: 'email', reportId: 'run-1' })

    expect(result).toEqual({ status: 'fallback', channel: 'email', downloaded: true })
    expect(downloadBlobMock).toHaveBeenCalledTimes(1)
    expect(location.href).toContain('mailto:')
  })

  it('trata AbortError como cancelación', async () => {
    const abort = Object.assign(new Error('cancelled'), { name: 'AbortError' })
    setNavigator({
      share: vi.fn().mockRejectedValue(abort),
      canShare: vi.fn().mockReturnValue(true),
    })

    const { shareRunPdf } = await import('./share-reports')
    const result = await shareRunPdf({ channel: 'email', reportId: 'run-1' })

    expect(result.status).toBe('cancelled')
  })
})
