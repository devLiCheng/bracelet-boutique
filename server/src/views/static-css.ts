// Static CSS - served once and cached by browser
export const staticCSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --color-primary:#7C3AED;
  --color-primary-light:#A78BFA;
  --color-primary-dark:#4C1D95;
  --color-cta:#CA8A04;
  --color-cta-light:#EAB308;
  --color-bg:#FAF5FF;
  --color-surface:#FFFFFF;
  --color-text:#4C1D95;
  --color-text-light:#7C6BA7;
  --color-border:rgba(124,58,237,0.12);
  --color-glass:rgba(255,255,255,0.7);
  --color-glass-border:rgba(255,255,255,0.3);
  --font-heading:'Cormorant',Georgia,serif;
  --font-body:'Montserrat','Segoe UI',sans-serif;
  --radius-sm:8px;
  --radius-md:12px;
  --radius-lg:20px;
  --radius-xl:28px;
  --shadow-sm:0 1px 3px rgba(76,29,149,0.06);
  --shadow-md:0 4px 16px rgba(76,29,149,0.08);
  --shadow-lg:0 8px 32px rgba(76,29,149,0.12);
  --shadow-xl:0 16px 48px rgba(76,29,149,0.16);
  --transition:150ms ease-out;
}
html{font-size:16px;line-height:1.5;-webkit-text-size-adjust:100%}
body{
  font-family:var(--font-body);
  background:var(--color-bg);
  color:var(--color-text);
  min-height:100vh;
  display:flex;
  flex-direction:column;
  -webkit-font-smoothing:antialiased;
}
main{flex:1}
h1,h2,h3,h4{font-family:var(--font-heading);font-weight:600;line-height:1.2}
h1{font-size:clamp(2rem,5vw,3.5rem);letter-spacing:-0.02em}
h2{font-size:clamp(1.5rem,4vw,2.5rem)}
h3{font-size:clamp(1.2rem,3vw,1.75rem)}
p{margin-bottom:1rem;color:var(--color-text-light)}

