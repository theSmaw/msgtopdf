/**
 * Fetches a remote image and returns it as a base64 data URL.
 *
 * Used during MSG→PDF conversion to inline external images from the email body,
 * since html2canvas cannot load cross-origin URLs directly. The data URL is
 * substituted into the rendered HTML so the image appears in the PDF.
 *
 * Returns null if the request fails, times out (8 s), or the server returns
 * a non-OK response — the image is silently omitted from the PDF in those cases.
 */
export async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  // Only fetch over HTTPS to prevent tracking pixels over HTTP and block non-network schemes
  // (file://, data://, javascript:, etc.) from reaching the fetch call.
  if (!url.startsWith('https://')) {
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const resp = await fetch(url, { mode: 'cors', signal: controller.signal });
    if (!resp.ok) {
      return null;
    }
    const blob = await resp.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
