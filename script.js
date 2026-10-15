/* ==================================================================
   SCRIPT.JS — Bohuslava Rozsypalová — Portfolio & CV
   ------------------------------------------------------------------
   Načítava sa s atribútom "defer" — beží až po načítaní celého HTML.
   Obsah:
     JS 0  Texty podľa jazyka (en / sk / de + window.I18N zo stránky)
     JS 1  Obrázky — náhradný text pri chybe načítania
     JS 2  Mobilné menu (hamburger)
     JS 3  Navigácia — aktívne menu, pipeline, šípky "scroll", späť hore
     JS 4  Postupné objavenie prvkov pri scrollovaní
     JS 5  Kontaktný formulár — zakázané slová + odoslanie (FormSubmit)
     JS 6  Motto — canvas scratch efekt
     JS 7  Lightbox
     JS 8  Galéria certifikátov (dáta + kategórie → detail → lightbox)
     JS 9  Pexeso (memory game)
     JS 10 Typewriter v úvode
     JS 11 Ďalšie stránky — 3D tilt + štítok "Coming soon"
   ================================================================== */
'use strict';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => window.matchMedia('(max-width: 900px)').matches;

/* ============================================================
   JS 0: Texty podľa jazyka
   ------------------------------------------------------------
   Jazyk sa zistí z <html lang="...">. Ak stránka definuje
   window.I18N (sk.html, de.html), jej texty majú prednosť.
   ============================================================ */
const LANG = (document.documentElement.lang || 'en').slice(0, 2).toLowerCase();
const UI_TEXTS = {
  en: {
    sending: 'Sending…',
    sendBtn: 'Send message',
    formOk: '✓ Message sent — thank you! I will get back to you soon.',
    formErr: 'Something went wrong. Please email b.rozsypalova@gmail.com directly.',
    scratchHint: 'scratch to reveal',
    moves: 'Moves: ',
    pairs: 'Pairs: ',
    solved: (n) => `🎉 Solved in ${n} moves!`,
    soon: 'Coming soon',
    bannedOne: (w) => `Please leave out the word “${w}”.`,
    bannedMany: (w) => `Please leave out these words: ${w}.`,
    tooManyLinks: (max) => `The message can contain at most ${max} links.`,
    blocked: 'Message not sent — please fix the highlighted field.'
  },
  sk: {
    soon: 'Čoskoro',
    bannedOne: (w) => `Prosím, vynechajte slovo „${w}“.`,
    bannedMany: (w) => `Prosím, vynechajte slová: ${w}.`,
    tooManyLinks: (max) => `Správa môže obsahovať najviac ${max} odkazy.`,
    blocked: 'Správa nebola odoslaná — upravte, prosím, označené pole.'
  },
  de: {
    soon: 'Demnächst',
    bannedOne: (w) => `Bitte verzichten Sie auf das Wort „${w}“.`,
    bannedMany: (w) => `Bitte verzichten Sie auf diese Wörter: ${w}.`,
    tooManyLinks: (max) => `Die Nachricht darf höchstens ${max} Links enthalten.`,
    blocked: 'Nachricht nicht gesendet — bitte das markierte Feld korrigieren.'
  }
};
/* Poradie: angličtina (základ) ← texty jazyka ← window.I18N zo stránky */
const T = { ...UI_TEXTS.en, ...(UI_TEXTS[LANG] || {}), ...(window.I18N || {}) };

/* ============================================================
   JS 1: Obrázky — pri chybe načítania ukáž náhradu
   ------------------------------------------------------------
   • .img-slot img → slot dostane triedu .is-broken (CSS ukáže
     .img-fallback namiesto obrázka)
   • .more-card-visual img → obrázok sa odstráni a ostane gradient
   Kontrolujeme aj obrázky, ktoré zlyhali ešte pred spustením JS.
   ============================================================ */
