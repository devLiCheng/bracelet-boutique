import type { Context, Next } from 'hono';

export const compressMiddleware = async (c: Context, next: Next) => {
  await next();

  // Get original response
  const contentType = c.res.headers?.get('content-type') || '';
  const isCompressible = contentType.includes('text/') ||
    contentType.includes('application/json') ||
    contentType.includes('application/javascript') ||
    contentType.includes('application/xml') ||
    contentType.includes('image/svg');

  if (!isCompressible) return;

  // Check if client accepts gzip
  const acceptEncoding = c.req.header('Accept-Encoding') || '';
  const originalBody = c.res._body;

  if (!originalBody || typeof originalBody !== 'string') return;

  // Only compress responses larger than 1KB
  if (originalBody.length < 1024) return;

  if (acceptEncoding.includes('gzip') || acceptEncoding.includes('br')) {
    try {
      const compressed = Bun.gzipSync(new TextEncoder().encode(originalBody));
      c.header('Content-Encoding', 'gzip');
      c.header('Vary', 'Accept-Encoding');
      return c.body(compressed as any, 200);
    } catch (e) {
      // Fall back to uncompressed
    }
  }
};
