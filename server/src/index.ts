import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { i18nMiddleware } from './middleware/i18n';
import { staticCSS } from './views/static-css';
import { preRenderAllPages, startCacheRebuild, getCachedPage } from './middleware/page-cache';
import api from './routes/api';

const app = new Hono();

// Middleware
app.use('*', i18nMiddleware);

// Static CSS (cached 7 days)
app.get('/static/style.css', (c) => {
  c.header('Content-Type', 'text/css; charset=utf-8');
  c.header('Cache-Control', 'public, max-age=604800, immutable');
  return c.body(staticCSS);
});

// API Routes (dynamic - cart, checkout, contact, etc.)
app.route('/api', api);

// ⚡ PRE-RENDERED PAGE CACHE - serves HTML in <1ms, zero DB queries
app.get('/', async (c) => {
  const lang = c.get('lang') as string;
  const cached = getCachedPage(`/|${lang}`);
  if (cached) {
    c.header('ETag', cached.etag);
    if (c.req.header('If-None-Match') === cached.etag) return new Response(null, { status: 304 });
    c.header('Content-Type', 'text/html; charset=utf-8');
    return c.body(cached.html);
  }
  // Fallback - shouldn't happen after pre-render
  return c.redirect('/?lang=zh');
});

app.get('/shop', async (c) => {
  const lang = c.get('lang') as string;
  const category = c.req.query('category');
  const cacheKey = category ? `/shop?category=${category}|${lang}` : `/shop|${lang}`;
  let cached = getCachedPage(cacheKey);
  // Fallback to all-products shop if category page not found
  if (!cached && category) {
    cached = getCachedPage(`/shop|${lang}`);
  }
  if (cached) {
    c.header('ETag', cached.etag);
    if (c.req.header('If-None-Match') === cached.etag) return new Response(null, { status: 304 });
    c.header('Content-Type', 'text/html; charset=utf-8');
    return c.body(cached.html);
  }
  return c.redirect('/shop?lang=zh');
});

app.get('/product/:slug', async (c) => {
  const lang = c.get('lang') as string;
  const slug = c.req.param('slug');
  const cached = getCachedPage(`/product/${slug}|${lang}`);
  if (cached) {
    c.header('ETag', cached.etag);
    if (c.req.header('If-None-Match') === cached.etag) return new Response(null, { status: 304 });
    c.header('Content-Type', 'text/html; charset=utf-8');
    return c.body(cached.html);
  }
  return c.notFound();
});

app.get('/about', async (c) => {
  const lang = c.get('lang') as string;
  const cached = getCachedPage(`/about|${lang}`);
  if (cached) {
    c.header('ETag', cached.etag);
    if (c.req.header('If-None-Match') === cached.etag) return new Response(null, { status: 304 });
    c.header('Content-Type', 'text/html; charset=utf-8');
    return c.body(cached.html);
  }
  return c.redirect('/about?lang=zh');
});

app.get('/contact', async (c) => {
  const lang = c.get('lang') as string;
  const cached = getCachedPage(`/contact|${lang}`);
  if (cached) {
    c.header('ETag', cached.etag);
    if (c.req.header('If-None-Match') === cached.etag) return new Response(null, { status: 304 });
    c.header('Content-Type', 'text/html; charset=utf-8');
    return c.body(cached.html);
  }
  return c.redirect('/contact?lang=zh');
});