function handleBrokenImage(img) {
  if (img.closest('.more-card-visual')) { img.remove(); return; }
  const slot = img.closest('.img-slot');
  if (slot) slot.classList.add('is-broken');
}
function watchImage(img) {
  if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) handleBrokenImage(img);
  else img.addEventListener('error', () => handleBrokenImage(img), { once: true });
}
document.querySelectorAll('.img-slot img, .more-card-visual img').forEach(watchImage);

/* ============================================================
   JS 2: Mobilné menu (hamburger) — zatvára sa klikom na odkaz
   alebo klávesou Escape
   ============================================================ */
const navToggle = document.querySelector('.nav-toggle');
const navList = document.getElementById('nav-list');

function setMenu(open) {
  navList.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
}
navToggle.addEventListener('click', () => setMenu(!navList.classList.contains('open')));
navList.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && navList.classList.contains('open')) setMenu(false);
});

/* ============================================================
   JS 3: Navigácia
   ------------------------------------------------------------
   • zvýraznenie aktívnej položky menu a bodky v pipeline
   • klik na prvok s data-target="id" = plynulý skok na sekciu
     (bodky pipeline aj šípky "scroll")
   • tlačidlo "späť hore" — skryté v sekcii pexeso
   ============================================================ */
const navLinks = document.querySelectorAll('nav a[data-nav]');
const pipelineNodes = document.querySelectorAll('.pipeline-node[data-target]');
const backToTop = document.getElementById('back-to-top');

/* Ak je cieľová sekcia skrytá (napr. pexeso na mobile), skočí na ďalšiu viditeľnú */
function scrollToId(id) {
  let target = document.getElementById(id);
  while (target && target.offsetParent === null && target.nextElementSibling) target = target.nextElementSibling;
  target?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
}

document.querySelectorAll('[data-target]').forEach((el) => {
  el.addEventListener('click', () => scrollToId(el.dataset.target));
});
backToTop.addEventListener('click', () => scrollToId('home'));

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const id = entry.target.id;
    navLinks.forEach((link) => {
      const active = link.dataset.nav === id;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    pipelineNodes.forEach((node) => node.classList.toggle('active', node.dataset.target === id));
    backToTop.classList.toggle('visible', id !== 'game');
  });
}, { threshold: 0.5 });
document.querySelectorAll('section[id]').forEach((s) => sectionObserver.observe(s));

/* ============================================================
   JS 4: Postupné objavenie prvkov pri scrollovaní
   ============================================================ */
const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('in');
    observer.unobserve(entry.target);          /* stačí raz */
  });
}, { threshold: 0.15 });
document.querySelectorAll('[data-reveal]').forEach((el) => revealObserver.observe(el));

/* ============================================================
   JS 5: Kontaktný formulár — zakázané slová + odoslanie
   ------------------------------------------------------------
   • kontroluje polia Meno a Správa už počas písania
   • zachytí aj obchádzky: diakritiku (píča → pica), veľké písmená,
     "leet" (sh1t, $hit), opakované písmená (kuuurva) a znaky
     medzi písmenami (k.u.r.v.a)
   • blokuje správy s viac ako MAX_LINKS odkazmi (spam)
   • ak je všetko v poriadku, odošle správu cez FormSubmit (AJAX)
   ============================================================ */
const BANNED = {
  /* Celé slová — musia sa zhodovať presne */
  exact: [
    'pica', 'pice', 'picu', 'picou', 'pici', 'dick', 'cock', 'ass',
    'idiot', 'idioti', 'kkt', 'xxx', 'porn',
    'hovado', 'hovada', 'hovadu', 'hovadom', 'hovad'
  ],
  /* Začiatky slov — chytí aj tvary (kurva, kurvy, kurviť…) */
  stems: [
    /* SK / CZ */
    'kurv', 'kokot', 'jeba', 'jebe', 'jebl', 'jebn', 'jebo', 'zjeb', 'pojeb', 'vyjeb',
    'chuj', 'debil', 'sracka', 'kreten', 'zmrd', 'mrdk', 'curak',
    /* EN */
    'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'motherf',
    /* DE */
    'scheiss', 'scheis', 'arschloch', 'fotze', 'wichser', 'hurensohn', 'fick', 'schlampe',
    /* Spam */
    'viagra', 'cialis', 'casino', 'kasino', 'porno', 'lottery'
  ]
};
/* Výnimky — bežné slová, ktoré začínajú ako niektorý "stem" */
const ALLOWED = ['shitake', 'shiitake', 'assess', 'assist', 'class', 'passau'];
const MAX_LINKS = 2;
const LEET = { 0: 'o', '@': 'a', 4: 'a', $: 's', 5: 's', '!': 'i', 1: 'i', '|': 'i', 3: 'e', '€': 'e', 7: 't' };

