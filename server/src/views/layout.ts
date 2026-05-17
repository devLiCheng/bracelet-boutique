import type { Lang } from '../i18n/translations';
import { t } from '../i18n/translations';

interface LayoutProps {
  lang: Lang;
  title: string;
  description: string;
  currentPath?: string;
  children: string;
}

const headerFooterCache: Record<Lang, { header: string; footer: string }> = {} as any;

const precomputeHeaderFooter = (lang: Lang) => {
  if (headerFooterCache[lang]) return headerFooterCache[lang];
  const _ = (key: string) => t(lang, key);

  const header = `
<header class="h"><div class="hi"><a href="/?lang=${lang}" class="lo"><span class="li">💎</span>${_('site.name')}</a><nav><ul class="nl" id="nv"><li><a href="/?lang=${lang}" data-a="/">${_('nav.home')}</a></li><li><a href="/shop?lang=${lang}" data-a="/shop">${_('nav.shop')}</a></li><li><a href="/about?lang=${lang}" data-a="/about">${_('nav.about')}</a></li><li><a href="/contact?lang=${lang}" data-a="/contact">${_('nav.contact')}</a></li><li><a href="/cart?lang=${lang}" class="cl" data-a="/cart">🛒<span class="cc" id="ct" style="display:none">0</span></a></li><li class="ls"><a href="?lang=zh" data-l="zh">中</a><a href="?lang=en" data-l="en">EN</a></li></ul><button class="mb" onclick="document.getElementById('nv').classList.toggle('o')" aria-label="Menu">☰</button></nav></div></header>`;

  const footer = `
<footer class="f"><div class="c"><div class="fg"><div><h4>${_('site.name')}</h4><p style="color:rgba(255,255,255,0.6);margin-top:8px;font-size:0.9rem">${_('site.tagline')}</p></div><div><h4>${_('footer.about')}</h4><a href="/about?lang=${lang}">${_('nav.about')}</a><a href="/contact?lang=${lang}">${_('nav.contact')}</a></div><div><h4>${_('footer.customer_service')}</h4><a href="#">${_('footer.shipping')}</a><a href="#">${_('footer.returns')}</a><a href="#">${_('footer.faq')}</a></div><div><h4>${_('footer.follow_us')}</h4><p style="color:rgba(255,255,255,0.5);font-size:0.9rem">WeChat · Instagram · Pinterest</p></div></div><div class="fb">&copy; ${new Date().getFullYear()} ${_('site.name')}. ${_('footer.rights')}.<span style="margin-left:16px"><a href="#">${_('footer.privacy')}</a></span><span style="margin-left:16px"><a href="#">${_('footer.terms')}</a></span></div></div></footer>`;

  headerFooterCache[lang] = { header, footer };
  return { header, footer };
};

