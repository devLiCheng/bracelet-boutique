import { Hono } from 'hono';
import pool from '../db/connection';
import { layout } from '../views/layout';
import { t, type Lang } from '../i18n/translations';
import { cache } from '../middleware/cache';

const pages = new Hono();

const CACHE_TTL = 30000; // 30 seconds for product/category data (faster invalidation)
const STATIC_TTL = 300000; // 5 min for static pages (about, contact)

// Home Page
pages.get('/', async (c) => {
  const lang = c.get('lang') as Lang;
  const _ = (key: string) => t(lang, key);

  // Get featured products (cached)
  let featured = cache.get<any[]>('db:featured_products');
  if (!featured) {
    const [rows] = await pool.query(
      `SELECT p.*, (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 LIMIT 1) as primary_image
       FROM products p WHERE p.is_featured = 1 AND p.is_active = 1 LIMIT 8`
    ) as any;
    featured = rows;
    cache.set('db:featured_products', rows, CACHE_TTL);
  }

  // Get categories (cached)
  let categories = cache.get<any[]>('db:categories');
  if (!categories) {
    const [rows] = await pool.query(
      'SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order'
    ) as any;
    categories = rows;
    cache.set('db:categories', rows, CACHE_TTL);
  }

  const categoryColors = ['#7C3AED', '#A78BFA', '#CA8A04', '#4C1D95'];

  const productCards = featured.map((p: any) => `
    <div class="product-card">
      <a href="/product/${p.slug}?lang=${lang}">
        <img class="product-card-image" src="${p.primary_image}" alt="${lang === 'zh' ? p.name_zh : p.name_en}" loading="lazy" width="400" height="400">
        <div class="product-card-body">
          <div class="product-card-category">${lang === 'zh' ? p.material_zh : p.material_en}</div>
          <div class="product-card-name">${lang === 'zh' ? p.name_zh : p.name_en}</div>
          <div class="product-card-price">
            <span class="price-current">¥${p.price}</span>
            ${p.compare_at_price ? `<span class="price-compare">¥${p.compare_at_price}</span>` : ''}
          </div>
        </div>
      </a>
    </div>
  `).join('');

  const categoryCards = categories.map((cat: any, i: number) => `
    <div class="category-card" style="background:linear-gradient(135deg,${categoryColors[i % 4]},${categoryColors[(i+1) % 4]})">
      <div class="category-card-content">
        <a href="/shop?lang=${lang}&category=${cat.slug}">
          <h3>${lang === 'zh' ? cat.name_zh : cat.name_en}</h3>
          <p style="color:rgba(255,255,255,0.8);font-size:0.9rem">${lang === 'zh' ? cat.description_zh : cat.description_en}</p>
        </a>
      </div>
    </div>
  `).join('');

  const html = layout({
    lang,
    title: _('seo.home_title'),
    description: _('seo.home_desc'),
    children: `
      <section class="hero">
        <div class="container">
          <h1>${_('home.hero_title')}</h1>
          <p>${_('home.hero_subtitle')}</p>
          <a href="/shop?lang=${lang}" class="btn btn-cta btn-lg">${_('home.hero_cta')}</a>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="section-header">
            <h2>${_('home.category_title')}</h2>
          </div>
          <div class="category-grid">${categoryCards}</div>
        </div>
      </section>

      <section class="section" style="background:#fff">
        <div class="container">
          <div class="section-header">
            <h2>${_('home.featured_title')}</h2>
            <p>${_('home.featured_subtitle')}</p>
          </div>
          <div class="product-grid">${productCards}</div>
          <div style="text-align:center;margin-top:40px">
            <a href="/shop?lang=${lang}" class="btn btn-outline btn-lg">${_('common.view_all')}</a>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container" style="max-width:800px;text-align:center">
          <h2>${_('home.about_title')}</h2>
          <p style="font-size:1.1rem;line-height:1.8;margin:24px 0">${_('home.about_text')}</p>
          <a href="/about?lang=${lang}" class="btn btn-primary">${_('nav.about')}</a>
        </div>
      </section>

      <section class="section" style="background:linear-gradient(135deg,var(--color-primary-dark),var(--color-primary))">
        <div class="container" style="text-align:center">
          <h2 style="color:#fff">${_('home.newsletter_title')}</h2>
          <p style="color:rgba(255,255,255,0.8);margin:16px 0 24px">${_('home.newsletter_text')}</p>
          <form onsubmit="event.preventDefault();fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:this.email.value})}).then(()=>alert('${lang === 'zh' ? '订阅成功！' : 'Subscribed!'}'))" style="display:flex;gap:12px;max-width:480px;margin:0 auto">
            <input type="email" name="email" placeholder="${_('home.newsletter_placeholder')}" required class="form-input" style="flex:1">
            <button type="submit" class="btn btn-cta">${_('home.newsletter_cta')}</button>
          </form>
        </div>
      </section>
    `
  });

  return c.html(html);
});