// Cart & Checkout - dynamic (no pre-render, uses client-side JS)
app.get('/cart', async (c) => {
  const lang = c.get('lang') as string;
  const { t } = await import('./i18n/translations');
  const { layout } = await import('./views/layout');
  const _ = (key: string) => t(lang as any, key);
  const html = layout({ lang: lang as any, title: `${_('cart.title')} - ${_('site.name')}`, description: _('cart.title'), currentPath: '/cart', children: `
<div class="c"><div class="bc"><a href="/?lang=${lang}">${_('nav.home')}</a> / <span>${_('cart.title')}</span></div><h1 style="margin-bottom:32px">${_('cart.title')}</h1><div id="ctc"><p>${_('common.loading')}</p></div></div>
<script>
async function lc(){const r=await fetch('/api/cart?session='+localStorage.sid);const d=await r.json();const e=document.getElementById('ctc');if(!d.items.length){e.innerHTML='<div style="text-align:center;padding:60px 0"><p style="font-size:1.2rem">${_('cart.empty')}</p><a href="/shop?lang=${lang}" class="btn ba" style="margin-top:16px">${_('cart.continue_shopping')}</a></div>';return}
let h='<div style="overflow-x:auto"><table class="ct"><thead><tr><th>${_('product.description')}</th><th>${_('cart.quantity')}</th><th>${_('cart.subtotal')}</th><th></th></tr></thead><tbody>';
d.items.forEach(i=>{h+='<tr><td><div class="cp"><img class="cpi" src="'+(i.image_url||'')+'" alt="'+(${lang==="'zh'"}?i.name_zh:i.name_en)+'" width="80" height="80"><div><strong>'+(${lang==="'zh'"}?i.name_zh:i.name_en)+'</strong><br><small>¥'+i.price+'</small></div></div></td><td><input type="number" value="'+i.quantity+'" min="1" style="width:60px;padding:6px" onchange="uc('+i.id+',this.value)" class="fi"></td><td><strong>¥'+(i.price*i.quantity).toFixed(2)+'</strong></td><td><button onclick="rc('+i.id+')" style="background:none;border:none;cursor:pointer;color:#EF4444;font-size:1.2rem">✕</button></td></tr>'});
h+='</tbody></table></div><div style="text-align:right;margin-top:32px;padding:24px;background:var(--s);border-radius:var(--rl);border:1px solid var(--b)"><p style="font-size:1.1rem;margin-bottom:8px">${_('cart.total')}: <strong style="font-size:1.5rem;color:var(--pd)">¥'+d.total.toFixed(2)+'</strong></p><a href="/checkout?lang=${lang}" class="btn ba blg">${_('cart.checkout')}</a></div>';e.innerHTML=h}
async function uc(i,q){await fetch('/api/cart/'+i,{method:'PUT',headers:{'Content-Type':'application/json','X-Session-ID':localStorage.sid},body:JSON.stringify({quantity:parseInt(q)})});lc()}
async function rc(i){await fetch('/api/cart/'+i,{method:'DELETE',headers:{'X-Session-ID':localStorage.sid}});lc()}
lc();
</script>` });
  c.header('Content-Type', 'text/html; charset=utf-8');
  return c.body(html);
});

