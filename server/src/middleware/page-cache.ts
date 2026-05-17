import pool from '../db/connection';
import { layout } from '../views/layout';
import { t, type Lang } from '../i18n/translations';

// Full HTML page cache - stores pre-rendered pages
const htmlCache = new Map<string, { html: string; etag: string }>();

export async function preRenderAllPages(): Promise<void> {
  console.log('⚡ Pre-rendering all pages...');
  const start = performance.now();

  try {
    // Load data once
    const [products] = await pool.query(
      `SELECT p.*, (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 LIMIT 1) as primary_image
       FROM products p WHERE p.is_active = 1 ORDER BY p.created_at DESC`
    ) as any;

    const [categories] = await pool.query(
      'SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order'
    ) as any;

    const featured = products.filter((p: any) => p.is_featured);
    const categoryColors = ['#7C3AED', '#A78BFA', '#CA8A04', '#4C1D95'];

    for (const lang of ['zh', 'en'] as Lang[]) {
      const _ = (key: string) => t(lang, key);

      // --- HOME ---
      const productCards = featured.map((p: any) => renderProductCard(p, lang));
      const categoryCards = categories.map((cat: any, i: number) => renderCategoryCard(cat, i, lang, categoryColors));

      const homeHtml = layout({ lang, title: _('seo.home_title'), description: _('seo.home_desc'), children: `
<section class="hr"><div class="c"><h1>${_('home.hero_title')}</h1><p>${_('home.hero_subtitle')}</p><a href="/shop?lang=${lang}" class="btn ba blg">${_('home.hero_cta')}</a></div></section>
<section class="s"><div class="c"><div class="sh"><h2>${_('home.category_title')}</h2></div><div class="cg">${categoryCards}</div></div></section>
<section class="s" style="background:#fff"><div class="c"><div class="sh"><h2>${_('home.featured_title')}</h2><p>${_('home.featured_subtitle')}</p></div><div class="pg">${productCards}</div><div style="text-align:center;margin-top:40px"><a href="/shop?lang=${lang}" class="btn bo blg">${_('common.view_all')}</a></div></div></section>
<section class="s"><div class="c" style="max-width:800px;text-align:center"><h2>${_('home.about_title')}</h2><p style="font-size:1.1rem;line-height:1.8;margin:24px 0">${_('home.about_text')}</p><a href="/about?lang=${lang}" class="btn bp">${_('nav.about')}</a></div></section>
<section class="s" style="background:linear-gradient(135deg,var(--pd),var(--p))"><div class="c" style="text-align:center"><h2 style="color:#fff">${_('home.newsletter_title')}</h2><p style="color:rgba(255,255,255,0.8);margin:16px 0 24px">${_('home.newsletter_text')}</p><form onsubmit="event.preventDefault();fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:this.email.value})}).then(()=>alert('${lang==='zh'?'订阅成功！':'Subscribed!'}'))" style="display:flex;gap:12px;max-width:480px;margin:0 auto"><input type="email" name="email" placeholder="${_('home.newsletter_placeholder')}" required class="fi" style="flex:1"><button type="submit" class="btn ba">${_('home.newsletter_cta')}</button></form></div></section>` });
      htmlCache.set(`/|${lang}`, { html: homeHtml, etag: hashStr(homeHtml) });
      htmlCache.set(`/zh|${lang}`, { html: homeHtml, etag: hashStr(homeHtml) }); // alias

      // --- SHOP ---
      const catFilters = categories.map((cat: any) => `<a href="/shop?lang=${lang}&category=${cat.slug}" class="btn bsm" style="text-decoration:none;background:transparent;color:var(--p);border:2px solid var(--p);margin:0">${lang==='zh'?cat.name_zh:cat.name_en}</a>`).join('');
      const allProductCards = products.map((p: any) => renderProductCard(p, lang));

      const shopHtml = layout({ lang, title: _('seo.shop_title'), description: _('seo.shop_desc'), currentPath: '/shop', children: `
<div class="c"><div class="bc"><a href="/?lang=${lang}">${_('nav.home')}</a> / <span>${_('nav.shop')}</span></div></div>
<section class="s" style="padding-top:0"><div class="c"><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:32px"><a href="/shop?lang=${lang}" class="btn bp bsm" style="text-decoration:none">${_('nav.shop')}</a>${catFilters}</div><div class="pg">${allProductCards}</div></div></section>` });
      htmlCache.set(`/shop|${lang}`, { html: shopHtml, etag: hashStr(shopHtml) });

      // --- PRODUCT DETAIL PAGES ---
      for (const p of products) {
        const pImages = cache.get<any[]>(`db:images:${p.id}`) || [];
        const pReviews = cache.get<any[]>(`db:reviews:${p.id}`) || [];
        const pRelated = cache.get<any[]>(`db:related:${p.category_id}:${p.id}`) || [];

        const mainImage = pImages[0]?.image_url || `https://placehold.co/800x800/7C3AED/FFFFFF?text=${encodeURIComponent(p.name_en)}`;
        const thumbs = pImages.map((img: any) => `<img src="${img.image_url}" alt="${lang==='zh'?img.alt_zh:img.alt_en}" style="width:72px;height:72px;border-radius:8px;object-fit:cover;cursor:pointer;border:2px solid var(--b)" onmouseover="document.getElementById('mi').src=this.src" loading="lazy">`).join('');
        const stars = (r: number) => '★'.repeat(r)+'☆'.repeat(5-r);
        const reviewsHtml = pReviews.map((r: any) => `<div style="padding:16px 0;border-bottom:1px solid var(--b)"><div style="color:var(--a);margin-bottom:4px">${stars(r.rating)}</div><p style="margin-bottom:4px">${lang==='zh'?r.content_zh:r.content_en}</p><small style="color:var(--tl)">${new Date(r.created_at).toLocaleDateString(lang==='zh'?'zh-CN':'en-US')}</small></div>`).join('');
        const relatedCards = pRelated.map((rp: any) => renderProductCard(rp, lang));
        const jsonLd = JSON.stringify({'@context':'https://schema.org','@type':'Product',name:lang==='zh'?p.name_zh:p.name_en,description:lang==='zh'?p.description_zh:p.description_en,image:mainImage,offers:{'@type':'Offer',price:p.price,priceCurrency:'CNY',availability:p.stock>0?'https://schema.org/InStock':'https://schema.org/OutOfStock'}});

        const prodHtml = layout({ lang, title: `${lang==='zh'?p.name_zh:p.name_en} - ${_('site.name')}`, description: lang==='zh'?p.description_zh:p.description_en, currentPath: `/product/${p.slug}`, children: `
<div class="c"><div class="bc"><a href="/?lang=${lang}">${_('nav.home')}</a> / <a href="/shop?lang=${lang}">${_('nav.shop')}</a> / <span>${lang==='zh'?p.name_zh:p.name_en}</span></div></div>
<script type="application/ld+json">${jsonLd}</script>
<div class="c"><div class="pd"><div class="pdi"><img id="mi" class="mi" src="${mainImage}" alt="${lang==='zh'?p.name_zh:p.name_en}" width="600" height="600"><div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">${thumbs}</div></div><div class="pdi"><h1>${lang==='zh'?p.name_zh:p.name_en}</h1><div style="font-size:0.9rem;color:var(--tl);margin-bottom:16px">${lang==='zh'?p.material_zh:p.material_en} · ${p.weight_grams}g</div><div style="display:flex;align-items:center;gap:12px;margin:24px 0"><span style="font-size:2rem;font-weight:700;color:var(--pd)">¥${p.price}</span>${p.compare_at_price?`<span style="font-size:1.2rem;color:var(--tl);text-decoration:line-through">¥${p.compare_at_price}</span>`:''}</div><div style="line-height:1.8;color:var(--tl);margin-bottom:24px">${lang==='zh'?p.description_zh:p.description_en}</div><span style="color:${p.stock>0?'#10B981':'#EF4444'};font-weight:600">${p.stock>0?_('product.in_stock'):_('product.out_of_stock')}</span>${p.stock>0?`<div style="display:flex;align-items:center;gap:16px;margin:16px 0"><label style="font-weight:500">${_('product.quantity')}:</label><input type="number" id="qt" value="1" min="1" max="${p.stock}" class="fi" style="width:80px"></div><button class="btn ba blg" onclick="(async()=>{const r=await fetch('/api/cart',{method:'POST',headers:{'Content-Type':'application/json','X-Session-ID':localStorage.sid},body:JSON.stringify({product_id:${p.id},quantity:parseInt(document.getElementById('qt').value||1)})});const d=await r.json();if(d.success){alert('${lang==='zh'?'已加入购物车！':'Added to cart!'}');location.href='/cart?lang=${lang}'}})()">${_('product.add_to_cart')}</button>`:''}</div></div>
<div style="margin:40px 0"><h2 style="margin-bottom:16px">${_('product.details')}</h2><div style="line-height:1.8;color:var(--tl);white-space:pre-line">${lang==='zh'?p.detail_zh:p.detail_en}</div></div>
<div style="margin:40px 0"><h2 style="margin-bottom:16px">${_('product.reviews')} (${pReviews.length})</h2>${reviewsHtml||'<p style="color:var(--tl)">'+(lang==='zh'?'暂无评价':'No reviews yet')+'</p>'}</div>
${pRelated.length?`<div style="margin:40px 0 80px"><h2 style="margin-bottom:24px">${_('product.related')}</h2><div class="pg" style="grid-template-columns:repeat(auto-fill,minmax(240px,1fr))">${relatedCards}</div></div>`:''}</div>` });
        htmlCache.set(`/product/${p.slug}|${lang}`, { html: prodHtml, etag: hashStr(prodHtml) });
      }

      // --- ABOUT ---
      const aboutHtml = layout({ lang, title: `${_('about.title')} - ${_('site.name')}`, description: _('home.about_text').slice(0,160), currentPath: '/about', children: `
<section class="hr" style="padding:60px 0"><div class="c" style="text-align:center"><h1>${_('about.title')}</h1></div></section>
<div class="c" style="max-width:800px;padding:40px 24px 80px"><h2>${_('about.story')}</h2><p style="font-size:1.1rem;line-height:1.9;margin:20px 0 40px">${_('about.story_text')}</p><h2>${_('about.mission')}</h2><p style="font-size:1.1rem;line-height:1.9;margin:20px 0">${_('about.mission_text')}</p>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:24px;margin-top:48px"><div class="gc" style="text-align:center"><div style="font-size:2.5rem;margin-bottom:8px">💎</div><h4>${lang==='zh'?'天然选材':'Natural Materials'}</h4><p style="font-size:0.9rem">${lang==='zh'?'全球精选优质水晶原石':'Globally sourced premium crystals'}</p></div><div class="gc" style="text-align:center"><div style="font-size:2.5rem;margin-bottom:8px">🤲</div><h4>${lang==='zh'?'匠心手作':'Handcrafted'}</h4><p style="font-size:0.9rem">${lang==='zh'?'每一件都是手工打造':'Each piece is handmade'}</p></div><div class="gc" style="text-align:center"><div style="font-size:2.5rem;margin-bottom:8px">✨</div><h4>${lang==='zh'?'能量加持':'Energy Infused'}</h4><p style="font-size:0.9rem">${lang==='zh'?'传递自然能量与美好':'Channeling natural energy'}</p></div></div></div>` });
      htmlCache.set(`/about|${lang}`, { html: aboutHtml, etag: hashStr(aboutHtml) });

      // --- CONTACT ---
      const contactHtml = layout({ lang, title: `${_('contact.title')} - ${_('site.name')}`, description: _('contact.title'), currentPath: '/contact', children: `
<section class="hr" style="padding:60px 0"><div class="c" style="text-align:center"><h1>${_('contact.title')}</h1></div></section>
<div class="c" style="max-width:800px;padding:0 24px 80px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:40px" class="pd"><div class="gc">
<form onsubmit="event.preventDefault();const f=new FormData(event.target);const b=Object.fromEntries(f.entries());fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}).then(r=>r.json()).then(d=>{if(d.success){alert('${_('contact.success')}');event.target.reset()}})">
<div class="fm"><label class="fl">${_('contact.name')}</label><input type="text" name="name" required class="fi"></div>
<div class="fm"><label class="fl">${_('contact.email')}</label><input type="email" name="email" required class="fi"></div>
<div class="fm"><label class="fl">${_('contact.phone')}</label><input type="tel" name="phone" class="fi"></div>
<div class="fm"><label class="fl">${_('contact.message')}</label><textarea name="message" rows="5" required class="fi"></textarea></div>
<button type="submit" class="btn ba blg" style="width:100%">${_('contact.send')}</button></form></div>
<div><div style="margin-bottom:32px"><h4>${_('contact.address_label')}</h4><p>${lang==='zh'?'中国广东省广州市天河区':'Tianhe District, Guangzhou, Guangdong, China'}</p></div>
<div style="margin-bottom:32px"><h4>${_('contact.email_label')}</h4><p>hello@bracelet-boutique.com</p></div>
<div style="margin-bottom:32px"><h4>${_('contact.phone_label')}</h4><p>+86 400-888-8888</p></div>
<div class="gc" style="text-align:center"><p>${lang==='zh'?'客服时间：周一至周日 9:00-21:00':'Service Hours: Mon-Sun 9:00-21:00'}</p></div></div></div></div>` });
      htmlCache.set(`/contact|${lang}`, { html: contactHtml, etag: hashStr(contactHtml) });
    }

    // --- SITEMAP ---
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    xml += '  <url><loc>https://bracelet-boutique.com/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n';
    xml += '  <url><loc>https://bracelet-boutique.com/shop</loc><changefreq>daily</changefreq><priority>0.9</priority></url>\n';
    xml += '  <url><loc>https://bracelet-boutique.com/about</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>\n';
    xml += '  <url><loc>https://bracelet-boutique.com/contact</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>\n';
    for (const p of products) {
      xml += `  <url><loc>https://bracelet-boutique.com/product/${p.slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
    }
    xml += '</urlset>';
    htmlCache.set('/sitemap.xml', { html: xml, etag: hashStr(xml) });

    const elapsed = (performance.now() - start).toFixed(0);
    console.log(`✅ Pre-rendered ${htmlCache.size} pages in ${elapsed}ms`);
  } catch (err: any) {
    console.error('❌ Pre-render error:', err.message);
  }
}

// Rebuild cache periodically (every 2 minutes)
let rebuildTimer: any = null;
export function startCacheRebuild(intervalMs: number = 120000) {
  if (rebuildTimer) clearInterval(rebuildTimer);
  rebuildTimer = setInterval(async () => {
    console.log('🔄 Refreshing page cache...');
    htmlCache.clear();
    await preRenderAllPages();
  }, intervalMs);
}

// Get cached page
export function getCachedPage(key: string): { html: string; etag: string } | null {
  return htmlCache.get(key) || null;
}

// Invalidate cache entries for a product (when stock/price changes)
export function invalidateProduct(slug: string) {
  for (const key of htmlCache.keys()) {
    if (key.includes(`/product/${slug}`)) htmlCache.delete(key);
  }
  // Also invalidate home/shop since they list products
  for (const key of htmlCache.keys()) {
    if (key.startsWith('/|') || key.startsWith('/shop|') || key.startsWith('/zh|')) htmlCache.delete(key);
  }
}

// Helper: render product card HTML
function renderProductCard(p: any, lang: Lang): string {
  return `<div class="pc"><a href="/product/${p.slug}?lang=${lang}"><img class="pci" src="${p.primary_image}" alt="${lang==='zh'?p.name_zh:p.name_en}" loading="lazy" width="400" height="400"><div class="pcb"><div style="font-size:0.75rem;color:var(--p);text-transform:uppercase;letter-spacing:0.05em;font-weight:600;margin-bottom:4px">${lang==='zh'?p.material_zh:p.material_en}</div><div class="pcn">${lang==='zh'?p.name_zh:p.name_en}</div><div class="pcp"><span class="pcc">¥${p.price}</span>${p.compare_at_price?`<span class="pco">¥${p.compare_at_price}</span>`:''}</div></div></a></div>`;
}

function renderCategoryCard(cat: any, i: number, lang: Lang, colors: string[]): string {
  return `<div class="ccd" style="background:linear-gradient(180deg,transparent 40%,rgba(76,29,149,0.8)),linear-gradient(135deg,${colors[i%4]},${colors[(i+1)%4]})"><div class="ccc"><a href="/shop?lang=${lang}&category=${cat.slug}"><h3>${lang==='zh'?cat.name_zh:cat.name_en}</h3><p style="color:rgba(255,255,255,0.8);font-size:0.9rem">${lang==='zh'?cat.description_zh:cat.description_en}</p></a></div></div>`;
}

function hashStr(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return '"' + Math.abs(h).toString(36) + '"';
}

// DB query cache (same as cache.ts but also used during pre-render)
const cache = {
  store: new Map<string, { data: any; exp: number }>(),
  get<T>(key: string): T | null {
    const item = this.store.get(key);
    if (!item || Date.now() > item.exp) { this.store.delete(key); return null; }
    return item.data as T;
  },
  set(key: string, data: any, ttl: number = 60000) {
    this.store.set(key, { data, exp: Date.now() + ttl });
  }
};