export const layout = (props: LayoutProps): string => {
  const { lang, title, description, currentPath = '/', children } = props;
  const { header, footer } = precomputeHeaderFooter(lang);

  // Critical CSS inlined for instant rendering (minimal, above-fold)
  const criticalCSS = `
:root{--p:#7C3AED;--pl:#A78BFA;--pd:#4C1D95;--a:#CA8A04;--bg:#FAF5FF;--s:#fff;--t:#4C1D95;--tl:#7C6BA7;--b:rgba(124,58,237,0.12);--g:rgba(255,255,255,0.7);--gb:rgba(255,255,255,0.3);--fh:'Cormorant',Georgia,serif;--fb:'Montserrat','Segoe UI',-apple-system,BlinkMacSystemFont,sans-serif;--rs:8px;--rm:12px;--rl:20px;--ts:150ms ease-out}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{font-size:16px;line-height:1.5;-webkit-text-size-adjust:100%}
body{font-family:var(--fb);background:var(--bg);color:var(--t);min-height:100vh;display:flex;flex-direction:column;-webkit-font-smoothing:antialiased}
main{flex:1}
h1,h2,h3,h4{font-family:var(--fh);font-weight:600;line-height:1.2}
h1{font-size:clamp(2rem,5vw,3.5rem);letter-spacing:-0.02em}
h2{font-size:clamp(1.5rem,4vw,2.5rem)}
h3{font-size:clamp(1.2rem,3vw,1.75rem)}
p{margin-bottom:1rem;color:var(--tl)}
.h{position:sticky;top:0;z-index:100;background:var(--g);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);border-bottom:1px solid var(--gb)}
.hi{max-width:1280px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between;height:64px}
.lo{font-family:var(--fh);font-size:1.5rem;font-weight:700;color:var(--pd);text-decoration:none;display:flex;align-items:center;gap:8px}
.li{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--p),var(--pl));display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.2rem}
.nl{display:flex;align-items:center;gap:4px;list-style:none}
.nl a{color:var(--t);text-decoration:none;padding:8px 16px;border-radius:var(--rs);font-size:0.875rem;font-weight:500;transition:all var(--ts)}
.nl a:hover,.nl a.ac{background:rgba(124,58,237,0.08);color:var(--p)}
.cl{position:relative}
.cc{position:absolute;top:0;right:0;background:var(--a);color:#fff;font-size:0.7rem;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;transform:translate(25%,-25%)}
.ls{display:flex;gap:2px;margin-left:8px}
.ls a{padding:6px 10px;border-radius:var(--rs);font-size:0.8rem;font-weight:600;text-decoration:none;color:var(--tl);transition:all var(--ts)}
.ls a.ac{background:var(--p);color:#fff}
.mb{display:none;background:none;border:none;cursor:pointer;padding:8px;font-size:1.5rem;color:var(--t)}
.c{max-width:1280px;margin:0 auto;padding:0 24px}
.s{padding:80px 0}
.sh{text-align:center;margin-bottom:48px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 28px;border-radius:var(--rm);font-family:var(--fb);font-size:0.95rem;font-weight:600;text-decoration:none;cursor:pointer;border:none;transition:all var(--ts)}
.bp{background:var(--p);color:#fff;box-shadow:0 4px 16px rgba(124,58,237,0.3)}
.bp:hover{background:var(--pd);transform:translateY(-2px)}
.ba{background:var(--a);color:#fff;box-shadow:0 4px 16px rgba(202,138,4,0.3)}
.ba:hover{background:#B8860B;transform:translateY(-2px)}
.bo{background:transparent;color:var(--p);border:2px solid var(--p)}
.bo:hover{background:var(--p);color:#fff}
.bsm{padding:8px 18px;font-size:0.85rem}
.blg{padding:16px 36px;font-size:1.1rem}
.hr{position:relative;overflow:hidden;background:linear-gradient(135deg,#FAF5FF 0%,#EDE9FE 50%,#FEF3C7 100%);padding:100px 0}
.hr::before{content:'';position:absolute;top:-50%;right:-20%;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(167,139,250,0.2),transparent 70%)}
.hr .c{position:relative;z-index:1;text-align:center}
.pg{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:24px}
.pc{background:var(--s);border-radius:var(--rl);overflow:hidden;border:1px solid var(--b);transition:all var(--ts);box-shadow:0 1px 3px rgba(76,29,149,0.06)}
.pc:hover{transform:translateY(-4px);box-shadow:0 8px 32px rgba(76,29,149,0.12)}
.pci{width:100%;aspect-ratio:1;object-fit:cover;background:linear-gradient(135deg,#FAF5FF,#EDE9FE)}
.pcb{padding:20px}
.pcn{font-family:var(--fh);font-size:1.1rem;font-weight:600;margin-bottom:8px;color:var(--t)}
.pcp{display:flex;align-items:center;gap:8px}
.pcc{font-size:1.2rem;font-weight:700;color:var(--pd)}
.pco{font-size:0.9rem;color:var(--tl);text-decoration:line-through}
.pc a{text-decoration:none;color:inherit}
.cg{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px}
.ccd{position:relative;border-radius:var(--rl);overflow:hidden;aspect-ratio:3/4;display:flex;align-items:flex-end;transition:all var(--ts);cursor:pointer}
.ccd:hover{transform:scale(1.02)}
.ccc{padding:24px;color:#fff;position:relative;z-index:1}
.ccc h3{font-family:var(--fh);font-size:1.5rem;margin-bottom:4px}
.ccc a{color:#fff;text-decoration:none}
.gc{background:var(--g);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid var(--gb);border-radius:var(--rl);padding:32px}
.f{background:var(--pd);color:rgba(255,255,255,0.8);padding:60px 0 24px;margin-top:auto}
.fg{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:40px;margin-bottom:40px}
.f h4{font-family:var(--fh);color:#fff;font-size:1.2rem;margin-bottom:16px}
.f a{color:rgba(255,255,255,0.7);text-decoration:none;display:block;padding:4px 0;font-size:0.9rem;transition:color var(--ts)}
.f a:hover{color:#fff}
.fb{border-top:1px solid rgba(255,255,255,0.1);padding-top:24px;text-align:center;font-size:0.85rem}
.fm{margin-bottom:20px}
.fl{display:block;font-weight:500;margin-bottom:6px;font-size:0.9rem}
.fi{width:100%;padding:12px 16px;border:1px solid var(--b);border-radius:var(--rs);font-family:var(--fb);font-size:0.95rem;transition:border-color var(--ts);background:#fff}
.fi:focus{outline:none;border-color:var(--p);box-shadow:0 0 0 3px rgba(124,58,237,0.1)}
.bc{padding:16px 0;font-size:0.85rem;color:var(--tl)}
.bc a{color:var(--p);text-decoration:none}
.pd{display:grid;grid-template-columns:1fr 1fr;gap:48px;padding:40px 0}
.pdi .mi{width:100%;aspect-ratio:1;object-fit:cover;border-radius:var(--rl);background:linear-gradient(135deg,#FAF5FF,#EDE9FE)}
.ct{width:100%;border-collapse:collapse}
.ct th{text-align:left;padding:12px;border-bottom:2px solid var(--b);font-size:0.85rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--tl)}
.ct td{padding:16px 12px;border-bottom:1px solid var(--b)}
.cp{display:flex;align-items:center;gap:16px}
.cpi{width:80px;height:80px;border-radius:var(--rs);object-fit:cover;background:linear-gradient(135deg,#FAF5FF,#EDE9FE)}
@media(max-width:768px){.nl{display:none}.mb{display:block}.nl.o{display:flex;flex-direction:column;position:absolute;top:64px;left:0;right:0;background:var(--s);border-bottom:1px solid var(--b);padding:16px;gap:4px;box-shadow:0 8px 32px rgba(76,29,149,0.12)}.nl.o a{padding:12px 16px;width:100%}.pd{grid-template-columns:1fr;gap:24px}.s{padding:48px 0}.hr{padding:60px 0}.pg{grid-template-columns:repeat(auto-fill,minmax(240px,1fr))}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:0.01ms!important;transition-duration:0.01ms!important}}
`.replace(/\n/g, '');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<meta name="robots" content="index,follow">
<link rel="alternate" hreflang="zh" href="https://bracelet-boutique.com/zh${currentPath}">
<link rel="alternate" hreflang="en" href="https://bracelet-boutique.com/en${currentPath}">
<link rel="canonical" href="https://bracelet-boutique.com/${lang}${currentPath}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:type" content="website">
<meta property="og:locale" content="${lang === 'zh' ? 'zh_CN' : 'en_US'}">
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<style>${criticalCSS}</style>
<link rel="stylesheet" href="/static/style.css" media="print" onload="this.media='all';this.onload=null">
<noscript><link rel="stylesheet" href="/static/style.css"></noscript>
</head>
<body>
${header}
<main>${children}</main>
${footer}
<script>document.querySelectorAll('[data-a]').forEach(a=>{const p='${currentPath}';if(a.dataset.a==='/'&&p.match(/^\\/product\\//))return;a.classList.toggle('ac',p.startsWith(a.dataset.a))});document.querySelectorAll('[data-l]').forEach(a=>a.classList.toggle('ac',a.dataset.l==='${lang}'));</script>
<script>const s=localStorage.sid||(Date.now().toString(36)+Math.random().toString(36).slice(2,8));localStorage.sid=s;fetch('/api/cart?session='+s).then(r=>r.json()).then(d=>{const c=d.items.reduce((x,i)=>x+i.quantity,0);if(c){(a=document.getElementById('ct')).style.display='flex';a.textContent=c}});</script>
</body>
</html>`;
};
