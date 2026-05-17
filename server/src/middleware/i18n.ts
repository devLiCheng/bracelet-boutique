import type { Context, Next } from 'hono';
import type { Lang } from '../i18n/translations';

export const i18nMiddleware = async (c: Context, next: Next) => {
  // Detect language from cookie, query param, or Accept-Language header
  const cookieLang = c.req.cookie?.('lang') as Lang | undefined;
  const queryLang = c.req.query('lang') as Lang | undefined;
  const headerLang = c.req.header('Accept-Language')?.startsWith('zh') ? 'zh' : 'en';

  const lang: Lang = cookieLang || queryLang || headerLang || 'zh';

  c.set('lang', lang);
  await next();
};
