import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchImageAsDataUrl } from '../fetchImageAsDataUrl'

describe('fetchImageAsDataUrl', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns null on non-ok response (404)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 404 } as Response)
    const result = await fetchImageAsDataUrl('https://example.com/missing.png')
    expect(result).toBeNull()
  })

  it('returns null on non-ok response (500)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 500 } as Response)
    const result = await fetchImageAsDataUrl('https://example.com/error.png')
    expect(result).toBeNull()
  })

  it('returns null on network error', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const result = await fetchImageAsDataUrl('https://example.com/image.png')
    expect(result).toBeNull()
  })

  it('returns null on abort (CORS timeout)', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'))
    const result = await fetchImageAsDataUrl('https://example.com/cors-blocked.png')
    expect(result).toBeNull()
  })

  it('passes cors mode to fetch', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('irrelevant'))
    await fetchImageAsDataUrl('https://example.com/image.png')
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      'https://example.com/image.png',
      expect.objectContaining({ mode: 'cors' })
    )
  })

  it('returns a data URL string on successful fetch', async () => {
    const imageBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]) // PNG header
    const blob = new Blob([imageBytes], { type: 'image/png' })
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(blob),
    } as Response)

    const result = await fetchImageAsDataUrl('https://example.com/image.png')
    expect(result).toMatch(/^data:image\/png;base64,/)
  })
})