function normalizeWord(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   /* bez diakritiky */
    .replace(/ß/g, 'ss')
    .replace(/[0@4$5!1|3€7]/g, (c) => LEET[c])
    .replace(/([a-z])[.\-_*~]+(?=[a-z])/g, '$1')         /* k.u.r.v.a → kurva */
    .replace(/([a-z])\1{2,}/g, '$1');                     /* kuuurva → kurva */
}

/* Vráti zakázané slová v tvare, ako ich napísal používateľ */
function findBanned(text) {
  const found = new Set();
  (text || '').split(/\s+/).filter(Boolean).forEach((orig) => {
    const trimmed = orig.replace(/^[^\p{L}\p{N}@$]+|[^\p{L}\p{N}@$]+$/gu, '');
    const word = normalizeWord(trimmed).replace(/[^a-z]/g, '');
    if (!word || ALLOWED.some((a) => word === a || (a.length > 3 && word.startsWith(a)))) return;
    if (BANNED.exact.includes(word) || BANNED.stems.some((s) => word.startsWith(s))) found.add(trimmed);
  });
  return [...found];
}
const countLinks = (text) => (text.match(/(https?:\/\/|www\.)\S+/gi) || []).length;

/* Test v konzole prehliadača: checkBannedWords('ahoj sh1t') */
window.checkBannedWords = findBanned;

(function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const submitBtn = document.getElementById('contact-submit');
  const statusEl = document.getElementById('form-status');
  const fields = ['name', 'message'].map((id) => document.getElementById(id)).filter(Boolean);

  /* Pod každé kontrolované pole vložíme miesto na upozornenie */
  fields.forEach((field) => {
    const warn = document.createElement('p');
    warn.className = 'field-warning';
    warn.id = `${field.id}-warning`;
    warn.setAttribute('aria-live', 'polite');
    field.after(warn);
    field.setAttribute('aria-describedby', warn.id);
  });

  function validateField(field) {
    const banned = findBanned(field.value);
    let msg = '';
    if (banned.length === 1) msg = T.bannedOne(banned[0]);
    else if (banned.length > 1) msg = T.bannedMany(banned.join(', '));
    else if (field.id === 'message' && countLinks(field.value) > MAX_LINKS) msg = T.tooManyLinks(MAX_LINKS);

    document.getElementById(`${field.id}-warning`).textContent = msg;
    field.classList.toggle('has-banned', Boolean(msg));
    field.setAttribute('aria-invalid', String(Boolean(msg)));
    return !msg;
  }
  function validateForm() {
    const ok = fields.map(validateField).every(Boolean);
    submitBtn.disabled = !ok;
    return ok;
  }

  let timer;
  fields.forEach((field) => field.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(validateForm, 250);   /* debounce */
  }));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    /* 1) Kontrola zakázaných slov */
    if (!validateForm()) {
      statusEl.textContent = T.blocked;
      const bad = fields.find((f) => f.classList.contains('has-banned'));
      if (bad) {
        bad.focus();
        bad.classList.remove('shake');
        void bad.offsetWidth;                   /* reštart animácie */
        bad.classList.add('shake');
      }
      return;
    }

    /* 2) Odoslanie cez FormSubmit */
    submitBtn.disabled = true;
    submitBtn.textContent = T.sending;
    statusEl.textContent = '';
    try {
      const res = await fetch('https://formsubmit.co/ajax/b.rozsypalova@gmail.com', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form)
      });
      if (!res.ok) throw new Error(res.status);
      statusEl.textContent = T.formOk;
      form.reset();
      fields.forEach(validateField);
    } catch {
      statusEl.textContent = T.formErr;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = T.sendBtn;
    }
  });
})();