// Shop Page (product listing)
pages.get('/shop', async (c) => {
  const lang = c.get('lang') as Lang;
  const _ = (key: string) => t(lang, key);
  const category = c.req.query('category');
  const search = c.req.query('search') || '';
  const page = parseInt(c.req.query('page') || '1');

  // Build query
  let whereClause = 'WHERE p.is_active = 1';
  const params: any[] = [];
  if (category) {
    whereClause += ' AND p.category_id IN (SELECT id FROM categories WHERE slug = ?)';
    params.push(category);
  }
  if (search) {
    whereClause += ' AND (p.name_zh LIKE ? OR p.name_en LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  // Cache only non-search queries
  const cacheKey = `db:products:${category || 'all'}:${page}`;
  let products: any[] | null = null;
  if (!search) {
    const cached = cache.get<any[]>(cacheKey);
    if (cached) products = cached;
  }
  if (!products) {
    const [prodRows] = await pool.query(
      `SELECT p.*, (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 LIMIT 1) as primary_image
       FROM products p ${whereClause} ORDER BY p.created_at DESC` +
      (search ? '' : ` LIMIT 24 OFFSET ${(page - 1) * 24}`),
      params
    ) as any;
    products = prodRows;
    if (!search) cache.set(cacheKey, prodRows, CACHE_TTL);
  }

  // Categories for filter (cached)
  let categories = cache.get<any[]>('db:categories');
  if (!categories) {
    const [catRows] = await pool.query(
      'SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order'
    ) as any;
    categories = catRows;
    cache.set('db:categories', catRows, CACHE_TTL);
  }

  const categoryFilters = categories.map((cat: any) => `
    <a href="/shop?lang=${lang}&category=${cat.slug}" class="btn ${category === cat.slug ? 'btn-primary' : 'btn-outline'} btn-sm" style="text-decoration:none">
      ${lang === 'zh' ? cat.name_zh : cat.name_en}
    </a>
  `).join('');

  const productCards = (products as any[]).map((p: any) => `
    <div class="product-card">
      <a href="/product/${p.slug}?lang=${lang}">
        <img class="product-card-image" src="${p.primary_image}" alt="${lang === 'zh' ? p.name_zh : p.name_en}" loading="lazy" width="400" height="400">
        <div class="product-card-body">
          <div class="product-card-category">${lang === 'zh' ? p.material_zh : p.material_en}</div>
          <div class="product-card-name">${lang === 'zh' ? p.name_zh : p.name_en}</div>
          <div class="product-card-price">
            <span class="price-current">¥${p.price}</span>
            ${p.compare_at_price ? `<span class="price-compare">¥${p.compare_at_price}</span>` : ''}
          </div>
        </div>
      </a>
    </div>
  `).join('');

  const html = layout({
    lang,
    title: _('seo.shop_title'),
    description: _('seo.shop_desc'),
    currentPath: '/shop',
    children: `
      <div class="container">
        <div class="breadcrumb">
          <a href="/?lang=${lang}">${_('nav.home')}</a> / <span>${_('nav.shop')}</span>
        </div>
      </div>
      <section class="section" style="padding-top:0">
        <div class="container">
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:32px">
            <a href="/shop?lang=${lang}" class="btn ${!category ? 'btn-primary' : 'btn-outline'} btn-sm" style="text-decoration:none">${_('nav.shop')}</a>
            ${categoryFilters}
          </div>
          ${search ? `<p style="margin-bottom:24px;color:var(--color-text-light)">${lang === 'zh' ? '搜索：' : 'Search: '}"${search}"</p>` : ''}
          ${products.length > 0 ? `
            <div class="product-grid">${productCards}</div>
          ` : `
            <div style="text-align:center;padding:60px 0">
              <p style="font-size:1.2rem">${_('common.no_results')}</p>
              <a href="/shop?lang=${lang}" class="btn btn-outline" style="margin-top:16px">${_('common.view_all')}</a>
            </div>
          `}
        </div>
      </section>
    `
  });

  return c.html(html);
});

// Product Detail Page
pages.get('/product/:slug', async (c) => {
  const lang = c.get('lang') as Lang;
  const _ = (key: string) => t(lang, key);
  const slug = c.req.param('slug');

  let product: any = null;
  const cachedProduct = cache.get<any[]>(`db:product:${slug}`);
  if (cachedProduct) {
    product = cachedProduct[0];
  } else {
    const [qRows] = await pool.query('SELECT * FROM products WHERE slug = ? AND is_active = 1', [slug]) as any;
    if (!qRows[0]) return c.html(layout({ lang, title: '404', description: 'Not found', children: '<h1>404</h1>' }), 404);
    cache.set(`db:product:${slug}`, qRows, CACHE_TTL);
    product = qRows[0];
  }

  // Images (cached)
  let images = cache.get<any[]>(`db:images:${product.id}`);
  if (!images) {
    const [imgRows] = await pool.query('SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order', [product.id]) as any;
    images = imgRows;
    cache.set(`db:images:${product.id}`, imgRows, CACHE_TTL);
  }

  // Reviews (cached)
  let reviews = cache.get<any[]>(`db:reviews:${product.id}`);
  if (!reviews) {
    const [revRows] = await pool.query('SELECT * FROM reviews WHERE product_id = ? AND is_approved = 1 ORDER BY created_at DESC LIMIT 10', [product.id]) as any;
    reviews = revRows;
    cache.set(`db:reviews:${product.id}`, revRows, CACHE_TTL);
  }

  // Related (cached)
  let related = cache.get<any[]>(`db:related:${product.category_id}:${product.id}`);
  if (!related) {
    const [relRows] = await pool.query(
      `SELECT p.*, (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 LIMIT 1) as primary_image
       FROM products p WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1 LIMIT 4`,
      [product.category_id, product.id]
    ) as any;
    related = relRows;
    cache.set(`db:related:${product.category_id}:${product.id}`, relRows, CACHE_TTL);
  }

  const mainImage = images[0]?.image_url || `https://placehold.co/800x800/7C3AED/FFFFFF?text=${encodeURIComponent(product.name_en)}`;

  const imageThumbs = images.map((img: any) => `
    <img src="${img.image_url}" alt="${lang === 'zh' ? img.alt_zh : img.alt_en}" style="width:72px;height:72px;border-radius:8px;object-fit:cover;cursor:pointer;border:2px solid var(--color-border)" onmouseover="document.getElementById('mainImage').src=this.src" loading="lazy">
  `).join('');

  const reviewStars = (rating: number) => '★'.repeat(rating) + '☆'.repeat(5 - rating);

  const reviewList = (reviews as any[]).map((r: any) => `
    <div style="padding:16px 0;border-bottom:1px solid var(--color-border)">
      <div style="color:var(--color-cta);margin-bottom:4px">${reviewStars(r.rating)}</div>
      <p style="margin-bottom:4px">${lang === 'zh' ? r.content_zh : r.content_en}</p>
      <small style="color:var(--color-text-light)">${new Date(r.created_at).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US')}</small>
    </div>
  `).join('');

  const relatedCards = (related as any[]).map((p: any) => `
    <div class="product-card">
      <a href="/product/${p.slug}?lang=${lang}">
        <img class="product-card-image" src="${p.primary_image}" alt="${lang === 'zh' ? p.name_zh : p.name_en}" loading="lazy" width="300" height="300">
        <div class="product-card-body">
          <div class="product-card-name">${lang === 'zh' ? p.name_zh : p.name_en}</div>
          <div class="product-card-price">
            <span class="price-current">¥${p.price}</span>
          </div>
        </div>
      </a>
    </div>
  `).join('');

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: lang === 'zh' ? product.name_zh : product.name_en,
    description: lang === 'zh' ? product.description_zh : product.description_en,
    image: mainImage,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'CNY',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    review: (reviews as any[]).map((r: any) => ({
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: r.rating },
      reviewBody: lang === 'zh' ? r.content_zh : r.content_en,
    })),
  });

  const html = layout({
    lang,
    title: `${lang === 'zh' ? product.name_zh : product.name_en} - ${_('site.name')}`,
    description: lang === 'zh' ? product.description_zh : product.description_en,
    currentPath: `/product/${slug}`,
    children: `
      <div class="container">
        <div class="breadcrumb">
          <a href="/?lang=${lang}">${_('nav.home')}</a> / 
          <a href="/shop?lang=${lang}">${_('nav.shop')}</a> / 
          <span>${lang === 'zh' ? product.name_zh : product.name_en}</span>
        </div>
      </div>

      <script type="application/ld+json">${jsonLd}</script>

      <div class="container">
        <div class="product-detail">
          <div class="product-gallery">
            <img id="mainImage" class="main-image" src="${mainImage}" alt="${lang === 'zh' ? product.name_zh : product.name_en}" width="600" height="600">
            <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">${imageThumbs}</div>
          </div>
          <div class="product-info">
            <h1>${lang === 'zh' ? product.name_zh : product.name_en}</h1>
            <div class="material">${lang === 'zh' ? product.material_zh : product.material_en} · ${product.weight_grams}g</div>
            <div class="price-block">
              <span class="current">¥${product.price}</span>
              ${product.compare_at_price ? `<span class="compare">¥${product.compare_at_price}</span>` : ''}
            </div>
            <div class="description">${lang === 'zh' ? product.description_zh : product.description_en}</div>
            <div style="margin-bottom:20px">
              <span style="color:${product.stock > 0 ? '#10B981' : '#EF4444'};font-weight:600">
                ${product.stock > 0 ? _('product.in_stock') : _('product.out_of_stock')}
              </span>
            </div>
            ${product.stock > 0 ? `
              <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
                <label style="font-weight:500">${_('product.quantity')}:</label>
                <input type="number" id="qty" value="1" min="1" max="${product.stock}" class="form-input" style="width:80px">
              </div>
              <button class="btn btn-cta btn-lg" onclick="addToCart(${product.id})">
                ${_('product.add_to_cart')}
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Details -->
        <div style="margin:40px 0">
          <h2 style="margin-bottom:16px">${_('product.details')}</h2>
          <div style="line-height:1.8;color:var(--color-text-light);white-space:pre-line">
            ${lang === 'zh' ? product.detail_zh : product.detail_en}
          </div>
        </div>

        <!-- Reviews -->
        <div style="margin:40px 0">
          <h2 style="margin-bottom:16px">${_('product.reviews')} (${(reviews as any[]).length})</h2>
          ${reviewList || `<p style="color:var(--color-text-light)">${lang === 'zh' ? '暂无评价' : 'No reviews yet'}</p>`}
        </div>

        <!-- Related Products -->
        ${(related as any[]).length > 0 ? `
          <div style="margin:40px 0 80px">
            <h2 style="margin-bottom:24px">${_('product.related')}</h2>
            <div class="product-grid" style="grid-template-columns:repeat(auto-fill,minmax(240px,1fr))">${relatedCards}</div>
          </div>
        ` : ''}
      </div>

      <script>
        async function addToCart(productId) {
          const sid = localStorage.getItem('session_id');
          const qty = parseInt(document.getElementById('qty').value || 1);
          const r = await fetch('/api/cart', {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'X-Session-ID': sid},
            body: JSON.stringify({product_id: productId, quantity: qty})
          });
          const d = await r.json();
          if (d.success) {
            alert('${lang === 'zh' ? '已加入购物车！' : 'Added to cart!'}');
            location.href = '/cart?lang=${lang}';
          }
        }
      </script>
    `
  });

  return c.html(html);
});

// Cart Page
pages.get('/cart', async (c) => {
  const lang = c.get('lang') as Lang;
  const _ = (key: string) => t(lang, key);

  const html = layout({
    lang,
    title: `${_('cart.title')} - ${_('site.name')}`,
    description: _('cart.title'),
    currentPath: '/cart',
    children: `
      <div class="container">
        <div class="breadcrumb">
          <a href="/?lang=${lang}">${_('nav.home')}</a> / <span>${_('cart.title')}</span>
        </div>
        <h1 style="margin-bottom:32px">${_('cart.title')}</h1>
        <div id="cartContent">
          <p>${_('common.loading')}</p>
        </div>
      </div>
      <script>
        async function loadCart() {
          const sid = localStorage.getItem('session_id');
          const r = await fetch('/api/cart?session=' + sid);
          const data = await r.json();
          const el = document.getElementById('cartContent');
          if (!data.items.length) {
            el.innerHTML = '<div style="text-align:center;padding:60px 0"><p style="font-size:1.2rem">${_('cart.empty')}</p><a href="/shop?lang=${lang}" class="btn btn-cta" style="margin-top:16px">${_('cart.continue_shopping')}</a></div>';
            return;
          }
          let html = '<div style="overflow-x:auto"><table class="cart-table"><thead><tr><th>${_('product.description')}</th><th>${_('cart.quantity')}</th><th>${_('cart.subtotal')}</th><th></th></tr></thead><tbody>';
          data.items.forEach(item => {
            html += '<tr>' +
              '<td><div class="cart-product"><img class="cart-product-image" src="' + (item.image_url || '') + '" alt="' + (${lang === "'zh'"} ? item.name_zh : item.name_en) + '" width="80" height="80"><div><strong>' + (${lang === "'zh'"} ? item.name_zh : item.name_en) + '</strong><br><small>¥' + item.price + '</small></div></div></td>' +
              '<td><input type="number" value="' + item.quantity + '" min="1" style="width:60px;padding:6px" onchange="updateCart(' + item.id + ',this.value)" class="form-input"></td>' +
              '<td><strong>¥' + (item.price * item.quantity).toFixed(2) + '</strong></td>' +
              '<td><button onclick="removeFromCart(' + item.id + ')" style="background:none;border:none;cursor:pointer;color:#EF4444;font-size:1.2rem">✕</button></td>' +
            '</tr>';
          });
          html += '</tbody></table></div>';
          html += '<div style="text-align:right;margin-top:32px;padding:24px;background:var(--color-surface);border-radius:var(--radius-lg);border:1px solid var(--color-border)">';
          html += '<p style="font-size:1.1rem;margin-bottom:8px">${_('cart.total')}: <strong style="font-size:1.5rem;color:var(--color-primary-dark)">¥' + data.total.toFixed(2) + '</strong></p>';
          html += '<a href="/checkout?lang=${lang}" class="btn btn-cta btn-lg">${_('cart.checkout')}</a></div>';
          el.innerHTML = html;
        }
        async function updateCart(id, qty) {
          const sid = localStorage.getItem('session_id');
          await fetch('/api/cart/' + id, {method:'PUT',headers:{'Content-Type':'application/json','X-Session-ID':sid},body:JSON.stringify({quantity:parseInt(qty)})});
          loadCart();
        }
        async function removeFromCart(id) {
          const sid = localStorage.getItem('session_id');
          await fetch('/api/cart/' + id, {method:'DELETE',headers:{'X-Session-ID':sid}});
          loadCart();
        }
        loadCart();
      </script>
    `
  });

  return c.html(html);
});

// Checkout Page
pages.get('/checkout', async (c) => {
  const lang = c.get('lang') as Lang;
  const _ = (key: string) => t(lang, key);

  const html = layout({
    lang,
    title: `${_('checkout.title')} - ${_('site.name')}`,
    description: _('checkout.title'),
    currentPath: '/checkout',
    children: `
      <div class="container">
        <div class="breadcrumb">
          <a href="/?lang=${lang}">${_('nav.home')}</a> / <span>${_('checkout.title')}</span>
        </div>
        <h1 style="margin-bottom:32px">${_('checkout.title')}</h1>
        <div style="display:grid;grid-template-columns:1fr 400px;gap:40px" class="product-detail">
          <div class="glass-card">
            <h2 style="margin-bottom:24px">${_('checkout.shipping')}</h2>
            <form id="checkoutForm" onsubmit="submitOrder(event)">
              <div class="form-group">
                <label class="form-label">${_('checkout.name')} *</label>
                <input type="text" name="name" required class="form-input">
              </div>
              <div class="form-group">
                <label class="form-label">${_('checkout.phone')} *</label>
                <input type="tel" name="phone" required class="form-input">
              </div>
              <div class="form-group">
                <label class="form-label">${_('checkout.email') || 'Email'} *</label>
                <input type="email" name="email" required class="form-input">
              </div>
              <div class="form-group">
                <label class="form-label">${_('checkout.address')} *</label>
                <input type="text" name="address" required class="form-input">
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px">
                <div class="form-group">
                  <label class="form-label">${_('checkout.city')}</label>
                  <input type="text" name="city" class="form-input">
                </div>
                <div class="form-group">
                  <label class="form-label">${_('checkout.state')}</label>
                  <input type="text" name="state" class="form-input">
                </div>
                <div class="form-group">
                  <label class="form-label">${_('checkout.zip')}</label>
                  <input type="text" name="zip" class="form-input">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">${_('checkout.notes')}</label>
                <textarea name="notes" rows="3" class="form-input"></textarea>
              </div>
              <button type="submit" class="btn btn-cta btn-lg" style="width:100%">${_('checkout.place_order')}</button>
            </form>
          </div>
          <div>
            <div class="glass-card">
              <h3 style="margin-bottom:16px">${_('cart.title')}</h3>
              <div id="orderSummary">${_('common.loading')}</div>
            </div>
          </div>
        </div>
      </div>
      <script>
        async function loadSummary() {
          const sid = localStorage.getItem('session_id');
          const r = await fetch('/api/cart?session=' + sid);
          const data = await r.json();
          let html = '';
          data.items.forEach(item => {
            html += '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--color-border)"><span>' + (${lang === "'zh'"} ? item.name_zh : item.name_en) + ' x' + item.quantity + '</span><span>¥' + (item.price*item.quantity).toFixed(2) + '</span></div>';
          });
          html += '<div style="display:flex;justify-content:space-between;padding:16px 0;font-weight:700;font-size:1.2rem;border-top:2px solid var(--color-border);margin-top:8px"><span>${_('cart.total')}</span><span style="color:var(--color-primary-dark)">¥' + data.total.toFixed(2) + '</span></div>';
          document.getElementById('orderSummary').innerHTML = html || '<p>${_('cart.empty')}</p>';
        }
        async function submitOrder(e) {
          e.preventDefault();
          const sid = localStorage.getItem('session_id');
          const fd = new FormData(e.target);
          const body = Object.fromEntries(fd.entries());
          const r = await fetch('/api/checkout', {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'X-Session-ID': sid},
            body: JSON.stringify(body)
          });
          const d = await r.json();
          if (d.success) {
            alert('${_('checkout.order_success')}\\n${_('checkout.order_number')}: ' + d.order_number);
            location.href = '/?lang=${lang}';
          } else {
            alert(d.error || '${_('common.error')}');
          }
        }
        loadSummary();
      </script>
    `
  });

  return c.html(html);
});

// About Page
pages.get('/about', async (c) => {
  const lang = c.get('lang') as Lang;
  const _ = (key: string) => t(lang, key);

  const html = layout({
    lang,
    title: `${_('about.title')} - ${_('site.name')}`,
    description: _('home.about_text').slice(0, 160),
    currentPath: '/about',
    children: `
      <section class="hero" style="padding:60px 0">
        <div class="container" style="text-align:center">
          <h1>${_('about.title')}</h1>
        </div>
      </section>
      <div class="container" style="max-width:800px;padding:40px 24px 80px">
        <h2>${_('about.story')}</h2>
        <p style="font-size:1.1rem;line-height:1.9;margin:20px 0 40px">${_('about.story_text')}</p>
        <h2>${_('about.mission')}</h2>
        <p style="font-size:1.1rem;line-height:1.9;margin:20px 0">${_('about.mission_text')}</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:24px;margin-top:48px">
          <div class="glass-card" style="text-align:center">
            <div style="font-size:2.5rem;margin-bottom:8px">💎</div>
            <h4>${lang === 'zh' ? '天然选材' : 'Natural Materials'}</h4>
            <p style="font-size:0.9rem">${lang === 'zh' ? '全球精选优质水晶原石' : 'Globally sourced premium crystals'}</p>
          </div>
          <div class="glass-card" style="text-align:center">
            <div style="font-size:2.5rem;margin-bottom:8px">🤲</div>
            <h4>${lang === 'zh' ? '匠心手作' : 'Handcrafted'}</h4>
            <p style="font-size:0.9rem">${lang === 'zh' ? '每一件都是手工打造' : 'Each piece is handmade'}</p>
          </div>
          <div class="glass-card" style="text-align:center">
            <div style="font-size:2.5rem;margin-bottom:8px">✨</div>
            <h4>${lang === 'zh' ? '能量加持' : 'Energy Infused'}</h4>
            <p style="font-size:0.9rem">${lang === 'zh' ? '传递自然能量与美好' : 'Channeling natural energy'}</p>
          </div>
        </div>
      </div>
    `
  });

  return c.html(html);
});

// Contact Page
pages.get('/contact', async (c) => {
  const lang = c.get('lang') as Lang;
  const _ = (key: string) => t(lang, key);

  const html = layout({
    lang,
    title: `${_('contact.title')} - ${_('site.name')}`,
    description: _('contact.title'),
    currentPath: '/contact',
    children: `
      <section class="hero" style="padding:60px 0">
        <div class="container" style="text-align:center">
          <h1>${_('contact.title')}</h1>
        </div>
      </section>
      <div class="container" style="max-width:800px;padding:0 24px 80px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px" class="product-detail">
          <div class="glass-card">
            <form onsubmit="submitContact(event)">
              <div class="form-group">
                <label class="form-label">${_('contact.name')}</label>
                <input type="text" name="name" required class="form-input">
              </div>
              <div class="form-group">
                <label class="form-label">${_('contact.email')}</label>
                <input type="email" name="email" required class="form-input">
              </div>
              <div class="form-group">
                <label class="form-label">${_('contact.phone')}</label>
                <input type="tel" name="phone" class="form-input">
              </div>
              <div class="form-group">
                <label class="form-label">${_('contact.message')}</label>
                <textarea name="message" rows="5" required class="form-input"></textarea>
              </div>
              <button type="submit" class="btn btn-cta btn-lg" style="width:100%">${_('contact.send')}</button>
            </form>
          </div>
          <div>
            <div style="margin-bottom:32px">
              <h4>${_('contact.address_label')}</h4>
              <p>${lang === 'zh' ? '中国广东省广州市天河区' : 'Tianhe District, Guangzhou, Guangdong, China'}</p>
            </div>
            <div style="margin-bottom:32px">
              <h4>${_('contact.email_label')}</h4>
              <p>hello@bracelet-boutique.com</p>
            </div>
            <div style="margin-bottom:32px">
              <h4>${_('contact.phone_label')}</h4>
              <p>+86 400-888-8888</p>
            </div>
            <div class="glass-card" style="text-align:center">
              <p>${lang === 'zh' ? '客服时间：周一至周日 9:00-21:00' : 'Service Hours: Mon-Sun 9:00-21:00'}</p>
            </div>
          </div>
        </div>
      </div>
      <script>
        async function submitContact(e) {
          e.preventDefault();
          const fd = new FormData(e.target);
          const body = Object.fromEntries(fd.entries());
          const r = await fetch('/api/contact', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body)
          });
          const d = await r.json();
          if (d.success) {
            alert('${_('contact.success')}');
            e.target.reset();
          }
        }
      </script>
    `
  });

  return c.html(html);
});

// Sitemap
pages.get('/sitemap.xml', async (c) => {
  const [products] = await pool.query('SELECT slug FROM products WHERE is_active = 1') as any;

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  xml += '  <url><loc>https://bracelet-boutique.com/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n';
  xml += '  <url><loc>https://bracelet-boutique.com/shop</loc><changefreq>daily</changefreq><priority>0.9</priority></url>\n';
  xml += '  <url><loc>https://bracelet-boutique.com/about</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>\n';
  xml += '  <url><loc>https://bracelet-boutique.com/contact</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>\n';
  for (const p of products as any[]) {
    xml += `  <url><loc>https://bracelet-boutique.com/product/${p.slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
  }
  xml += '</urlset>';

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });
});

export default pages;