/* Header - Glass Effect */
.header{
  position:sticky;top:0;z-index:100;
  background:var(--color-glass);
  backdrop-filter:blur(20px) saturate(180%);
  -webkit-backdrop-filter:blur(20px) saturate(180%);
  border-bottom:1px solid var(--color-glass-border);
}
.header-inner{
  max-width:1280px;margin:0 auto;padding:0 24px;
  display:flex;align-items:center;justify-content:space-between;height:64px;
}
.logo{
  font-family:var(--font-heading);font-size:1.5rem;font-weight:700;
  color:var(--color-primary-dark);text-decoration:none;
  display:flex;align-items:center;gap:8px;
}
.logo-icon{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--color-primary),var(--color-primary-light));display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.2rem}
.nav-links{display:flex;align-items:center;gap:4px;list-style:none}
.nav-links a{
  color:var(--color-text);text-decoration:none;
  padding:8px 16px;border-radius:var(--radius-sm);
  font-size:0.875rem;font-weight:500;
  transition:all var(--transition);
}
.nav-links a:hover,.nav-links a.active{
  background:rgba(124,58,237,0.08);color:var(--color-primary);
}
.nav-links a.cart-link{position:relative}
.cart-count{
  position:absolute;top:0;right:0;
  background:var(--color-cta);color:#fff;
  font-size:0.7rem;width:18px;height:18px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  transform:translate(25%,-25%);
}
.lang-switch{display:flex;gap:2px;margin-left:8px}
.lang-switch a{
  padding:6px 10px;border-radius:var(--radius-sm);
  font-size:0.8rem;font-weight:600;text-decoration:none;
  color:var(--color-text-light);transition:all var(--transition);
}
.lang-switch a.active{background:var(--color-primary);color:#fff}
.lang-switch a:hover:not(.active){background:rgba(124,58,237,0.08)}
.mobile-menu-btn{display:none;background:none;border:none;cursor:pointer;padding:8px;font-size:1.5rem;color:var(--color-text)}

/* Container */
.container{max-width:1280px;margin:0 auto;padding:0 24px}
.section{padding:80px 0}
.section-header{text-align:center;margin-bottom:48px}
.section-header h2{margin-bottom:12px}
.section-header p{font-size:1.1rem;max-width:600px;margin:0 auto}

/* Hero */
.hero{
  position:relative;overflow:hidden;
  background:linear-gradient(135deg,#FAF5FF 0%,#EDE9FE 50%,#FEF3C7 100%);
  padding:100px 0;
}
.hero::before{
  content:'';position:absolute;top:-50%;right:-20%;
  width:600px;height:600px;border-radius:50%;
  background:radial-gradient(circle,rgba(167,139,250,0.2),transparent 70%);
}
.hero::after{
  content:'';position:absolute;bottom:-30%;left:-10%;
  width:400px;height:400px;border-radius:50%;
  background:radial-gradient(circle,rgba(202,138,4,0.15),transparent 70%);
}
.hero .container{position:relative;z-index:1;text-align:center}
.hero h1{margin-bottom:16px}
.hero p{font-size:1.2rem;max-width:600px;margin:0 auto 32px}

/* Buttons */
.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  padding:12px 28px;border-radius:var(--radius-md);
  font-family:var(--font-body);font-size:0.95rem;font-weight:600;
  text-decoration:none;cursor:pointer;border:none;
  transition:all var(--transition);
}
.btn-primary{background:var(--color-primary);color:#fff;box-shadow:0 4px 16px rgba(124,58,237,0.3)}
.btn-primary:hover{background:var(--color-primary-dark);transform:translateY(-2px);box-shadow:0 6px 24px rgba(124,58,237,0.4)}
.btn-cta{background:var(--color-cta);color:#fff;box-shadow:0 4px 16px rgba(202,138,4,0.3)}
.btn-cta:hover{background:#B8860B;transform:translateY(-2px);box-shadow:0 6px 24px rgba(202,138,4,0.4)}
.btn-outline{background:transparent;color:var(--color-primary);border:2px solid var(--color-primary)}
.btn-outline:hover{background:var(--color-primary);color:#fff}
.btn-sm{padding:8px 18px;font-size:0.85rem}
.btn-lg{padding:16px 36px;font-size:1.1rem}

/* Product Grid */
.product-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:24px}
.product-card{
  background:var(--color-surface);border-radius:var(--radius-lg);
  overflow:hidden;border:1px solid var(--color-border);
  transition:all var(--transition);box-shadow:var(--shadow-sm);
}
.product-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-lg)}
.product-card-image{width:100%;aspect-ratio:1;object-fit:cover;background:linear-gradient(135deg,#FAF5FF,#EDE9FE)}
.product-card-body{padding:20px}
.product-card-category{font-size:0.75rem;color:var(--color-primary);text-transform:uppercase;letter-spacing:0.05em;font-weight:600;margin-bottom:4px}
.product-card-name{font-family:var(--font-heading);font-size:1.1rem;font-weight:600;margin-bottom:8px;color:var(--color-text)}
.product-card-price{display:flex;align-items:center;gap:8px}
.price-current{font-size:1.2rem;font-weight:700;color:var(--color-primary-dark)}
.price-compare{font-size:0.9rem;color:var(--color-text-light);text-decoration:line-through}
.product-card a{text-decoration:none;color:inherit}

/* Category Grid */
.category-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px}
.category-card{
  position:relative;border-radius:var(--radius-lg);overflow:hidden;
  aspect-ratio:3/4;display:flex;align-items:flex-end;
  background:linear-gradient(180deg,transparent 40%,rgba(76,29,149,0.8));
  transition:all var(--transition);cursor:pointer;
}
.category-card:hover{transform:scale(1.02)}
.category-card-content{padding:24px;color:#fff;position:relative;z-index:1}
.category-card h3{font-family:var(--font-heading);font-size:1.5rem;margin-bottom:4px}
.category-card a{color:#fff;text-decoration:none}

/* Footer */
.footer{
  background:var(--color-primary-dark);color:rgba(255,255,255,0.8);
  padding:60px 0 24px;margin-top:auto;
}
.footer-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:40px;margin-bottom:40px}
.footer h4{font-family:var(--font-heading);color:#fff;font-size:1.2rem;margin-bottom:16px}
.footer a{color:rgba(255,255,255,0.7);text-decoration:none;display:block;padding:4px 0;font-size:0.9rem;transition:color var(--transition)}
.footer a:hover{color:#fff}
.footer-bottom{border-top:1px solid rgba(255,255,255,0.1);padding-top:24px;text-align:center;font-size:0.85rem}

/* Glass Card */
.glass-card{
  background:var(--color-glass);backdrop-filter:blur(12px);
  -webkit-backdrop-filter:blur(12px);
  border:1px solid var(--color-glass-border);
  border-radius:var(--radius-lg);padding:32px;
}

/* Form */
.form-group{margin-bottom:20px}
.form-label{display:block;font-weight:500;margin-bottom:6px;font-size:0.9rem}
.form-input{
  width:100%;padding:12px 16px;border:1px solid var(--color-border);
  border-radius:var(--radius-sm);font-family:var(--font-body);font-size:0.95rem;
  transition:border-color var(--transition);background:#fff;
}
.form-input:focus{outline:none;border-color:var(--color-primary);box-shadow:0 0 0 3px rgba(124,58,237,0.1)}

/* Breadcrumb */
.breadcrumb{padding:16px 0;font-size:0.85rem;color:var(--color-text-light)}
.breadcrumb a{color:var(--color-primary);text-decoration:none}
.breadcrumb span{color:var(--color-text-light)}

/* Product Detail */
.product-detail{display:grid;grid-template-columns:1fr 1fr;gap:48px;padding:40px 0}
.product-gallery .main-image{
  width:100%;aspect-ratio:1;object-fit:cover;
  border-radius:var(--radius-lg);background:linear-gradient(135deg,#FAF5FF,#EDE9FE);
}
.product-info h1{font-size:2rem;margin-bottom:8px}
.product-info .material{font-size:0.9rem;color:var(--color-text-light);margin-bottom:16px}
.product-info .price-block{display:flex;align-items:center;gap:12px;margin:24px 0}
.product-info .price-block .current{font-size:2rem;font-weight:700;color:var(--color-primary-dark)}
.product-info .price-block .compare{font-size:1.2rem;color:var(--color-text-light);text-decoration:line-through}
.product-info .description{line-height:1.8;color:var(--color-text-light);margin-bottom:24px}

/* Cart */
.cart-table{width:100%;border-collapse:collapse}
.cart-table th{text-align:left;padding:12px;border-bottom:2px solid var(--color-border);font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-text-light)}
.cart-table td{padding:16px 12px;border-bottom:1px solid var(--color-border)}
.cart-product{display:flex;align-items:center;gap:16px}
.cart-product-image{width:80px;height:80px;border-radius:var(--radius-sm);object-fit:cover;background:linear-gradient(135deg,#FAF5FF,#EDE9FE)}

/* Responsive */
@media(max-width:768px){
  .nav-links{display:none}
  .mobile-menu-btn{display:block}
  .nav-links.open{
    display:flex;flex-direction:column;position:absolute;
    top:64px;left:0;right:0;background:var(--color-surface);
    border-bottom:1px solid var(--color-border);
    padding:16px;gap:4px;box-shadow:var(--shadow-lg);
  }
  .nav-links.open a{padding:12px 16px;width:100%}
  .product-detail{grid-template-columns:1fr;gap:24px}
  .section{padding:48px 0}
  .hero{padding:60px 0}
  .product-grid{grid-template-columns:repeat(auto-fill,minmax(240px,1fr))}
}
@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:0.01ms!important;transition-duration:0.01ms!important}
}
`;

export function cssResponse() {
  return new Response(staticCSS, {
    headers: {
      'Content-Type': 'text/css; charset=utf-8',
      'Cache-Control': 'public, max-age=604800, immutable',
      'Vary': 'Accept-Encoding',
    },
  });
}
