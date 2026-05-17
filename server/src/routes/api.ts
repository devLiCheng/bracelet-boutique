import { Hono } from 'hono';
import pool from '../db/connection';
import type { Lang } from '../i18n/translations';

const api = new Hono();

// Get all categories
api.get('/categories', async (c) => {
  const lang = c.get('lang') as Lang;
  const [rows] = await pool.query(
    'SELECT id, slug, name_zh, name_en, description_zh, description_en, image_url FROM categories WHERE is_active = 1 ORDER BY sort_order'
  );
  return c.json(rows);
});

// Get products with optional filtering
api.get('/products', async (c) => {
  const lang = c.get('lang') as Lang;
  const category = c.req.query('category');
  const featured = c.req.query('featured');
  const search = c.req.query('search');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '12');
  const offset = (page - 1) * limit;

  let sql = `SELECT p.*, 
    (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 LIMIT 1) as primary_image
    FROM products p WHERE p.is_active = 1`;
  const params: any[] = [];

  if (category) {
    sql += ' AND p.category_id IN (SELECT id FROM categories WHERE slug = ?)';
    params.push(category);
  }
  if (featured === '1') {
    sql += ' AND p.is_featured = 1';
  }
  if (search) {
    sql += ' AND (p.name_zh LIKE ? OR p.name_en LIKE ? OR p.description_zh LIKE ? OR p.description_en LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  // Get total count
  const countSql = sql.replace(/SELECT p\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
  const [countRows] = await pool.query(countSql, params) as any;
  const total = countRows[0]?.total || 0;

  sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await pool.query(sql, params);

  return c.json({
    products: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  });
});

// Get single product by slug
api.get('/products/:slug', async (c) => {
  const slug = c.req.param('slug');
  const [rows] = await pool.query(
    'SELECT * FROM products WHERE slug = ? AND is_active = 1',
    [slug]
  ) as any;

  if (!rows[0]) return c.json({ error: 'Product not found' }, 404);

  const product = rows[0];

  // Get images
  const [images] = await pool.query(
    'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order',
    [product.id]
  );
  product.images = images;

  // Get variants
  const [variants] = await pool.query(
    'SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order',
    [product.id]
  );
  product.variants = variants;

  // Get reviews
  const [reviews] = await pool.query(
    'SELECT r.*, u.name as user_name FROM reviews r LEFT JOIN users u ON r.user_id = u.id WHERE r.product_id = ? AND r.is_approved = 1 ORDER BY r.created_at DESC',
    [product.id]
  );
  product.reviews = reviews;

  // Get related products (same category)
  const [related] = await pool.query(
    `SELECT p.*, (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 LIMIT 1) as primary_image
     FROM products p WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1 LIMIT 4`,
    [product.category_id, product.id]
  );
  product.related = related;

  return c.json(product);
});

// Cart - get items by session
api.get('/cart', async (c) => {
  const sessionId = c.req.header('X-Session-ID') || c.req.query('session');
  if (!sessionId) return c.json({ items: [], total: 0 });

  const [rows] = await pool.query(
    `SELECT ci.*, p.name_zh, p.name_en, p.price, p.slug,
      (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 LIMIT 1) as image_url
     FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.session_id = ?`,
    [sessionId]
  ) as any;

  const items = rows;
  const total = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);

  return c.json({ items, total });
});

// Cart - add item
api.post('/cart', async (c) => {
  const sessionId = c.req.header('X-Session-ID');
  if (!sessionId) return c.json({ error: 'Session ID required' }, 400);

  const body = await c.req.json();
  const { product_id, quantity = 1 } = body;

  // Check if already in cart
  const [existing] = await pool.query(
    'SELECT * FROM cart_items WHERE session_id = ? AND product_id = ?',
    [sessionId, product_id]
  ) as any;

  if (existing[0]) {
    await pool.query(
      'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?',
      [quantity, existing[0].id]
    );
  } else {
    await pool.query(
      'INSERT INTO cart_items (session_id, product_id, quantity) VALUES (?, ?, ?)',
      [sessionId, product_id, quantity]
    );
  }

  return c.json({ success: true });
});

// Cart - update quantity
api.put('/cart/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  await pool.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [body.quantity, id]);
  return c.json({ success: true });
});

// Cart - remove item
api.delete('/cart/:id', async (c) => {
  const id = c.req.param('id');
  await pool.query('DELETE FROM cart_items WHERE id = ?', [id]);
  return c.json({ success: true });
});

// Checkout - create order
api.post('/checkout', async (c) => {
  const body = await c.req.json();
  const sessionId = c.req.header('X-Session-ID');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Create user if not exists
    const [users] = await conn.query('SELECT id FROM users WHERE email = ?', [body.email]) as any;
    let userId = users[0]?.id;
    if (!userId) {
      const [result] = await conn.query(
        'INSERT INTO users (email, name, phone) VALUES (?, ?, ?)',
        [body.email, body.name, body.phone]
      ) as any;
      userId = result.insertId;
    }

    // Calculate order total from cart
    const [cartItems] = await conn.query(
      `SELECT ci.*, p.price, p.name_zh, p.name_en FROM cart_items ci 
       JOIN products p ON ci.product_id = p.id WHERE ci.session_id = ?`,
      [sessionId]
    ) as any;

    if (!cartItems.length) {
      await conn.rollback();
      return c.json({ error: 'Cart is empty' }, 400);
    }

    const totalAmount = cartItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    const orderNumber = 'BB' + Date.now().toString(36).toUpperCase();

    // Create order
    const [orderResult] = await conn.query(
      `INSERT INTO orders (order_number, user_id, total_amount, shipping_name, shipping_phone, shipping_address, shipping_city, shipping_state, shipping_zip, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderNumber, userId, totalAmount, body.name, body.phone, body.address, body.city, body.state, body.zip, body.notes]
    ) as any;
    const orderId = orderResult.insertId;

    // Create order items
    for (const item of cartItems) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.name_zh, item.quantity, item.price, item.price * item.quantity]
      );
      // Reduce stock
      await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    // Clear cart
    await conn.query('DELETE FROM cart_items WHERE session_id = ?', [sessionId]);

    await conn.commit();

    return c.json({ success: true, order_number: orderNumber, order_id: orderId, total: totalAmount });
  } catch (err: any) {
    await conn.rollback();
    return c.json({ error: err.message }, 500);
  } finally {
    conn.release();
  }
});

// Contact form submission
api.post('/contact', async (c) => {
  const body = await c.req.json();
  await pool.query(
    'INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)',
    [body.name, body.email, body.phone, body.message]
  );
  return c.json({ success: true });
});

// Newsletter subscription (simple)
api.post('/subscribe', async (c) => {
  const body = await c.req.json();
  // Just acknowledge for now
  return c.json({ success: true, message: 'Subscribed successfully!' });
});

export default api;