/* ============================================================
   JS 6: Motto — canvas scratch efekt (myš aj dotyk)
   ============================================================ */
(function initScratch() {
  const canvas = document.getElementById('scratch-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const box = canvas.parentElement;
  let drawing = false;

  function paintLayer() {
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#311B2F');
    grad.addColorStop(1, '#050511');
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(245,227,243,0.55)';
    ctx.font = '600 13px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(T.scratchHint, canvas.width / 2, canvas.height / 2);
  }
  function resize() {
    const { width, height } = box.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;
    paintLayer();
  }
  function scratch(e) {
    const rect = canvas.getBoundingClientRect();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(e.clientX - rect.left, e.clientY - rect.top, 32, 0, Math.PI * 2);
    ctx.fill();
  }

  /* Pointer events = jedno riešenie pre myš, dotyk aj pero */
  canvas.addEventListener('pointerdown', (e) => { drawing = true; canvas.setPointerCapture(e.pointerId); scratch(e); });
  canvas.addEventListener('pointermove', (e) => { if (drawing) scratch(e); });
  ['pointerup', 'pointercancel'].forEach((type) => canvas.addEventListener(type, () => { drawing = false; }));

  document.getElementById('scratch-reset').addEventListener('click', paintLayer);
  new ResizeObserver(resize).observe(box);
})();

/* ============================================================
   JS 7: Lightbox — zväčšenie obrázka, šípky, Escape
   ============================================================ */
const lightbox = document.getElementById('lightbox');
const lbContent = document.getElementById('lightbox-content');
const lbCaption = document.getElementById('lightbox-caption');
const lbPrev = document.getElementById('lightbox-prev');
const lbNext = document.getElementById('lightbox-next');
let lbItems = [];
let lbIndex = 0;
let lbReturnFocus = null;

function renderLightbox() {
  const item = lbItems[lbIndex];
  if (!item) return;
  lbContent.replaceChildren();
  if (item.img) {
    const img = document.createElement('img');
    img.src = item.img;
    img.alt = item.caption || '';
    lbContent.append(img);
  } else {
    const box = document.createElement('div');
    box.className = 'lb-placeholder';
    box.textContent = item.caption || '';
    lbContent.append(box);
  }
  const counter = lbItems.length > 1 ? ` (${lbIndex + 1}/${lbItems.length})` : '';
  lbCaption.textContent = (item.caption || '') + counter;
  lbPrev.hidden = lbNext.hidden = lbItems.length < 2;
}
function openLightbox(items, index) {
  lbItems = items;
  lbIndex = index;
  lbReturnFocus = document.activeElement;
  renderLightbox();
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.getElementById('lightbox-close').focus();
}
function closeLightbox() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  lbContent.replaceChildren();
  lbReturnFocus?.focus();
}
const stepLightbox = (dir) => { lbIndex = (lbIndex + dir + lbItems.length) % lbItems.length; renderLightbox(); };

lbPrev.addEventListener('click', () => stepLightbox(-1));
lbNext.addEventListener('click', () => stepLightbox(1));
document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') stepLightbox(-1);
  if (e.key === 'ArrowRight') stepLightbox(1);
});

/* Dlaždica: obrázok, alebo farebná plocha s názvom, kým obrázok chýba */
function renderTile(tile, item) {
  tile.replaceChildren();
  tile.dataset.hasImg = String(Boolean(item.img));
  if (item.img) {
    const img = document.createElement('img');
    img.src = item.img;
    img.alt = item.caption || '';
    img.loading = 'lazy';
    tile.append(img);
  } else {
    const span = document.createElement('span');
    span.textContent = item.caption || '';
    tile.append(span);
  }
}

