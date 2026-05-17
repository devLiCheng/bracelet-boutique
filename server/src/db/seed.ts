import pool from './connection';

async function seed() {
  const conn = await pool.getConnection();
  try {
    console.log('🌱 Seeding database...');

    // Categories
    const categories = [
      ['crystal-bracelet', '水晶手串', 'Crystal Bracelets', '天然水晶手串系列，蕴含自然能量', 'Natural crystal bracelet collection, infused with natural energy', 1],
      ['necklace', '项链', 'Necklaces', '精美水晶项链，优雅与能量并存', 'Exquisite crystal necklaces, elegance meets energy', 2],
      ['bracelet', '手链', 'Bracelets', '精致手链，日常佩戴之选', 'Delicate bracelets for everyday wear', 3],
      ['raw-stone', '原石摆件', 'Raw Crystal Stones', '天然水晶原石，居家能量装饰', 'Natural raw crystal stones for home energy decoration', 4],
    ];
    for (const c of categories) {
      await conn.query(
        'INSERT INTO categories (slug, name_zh, name_en, description_zh, description_en, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
        c
      );
    }
    console.log('✅ Categories inserted');

    // Products
    const products = [
      { slug: 'amethyst-bracelet', name_zh: '紫水晶手串', name_en: 'Amethyst Bracelet',
        desc_zh: '天然紫水晶手串，8mm圆珠，助眠安神，提升直觉力', desc_en: 'Natural amethyst bracelet, 8mm beads, promotes calm sleep and enhances intuition',
        detail_zh: '精选乌拉圭紫水晶，色泽深邃均匀，晶体通透。紫水晶被誉为"智慧之石"，能帮助缓解压力、改善睡眠质量、增强灵性和直觉力。每颗珠子均经过手工打磨抛光，搭配弹力线穿制，适合日常佩戴。',
        detail_en: 'Premium Uruguayan amethyst with deep, even color and crystal clarity. Known as the "Stone of Wisdom", amethyst helps relieve stress, improve sleep quality, and enhance spirituality and intuition. Each bead is hand-polished and strung on elastic cord.',
        material_zh: '天然紫水晶', material_en: 'Natural Amethyst', price: 168.00, compare_price: 228.00, stock: 50, cat_id: 1, featured: 1, weight: 25 },
      { slug: 'rose-quartz-bracelet', name_zh: '粉晶手串', name_en: 'Rose Quartz Bracelet',
        desc_zh: '天然粉晶手串，10mm圆珠，招桃花增人缘，舒缓情绪', desc_en: 'Natural rose quartz bracelet, 10mm beads, attracts love and soothes emotions',
        detail_zh: '精选马达加斯加粉晶，色泽粉嫩柔和，晶体温润。粉晶被称为"爱情之石"，有助于打开心轮、增进人际关系、提升自爱和接纳。10mm大颗珠子更显质感，配以银色隔珠点缀。',
        detail_en: 'Premium Madagascar rose quartz with soft pink hue and gentle luster. Known as the "Stone of Love", rose quartz helps open the heart chakra, improve relationships, and enhance self-love and acceptance. Features 10mm beads with silver spacer accents.',
        material_zh: '天然粉晶', material_en: 'Natural Rose Quartz', price: 138.00, compare_price: 188.00, stock: 80, cat_id: 1, featured: 1, weight: 30 },
      { slug: 'obsidian-bracelet', name_zh: '黑曜石手串', name_en: 'Obsidian Bracelet',
        desc_zh: '天然黑曜石手串，12mm圆珠，辟邪化煞，增强气场', desc_en: 'Natural obsidian bracelet, 12mm beads, protective energy shielding',
        detail_zh: '精选墨西哥黑曜石，色泽漆黑如墨，光泽明亮。黑曜石是强大的保护之石，能有效吸收负能量、辟邪化煞、增强个人气场。12mm大珠设计，沉稳大气，男女皆宜。',
        detail_en: 'Premium Mexican obsidian with deep black color and bright luster. Obsidian is a powerful protective stone that absorbs negative energy and strengthens personal aura. 12mm large bead design, suitable for all genders.',
        material_zh: '天然黑曜石', material_en: 'Natural Obsidian', price: 198.00, compare_price: 268.00, stock: 35, cat_id: 1, featured: 1, weight: 40 },
      { slug: 'tiger-eye-bracelet', name_zh: '虎眼石手串', name_en: 'Tiger Eye Bracelet',
        desc_zh: '天然虎眼石手串，10mm圆珠，招财进宝，增强自信', desc_en: 'Natural tiger eye bracelet, 10mm beads, attracts wealth and boosts confidence',
        detail_zh: '精选南非虎眼石，丝绢光泽明显，猫眼效应强烈。虎眼石被视为"财富之石"，有助于增强决策力、提升自信心、招来财运。金棕色泽华丽大气，适合商务场合佩戴。',
        detail_en: 'Premium South African tiger eye with strong chatoyancy and silky luster. Known as the "Stone of Wealth", tiger eye enhances decision-making, boosts confidence, and attracts prosperity. Golden-brown hue is elegant for business wear.',
        material_zh: '天然虎眼石', material_en: 'Natural Tiger Eye', price: 158.00, compare_price: 208.00, stock: 45, cat_id: 1, featured: 1, weight: 28 },
      { slug: 'aquamarine-necklace', name_zh: '海蓝宝项链', name_en: 'Aquamarine Necklace',
        desc_zh: '天然海蓝宝项链，水滴形吊坠，清爽优雅', desc_en: 'Natural aquamarine necklace, teardrop pendant, fresh and elegant',
        detail_zh: '精选巴西海蓝宝，色泽清透如海水，晶体纯净。海蓝宝是"勇气之石"，象征着青春与希望，有助于提升沟通表达能力和勇气。水滴形切割搭配925银链，优雅灵动。',
        detail_en: 'Premium Brazilian aquamarine with ocean-clear color and pure crystal. Known as the "Stone of Courage", aquamarine symbolizes youth and hope, enhancing communication and bravery. Teardrop cut with 925 silver chain.',
        material_zh: '天然海蓝宝 + 925银', material_en: 'Natural Aquamarine + 925 Silver', price: 368.00, compare_price: 458.00, stock: 20, cat_id: 2, featured: 1, weight: 15 },
      { slug: 'moonstone-necklace', name_zh: '月光石项链', name_en: 'Moonstone Necklace',
        desc_zh: '天然月光石项链，圆形吊坠，温柔静谧', desc_en: 'Natural moonstone necklace, round pendant, gentle and serene',
        detail_zh: '精选印度月光石，蓝色光晕明显，温润如玉。月光石被称为"恋人之石"，有助于平衡情绪、提升直觉、增进感情和谐。圆形素面切割搭配玫瑰金链，温柔浪漫。',
        detail_en: 'Premium Indian moonstone with distinct blue sheen and jade-like warmth. Known as the "Lovers Stone", moonstone balances emotions, enhances intuition, and promotes relationship harmony. Round cabochon with rose gold chain.',
        material_zh: '天然月光石 + 玫瑰金', material_en: 'Natural Moonstone + Rose Gold', price: 298.00, compare_price: 388.00, stock: 25, cat_id: 2, featured: 1, weight: 12 },
      { slug: 'citrine-bracelet', name_zh: '黄水晶手链', name_en: 'Citrine Bracelet',
        desc_zh: '天然黄水晶手链，8mm切面珠，招财旺事业', desc_en: 'Natural citrine bracelet, 8mm faceted beads, prosperity booster',
        detail_zh: '精选巴西黄水晶，色泽明亮如阳光，切面工艺更显闪耀。黄水晶是"财富之石"，有助于吸引财富、激发创造力、提升事业发展。8mm小切面珠设计，精致闪耀，日常百搭。',
        detail_en: 'Premium Brazilian citrine with bright sun-like color and faceted cut for extra sparkle. Known as the "Stone of Wealth", citrine attracts prosperity, stimulates creativity, and boosts career growth. 8mm faceted beads, delicate and versatile.',
        material_zh: '天然黄水晶', material_en: 'Natural Citrine', price: 218.00, compare_price: 288.00, stock: 40, cat_id: 3, featured: 1, weight: 18 },
      { slug: 'garnet-bracelet', name_zh: '石榴石手链', name_en: 'Garnet Bracelet',
        desc_zh: '天然石榴石手链，6mm多圈，活血养颜', desc_en: 'Natural garnet bracelet, 6mm multi-wrap, revitalizing beauty',
        detail_zh: '精选莫桑比克石榴石，色泽红润如酒，晶体通透。石榴石被称为"女人之石"，有助于活血养颜、改善气血、增强生命力。6mm小珠三圈设计，可作手链或项链佩戴。',
        detail_en: 'Premium Mozambique garnet with rich wine-red color and crystal clarity. Known as the "Stone of Women", garnet revitalizes energy, improves blood circulation, and enhances vitality. 6mm triple-wrap design, versatile as bracelet or necklace.',
        material_zh: '天然石榴石', material_en: 'Natural Garnet', price: 248.00, compare_price: 318.00, stock: 30, cat_id: 3, featured: 1, weight: 22 },
      { slug: 'labradorite-pendant', name_zh: '拉长石吊坠', name_en: 'Labradorite Pendant',
        desc_zh: '天然拉长石吊坠，随形设计，神秘幻彩', desc_en: 'Natural labradorite pendant, freeform design, mystical iridescence',
        detail_zh: '精选芬兰拉长石，光谱效应明显，蓝绿幻彩随光流转。拉长石是"魔法之石"，有助于提升灵性觉知、增强直觉、保护气场。随形切割保留自然纹理，每件独一无二。',
        detail_en: 'Premium Finnish labradorite with strong labradorescence, blue-green flashes that shift with light. Known as the "Stone of Magic", labradorite enhances spiritual awareness, intuition, and aura protection. Freeform cut preserves natural patterns.',
        material_zh: '天然拉长石 + 925银', material_en: 'Natural Labradorite + 925 Silver', price: 328.00, compare_price: 398.00, stock: 15, cat_id: 2, featured: 0, weight: 10 },
      { slug: 'clear-quartz-cluster', name_zh: '白水晶簇', name_en: 'Clear Quartz Cluster',
        desc_zh: '天然白水晶簇摆件，净化能量，提升空间气场', desc_en: 'Natural clear quartz cluster, energy cleansing, elevates space energy',
        detail_zh: '精选巴西白水晶簇，晶体完整通透，形态自然优美。白水晶是"能量之王"，能净化空间负能量、放大正面能量、提升专注力。适合摆放于办公桌、卧室或冥想空间。',
        detail_en: 'Premium Brazilian clear quartz cluster with intact, transparent crystals in natural formations. Known as the "Master Healer", clear quartz cleanses negative energy, amplifies positive energy, and enhances focus. Ideal for desk, bedroom, or meditation space.',
        material_zh: '天然白水晶', material_en: 'Natural Clear Quartz', price: 498.00, compare_price: 628.00, stock: 10, cat_id: 4, featured: 1, weight: 200 },
    ];

    for (const p of products) {
      await conn.query(
        `INSERT INTO products (slug, name_zh, name_en, description_zh, description_en, detail_zh, detail_en, material_zh, material_en, price, compare_at_price, stock, category_id, is_featured, weight_grams)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.slug, p.name_zh, p.name_en, p.desc_zh, p.desc_en, p.detail_zh, p.detail_en, p.material_zh, p.material_en, p.price, p.compare_price, p.stock, p.cat_id, p.featured, p.weight]
      );
    }
    console.log('✅ Products inserted');

    // Product images
    const [allProducts] = await conn.query('SELECT id, slug, name_zh, name_en FROM products ORDER BY id') as any;
    const colors = ['7C3AED', 'A78BFA', '4C1D95', 'CA8A04', '3B82F6', 'EC4899', 'F59E0B', 'EF4444', '6366F1', '14B8A6'];

    for (let i = 0; i < allProducts.length; i++) {
      const p = allProducts[i];
      const color = colors[i % colors.length];
      await conn.query(
        'INSERT INTO product_images (product_id, image_url, alt_zh, alt_en, sort_order, is_primary) VALUES (?, ?, ?, ?, 0, 1)',
        [p.id, `https://placehold.co/800x800/${color}/FFFFFF?text=${encodeURIComponent(p.name_en)}`, p.name_zh, p.name_en]
      );
      await conn.query(
        'INSERT INTO product_images (product_id, image_url, alt_zh, alt_en, sort_order, is_primary) VALUES (?, ?, ?, ?, 1, 0)',
        [p.id, `https://placehold.co/800x800/FAF5FF/${color}?text=${encodeURIComponent(p.name_en)}+Detail`, `${p.name_zh} 细节`, `${p.name_en} Detail`]
      );
    }
    console.log('✅ Product images inserted');

    // Sample reviews
    const reviews = [
      [1, 5, '紫水晶色泽很美，戴上后睡眠质量明显改善！', 'Beautiful amethyst color! My sleep quality has noticeably improved!'],
      [1, 4, '做工精细，珠子大小均匀，很满意', 'Fine craftsmanship, evenly sized beads, very satisfied'],
      [2, 5, '粉晶颜色非常温柔，送女友她很喜欢', 'Lovely gentle pink color, my girlfriend loved it'],
      [2, 5, '品质很好，包装也很精美，客服态度好', 'Great quality, beautiful packaging, excellent customer service'],
      [3, 4, '黑曜石很有质感，戴上很有安全感', 'The obsidian has great texture, feels very protective'],
      [5, 5, '海蓝宝颜色太美了，像把海洋戴在身上', 'The aquamarine color is stunning, like wearing the ocean'],
      [7, 5, '黄水晶切面很闪，同事都问在哪里买的', 'Citrine facets sparkle beautifully, coworkers keep asking where I got it'],
      [8, 5, '石榴石三圈设计很特别，显白又好看', 'Unique triple-wrap garnet design, makes skin look fair and beautiful'],
    ];
    for (const r of reviews) {
      await conn.query(
        'INSERT INTO reviews (product_id, rating, content_zh, content_en) VALUES (?, ?, ?, ?)',
        r
      );
    }
    console.log('✅ Reviews inserted');

    console.log('🎉 Database seeded successfully!');
  } catch (err: any) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    conn.release();
    await pool.end();
  }
}

seed();