app.get('/checkout', async (c) => {
  const lang = c.get('lang') as string;
  const { t } = await import('./i18n/translations');
  const { layout } = await import('./views/layout');
  const _ = (key: string) => t(lang as any, key);
  const html = layout({ lang: lang as any, title: `${_('checkout.title')} - ${_('site.name')}`, description: _('checkout.title'), currentPath: '/checkout', children: `
<div class="c"><div class="bc"><a href="/?lang=${lang}">${_('nav.home')}</a> / <span>${_('checkout.title')}</span></div><h1 style="margin-bottom:32px">${_('checkout.title')}</h1>
<div style="display:grid;grid-template-columns:1fr 400px;gap:40px" class="pd"><div class="gc"><h2 style="margin-bottom:24px">${_('checkout.shipping')}</h2>
<form id="cof" onsubmit="(async e=>{e.preventDefault();const f=new FormData(e.target);const b=Object.fromEntries(f.entries());const r=await fetch('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json','X-Session-ID':localStorage.sid},body:JSON.stringify(b)});const d=await r.json();if(d.success){alert('${_('checkout.order_success')}\\n${_('checkout.order_number')}: '+d.order_number);location.href='/?lang=${lang}'}else alert(d.error||'${_('common.error')}')})(event)">
<div class="fm"><label class="fl">${_('checkout.name')} *</label><input type="text" name="name" required class="fi"></div>
<div class="fm"><label class="fl">${_('checkout.phone')} *</label><input type="tel" name="phone" required class="fi"></div>
<div class="fm"><label class="fl">Email *</label><input type="email" name="email" required class="fi"></div>
<div class="fm"><label class="fl">${_('checkout.address')} *</label><input type="text" name="address" required class="fi"></div>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px"><div class="fm"><label class="fl">${_('checkout.city')}</label><input type="text" name="city" class="fi"></div><div class="fm"><label class="fl">${_('checkout.state')}</label><input type="text" name="state" class="fi"></div><div class="fm"><label class="fl">${_('checkout.zip')}</label><input type="text" name="zip" class="fi"></div></div>
<div class="fm"><label class="fl">${_('checkout.notes')}</label><textarea name="notes" rows="3" class="fi"></textarea></div>
<button type="submit" class="btn ba blg" style="width:100%">${_('checkout.place_order')}</button></form></div>
<div><div class="gc"><h3 style="margin-bottom:16px">${_('cart.title')}</h3><div id="os">${_('common.loading')}</div></div></div></div></div>
<script>
(async()=>{const r=await fetch('/api/cart?session='+localStorage.sid);const d=await r.json();let h='';d.items.forEach(i=>{h+='<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--b)"><span>'+(${lang==="'zh'"}?i.name_zh:i.name_en)+' x'+i.quantity+'</span><span>¥'+(i.price*i.quantity).toFixed(2)+'</span></div>'});h+='<div style="display:flex;justify-content:space-between;padding:16px 0;font-weight:700;font-size:1.2rem;border-top:2px solid var(--b);margin-top:8px"><span>${_('cart.total')}</span><span style="color:var(--pd)">¥'+d.total.toFixed(2)+'</span></div>';document.getElementById('os').innerHTML=h||'<p>${_('cart.empty')}</p>'})();
</script>` });
  c.header('Content-Type', 'text/html; charset=utf-8');
  return c.body(html);
});

// Sitemap
app.get('/sitemap.xml', (c) => {
  const cached = getCachedPage('/sitemap.xml');
  if (cached) {
    c.header('Content-Type', 'application/xml; charset=utf-8');
    c.header('Cache-Control', 'public, max-age=3600');
    return c.body(cached.html);
  }
  return c.notFound();
});

// Health check
app.get('/health', (c) => c.json({ status: 'ok', time: new Date().toISOString() }));

// Robots.txt
app.get('/robots.txt', (c) => {
  c.header('Cache-Control', 'public, max-age=86400');
  return c.text('User-agent: *\nAllow: /\nSitemap: https://bracelet-boutique.com/sitemap.xml\n');
});

// 404
app.notFound((c) => {
  return c.html(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>404 - Bracelet Boutique</title><style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;background:#FAF5FF;color:#4C1D95}h1{font-size:4rem;margin:0}a{color:#7C3AED}</style></head><body><h1>404</h1><a href="/">Back to Home</a></body></html>`, 404);
});

const port = parseInt(process.env.PORT || '3000');

// ⚡ Pre-render ALL pages at startup, then serve from memory
console.log('💎 Bracelet Boutique - Starting up...');
preRenderAllPages().then(() => {
  console.log(`
╔══════════════════════════════════════════╗
║  💎 Bracelet Boutique — Ready           ║
║  🚀 Bun + Hono @ http://localhost:${port}  ║
║  🎨 Liquid Glass · MySQL · i18n (zh/en) ║
║  ⚡ Pre-rendered HTML · <1ms responses  ║
║  📄 CSS cached 7d · ETag support        ║
╚══════════════════════════════════════════╝
`);

  // Start periodic cache rebuild (every 2 minutes)
  startCacheRebuild(120000);

  serve({ fetch: app.fetch, port });
});