/* ============================================================
   JS 8: Galéria certifikátov
   ------------------------------------------------------------
   Každá kategória má:
   • cover  — obrázok na kocke kategórie
   • hero   — menší úvodný obrázok vedľa textu v detaile
              (samostatný, nie je súčasťou galérie)
   • images — galéria certifikátov { img, caption }
   Kde je '' (prázdne), doplň URL z Cloudinary. Kým je prázdne,
   zobrazí sa farebná dlaždica s názvom.
   TIP: PDF z Cloudinary sa ako obrázok nezobrazí — zmeň koncovku
   .pdf na .jpg a Cloudinary vráti 1. stranu ako obrázok.
   Texty kategórií v jazykoch sú v CERT_TEXTS.
   ============================================================ */
const certificateCategories = {
  salesforce: {
    cover: '',
    hero: { img: '', caption: 'Salesforce' },
    title: 'Salesforce Certifications',
    desc: 'Marketing Cloud Administrator and Email Specialist.',
    images: [
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792059022/SFMC_admin.png', caption: 'Salesforce Certified Marketing Cloud Administrator' },
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792059021/SFMC_email.png', caption: 'Salesforce Certified Marketing Cloud Email Specialist' },
      { img: '', caption: 'Trailhead — Expeditioner (149 badges, 47,150 points)' }
    ]
  },
  bloomreach: {
    cover: '',
    hero: { img: '', caption: 'Bloomreach Academy' },
    title: 'Bloomreach Academy',
    desc: 'Jinja, SMS, Data Hub, personalization, recommendations and omnichannel orchestration.',
    images: [
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792058882/certificate-edghmhnnaeuf-1737035330_1.jpg', caption: 'Bloomreach — Jinja Unlocked' },
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792058885/certificate-u8gg2x3ywodj-1736179452.jpg', caption: 'Bloomreach — Jinja Jumpstart: Personalization Intro Course' },
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792058884/certificate-xobnzme556ds-1777968559.jpg', caption: 'Bloomreach — SMS' },
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792058879/certificate-gqdiytnc787m-1777965406.jpg', caption: 'Bloomreach — Data Hub' },
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792058882/certificate-es8xnpzi7yb8-1777974275.jpg', caption: 'Bloomreach — Web & App Personalization' },
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792058880/certificate-5dqh9r6qz73d-1778048186.jpg', caption: 'Bloomreach — Product Recommendations' },
      { img: '', caption: 'Bloomreach — Omnichannel Orchestration' },
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792058878/certificate-5opzvxudszuw-1787689048.jpg', caption: 'Bloomreach — Campaign Channels Mastery' }
    ]
  },
  technical: {
    cover: '',
    hero: { img: '', caption: 'Data & Integrations' },
    title: 'Data & Integrations',
    desc: 'Web analytics, reporting, data integrations and data analytics.',
    images: [
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792058850/Google_Analytics_Certification.jpg', caption: 'Google Analytics Certification' },
      { img: '', caption: 'HubSpot Data Integrations' },
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792058848/35dc3c7354b944bd813e54c8f6cfc305.png', caption: 'HubSpot Reporting' },
      { img: '', caption: 'LinkedIn Learning — Introduction to Career Skills in Data Analytics' }
    ]
  },
  ai: {
    cover: '',
    hero: { img: '', caption: 'AI' },
    title: 'Artificial Intelligence',
    desc: 'Prompt writing and generative AI in everyday work and project management.',
    images: [
      { img: '', caption: 'LinkedIn Learning — Microsoft Copilot: The Art of Prompt Writing' },
      { img: '', caption: 'LinkedIn Learning — AI for Project Management: Boosting Collaboration with Generative AI' }
    ]
  },
  business: {
    cover: '',
    hero: { img: '', caption: 'Business & Marketing' },
    title: 'Business & Marketing',
    desc: 'Digital marketing, search advertising and German language.',
    images: [
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792058851/Google_Ads_Search_Certification.jpg', caption: 'Google Ads Search Certification' },
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792058849/9a9b29e57e5f4bd38f8596e1572b3574.png', caption: 'HubSpot Digital Marketing' },
      { img: '', caption: 'Direktes Deutsch — Level 9 (EMPIRE language school)' }
    ]
  }
};

