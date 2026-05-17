import type { Context, Next } from 'hono';

export const seoMiddleware = async (c: Context, next: Next) => {
  await next();

  // Add SEO headers after response
  const contentType = c.res.headers?.get('content-type');
  if (contentType?.includes('text/html')) {
    // These will be set in the HTML template itself
    c.header('X-Robots-Tag', 'index, follow');
    c.header('X-Content-Type-Options', 'nosniff');
  }
};