/* card = text na kocke, label = malý nadpis v detaile,
   title + desc = nadpis a popis v detaile (EN berie z dát vyššie) */
const CERT_TEXTS = {
  en: {
    salesforce: { card: 'Salesforce' },
    bloomreach: { card: 'Bloomreach' },
    technical:  { card: 'Data & Integrations', label: 'data' },
    ai:         { card: 'AI' },
    business:   { card: 'Business & Marketing' }
  },
  sk: {
    salesforce: { card: 'Salesforce', title: 'Salesforce certifikácie', desc: 'Marketing Cloud Administrator a Email Specialist.' },
    bloomreach: { card: 'Bloomreach', title: 'Bloomreach Academy', desc: 'Jinja, SMS, Data Hub, personalizácia, odporúčania produktov a omnichannel orchestrácia.' },
    technical:  { card: 'Dáta a integrácie', label: 'dáta', title: 'Dáta a integrácie', desc: 'Webová analytika, reporting, dátové integrácie a analýza dát.' },
    ai:         { card: 'AI', title: 'Umelá inteligencia', desc: 'Písanie promptov a generatívna AI v každodennej práci a projektovom riadení.' },
    business:   { card: 'Business a marketing', title: 'Business a marketing', desc: 'Digitálny marketing, reklama vo vyhľadávaní a nemecký jazyk.' }
  },
  de: {
    salesforce: { card: 'Salesforce', title: 'Salesforce-Zertifizierungen', desc: 'Marketing Cloud Administrator und Email Specialist.' },
    bloomreach: { card: 'Bloomreach', title: 'Bloomreach Academy', desc: 'Jinja, SMS, Data Hub, Personalisierung, Produktempfehlungen und Omnichannel-Orchestrierung.' },
    technical:  { card: 'Daten & Integrationen', label: 'daten', title: 'Daten & Integrationen', desc: 'Webanalyse, Reporting, Datenintegrationen und Datenanalyse.' },
    ai:         { card: 'KI', label: 'ki', title: 'Künstliche Intelligenz', desc: 'Prompt Writing und generative KI im Arbeitsalltag und Projektmanagement.' },
    business:   { card: 'Business & Marketing', title: 'Business & Marketing', desc: 'Digitales Marketing, Suchmaschinenwerbung und Deutsch.' }
  }
};

const THUMBS_PER_PAGE = 4;

function initCertificateGallery(root, data, texts) {
  const $ = (role) => root.querySelector(`[data-role="${role}"]`);
  const catGrid = $('cat-grid');
  const detail = $('category-detail');
  const heroTile = $('hero-tile');
  const heroEyebrow = $('hero-eyebrow');
  const heroTitle = $('hero-title');
  const heroDesc = $('hero-desc');
  const thumbs = $('thumbs');
  const pagination = $('thumb-pagination');
  const prevBtn = $('thumb-prev');
  const nextBtn = $('thumb-next');
  const pageIndicator = $('thumb-page-indicator');
  let current = null;
  let page = 0;

  /* Kocky kategórií sa vytvoria z dát — v HTML je len prázdny kontajner */
  Object.entries(data).forEach(([key, cat]) => {
    const tr = texts[key] || {};
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'cat-card';
    card.innerHTML = `
      <span class="img-slot cat-card-img${cat.cover ? '' : ' is-broken'}">
        ${cat.cover ? `<img src="${cat.cover}" alt="" loading="lazy">` : ''}
        <span class="img-fallback"></span>
      </span>
      <span class="cat-card-title"></span>`;
    card.querySelector('.cat-card-title').textContent = tr.card || cat.title;
    const img = card.querySelector('img');
    if (img) watchImage(img);
    card.addEventListener('click', () => showCategory(key));
    catGrid.append(card);
  });

  function renderPage() {
    const items = data[current].images;
    const pages = Math.max(1, Math.ceil(items.length / THUMBS_PER_PAGE));
    page = Math.min(Math.max(page, 0), pages - 1);
    const start = page * THUMBS_PER_PAGE;

    thumbs.replaceChildren();
    items.slice(start, start + THUMBS_PER_PAGE).forEach((item, i) => {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'tile';
      tile.setAttribute('aria-label', item.caption || '');
      renderTile(tile, item);
      tile.addEventListener('click', () => openLightbox(items, start + i));
      thumbs.append(tile);
    });

    pagination.hidden = pages <= 1;
    pageIndicator.textContent = `${page + 1} / ${pages}`;
    prevBtn.disabled = page === 0;
    nextBtn.disabled = page === pages - 1;
  }

  function showCategory(key) {
    const cat = data[key];
    const tr = texts[key] || {};
    current = key;
    page = 0;
    heroEyebrow.textContent = tr.label || key;
    heroTitle.textContent = tr.title || cat.title;
    heroDesc.textContent = tr.desc || cat.desc;

    const hero = { img: cat.hero?.img || '', caption: cat.hero?.caption || heroTitle.textContent };
    renderTile(heroTile, hero);
    heroTile.onclick = hero.img ? () => openLightbox([hero], 0) : null;

    renderPage();
    catGrid.hidden = true;
    detail.hidden = false;
    if (isMobile()) detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  prevBtn.addEventListener('click', () => { page--; renderPage(); });
  nextBtn.addEventListener('click', () => { page++; renderPage(); });
  $('back-link').addEventListener('click', () => {
    detail.hidden = true;
    catGrid.hidden = false;
    if (isMobile()) catGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

const certsSection = document.getElementById('certs');
if (certsSection) initCertificateGallery(certsSection, certificateCategories, CERT_TEXTS[LANG] || CERT_TEXTS.en);

/* ============================================================
   JS 9: Pexeso (memory game) — 10 dvojíc / 20 kariet
   ============================================================ */
(function initMemoryGame() {
  const grid = document.getElementById('memory-grid');
  if (!grid) return;
  const COVER = 'https://res.cloudinary.com/xbffrklb/image/upload/v1787814858/IMG_8590.jpg';
  const IMAGES = [
    'https://res.cloudinary.com/xbffrklb/image/upload/v1787832120/PEXESO10.webp',
    'https://res.cloudinary.com/xbffrklb/image/upload/v1787832118/PEXESO9.jpg',
    'https://res.cloudinary.com/xbffrklb/image/upload/v1787832116/PEXESO8.webp',
    'https://res.cloudinary.com/xbffrklb/image/upload/v1787832114/PEXESO7.jpg',
    'https://res.cloudinary.com/xbffrklb/image/upload/v1787832113/PEXESO6.jpg',
    'https://res.cloudinary.com/xbffrklb/image/upload/v1787832110/PEXESO5.jpg',
    'https://res.cloudinary.com/xbffrklb/image/upload/v1787832108/PEXESO4.jpg',
    'https://res.cloudinary.com/xbffrklb/image/upload/v1787832106/PEXESO3.jpg',
    'https://res.cloudinary.com/xbffrklb/image/upload/v1787832104/PEXESO2.webp',
    'https://res.cloudinary.com/xbffrklb/image/upload/v1787832102/PEXESO1.jpg'
  ];
  const movesEl = document.getElementById('game-moves');
  const pairsEl = document.getElementById('game-pairs');
  const winEl = document.getElementById('game-win');
  let flipped = [];
  let moves = 0;
  let matched = 0;
  let lock = false;

  grid.style.setProperty('--mem-cover-img', `url(${COVER})`);

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function updateHud() {
    movesEl.textContent = T.moves + moves;
    pairsEl.textContent = `${T.pairs}${matched} / ${IMAGES.length}`;
  }
  function build() {
    flipped = []; moves = 0; matched = 0; lock = false;
    winEl.textContent = '';
    updateHud();
    grid.replaceChildren();
    shuffle([...IMAGES, ...IMAGES]).forEach((url, i) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'mem-card';
      card.dataset.key = url;
      card.setAttribute('aria-label', `${i + 1}`);
      card.innerHTML = `
        <span class="mem-card-inner">
          <span class="mem-face mem-front"></span>
          <span class="mem-face mem-back">
            <span class="img-slot mem-img-slot"><img src="${url}" alt=""><span class="img-fallback">IMG</span></span>
          </span>
        </span>`;
      watchImage(card.querySelector('img'));
      card.addEventListener('click', () => flip(card));
      grid.append(card);
    });
  }
  function flip(card) {
    if (lock || card.classList.contains('flipped') || card.classList.contains('matched')) return;
    card.classList.add('flipped');
    flipped.push(card);
    if (flipped.length < 2) return;

    moves++;
    lock = true;
    const [a, b] = flipped;
    if (a.dataset.key === b.dataset.key) {
      a.classList.add('matched');
      b.classList.add('matched');
      matched++;
      flipped = [];
      lock = false;
      if (matched === IMAGES.length) winEl.textContent = T.solved(moves);
    } else {
      setTimeout(() => {
        a.classList.remove('flipped');
        b.classList.remove('flipped');
        flipped = [];
        lock = false;
      }, 700);
    }
    updateHud();
  }

  document.getElementById('game-reset').addEventListener('click', build);
  build();
})();

/* ============================================================
   JS 10: Typewriter — píše a maže roly z data-words ("|")
   ============================================================ */
(function initTypewriter() {
  const el = document.querySelector('.tw-text[data-words]');
  if (!el) return;
  const words = el.dataset.words.split('|').map((w) => w.trim()).filter(Boolean);
  if (!words.length) return;
  if (reduceMotion) { el.textContent = words[0]; return; }

  const TYPE_SPEED = 70;     /* ms na písmeno pri písaní */
  const DELETE_SPEED = 35;   /* ms na písmeno pri mazaní */
  const HOLD_TIME = 1600;    /* ako dlho ostane celé slovo */
  let wordIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function tick() {
    const word = words[wordIndex];
    charIndex += deleting ? -1 : 1;
    el.textContent = word.slice(0, charIndex);

    if (!deleting && charIndex === word.length) { deleting = true; return setTimeout(tick, HOLD_TIME); }
    if (deleting && charIndex === 0) {
      deleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      return setTimeout(tick, 350);
    }
    setTimeout(tick, deleting ? DELETE_SPEED : TYPE_SPEED);
  }
  setTimeout(tick, 600);
})();

/* ============================================================
   JS 11: Ďalšie stránky — 3D tilt + "Coming soon"
   ------------------------------------------------------------
   • tilt len pre myš (na dotyku by rušil scroll)
   • kocka s href="#" dostane štítok "Coming soon" a neotvorí sa
   ============================================================ */
(function initMoreCards() {
  const cards = document.querySelectorAll('.more-card');
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const MAX_TILT = 10;   /* maximálny náklon v stupňoch */

  cards.forEach((card) => {
    /* Coming soon */
    if (!card.getAttribute('href') || card.getAttribute('href') === '#') {
      card.classList.add('is-soon');
      card.setAttribute('aria-disabled', 'true');
      card.removeAttribute('target');
      const badge = document.createElement('span');
      badge.className = 'more-card-badge';
      badge.textContent = T.soon;
      card.querySelector('.more-card-visual')?.append(badge);
      card.addEventListener('click', (e) => e.preventDefault());
    }

    /* 3D tilt */
    if (!canHover || reduceMotion) return;
    let frame = null;
    card.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        card.classList.add('is-tilting');
        card.style.transform = `perspective(900px) rotateX(${((0.5 - py) * 2 * MAX_TILT).toFixed(2)}deg) rotateY(${((px - 0.5) * 2 * MAX_TILT).toFixed(2)}deg) translateY(-4px)`;
        card.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
        card.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
      });
    });
    card.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      card.classList.remove('is-tilting');
      card.style.transform = '';
    });
  });
})();
