/* ==================================================================
   SCRIPT.JS — Bohuslava Rozsypalová — Portfolio & CV
   ------------------------------------------------------------------
   Obsah:
     JS 0  Texty podľa jazyka stránky (en / sk / de + window.I18N)
     JS 1  Mobilné menu (hamburger)
     JS 2  Aktívna položka menu + "pipeline" bodky + tlačidlo "späť hore"
     JS 3  Postupné "objavenie sa" prvkov pri scrollovaní
     JS 4  Kontaktný formulár — zakázané slová + odoslanie (FormSubmit)
     JS 5  Canvas scratch efekt
     JS 6  Lightbox
     JS 7  Galéria certifikátov (kategórie → detail → lightbox)
     JS 8  Pexeso (memory game)
     JS 9  Typewriter v úvode
     JS 10 3D tilt kociek "Ďalšie stránky"
     JS 11 Kocky bez odkazu → štítok "Coming soon"
     ================================================================== */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================================
   JS 0: Texty podľa jazyka
   ------------------------------------------------------------
   Jazyk sa zistí z <html lang="...">. Ak stránka definuje
   window.I18N (sk.html, de.html), použijú sa jej preklady.
   ============================================================ */
const LANG = (document.documentElement.lang || 'en').slice(0, 2).toLowerCase();
const I18N = window.I18N || {};
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
/* Poradie: angličtina (základ) ← texty daného jazyka ← window.I18N zo stránky */
const T = Object.assign({}, UI_TEXTS.en, UI_TEXTS[LANG] || {}, I18N);

/* ============================================================
   JS 1: Mobilné menu (hamburger)
   ============================================================ */
const navToggle = document.querySelector('.nav-toggle');
const navList = document.getElementById('nav-list');
navToggle.addEventListener('click', () => {
  const open = navList.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open);
});
navList.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  navList.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
}));

/* ============================================================
   JS 2: "pipeline" bodky + tlačidlo "späť hore"
   ------------------------------------------------------------
   Poradie v sectionIds musí sedieť s poradím bodiek .pipeline-node
   v HTML (9 bodiek).
   ============================================================ */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('nav a[data-nav]');
const pipelineNodes = document.querySelectorAll('.pipeline-node');
const backToTop = document.getElementById('back-to-top');
backToTop.addEventListener('click', () => document.getElementById('home').scrollIntoView({ behavior: 'smooth' }));

const sectionIds = ['home', 'about', 'more', 'certs', 'motto', 'game', 'cv', 'specimen', 'contact'];
const sectionIndexById = {};
sectionIds.forEach((id, i) => { sectionIndexById[id] = i; });

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navLinks.forEach(l => l.classList.toggle('active', l.dataset.nav === id));
      pipelineNodes.forEach((n, i) => n.classList.toggle('active', i === sectionIndexById[id]));
      /* "Späť hore" tlačidlo je viditeľné vždy, okrem sekcie #game (pexeso) */
      backToTop.classList.toggle('visible', id !== 'game');
    }
  });
}, { threshold: 0.5 });
sections.forEach(s => sectionObserver.observe(s));

/* Klik na bodku v pipeline = plynulý skok na danú sekciu */
pipelineNodes.forEach((node, i) => {
  node.addEventListener('click', () => {
    const target = document.getElementById(sectionIds[i]);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

/* ============================================================
   JS 3: plynulé objavenie sa prvkov pri scrollovaní
   ============================================================ */
const revealEls = document.querySelectorAll('[data-reveal]');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('in'); });
}, { threshold: 0.15 });
revealEls.forEach(el => revealObserver.observe(el));

/* ============================================================
   JS 4: Kontaktný formulár — zakázané slová + odoslanie
   ------------------------------------------------------------
   • kontroluje pole Meno aj Správa už počas písania
   • zachytí aj obchádzky: diakritiku (píča → pica), veľké písmená,
     "leet" (sh1t, $hit), opakované písmená (kuuurva) a bodky
     medzi písmenami (k.u.r.v.a)
   • blokuje aj správy s viac ako MAX_LINKS odkazmi (spam)
   • ak je všetko OK, správa sa odošle cez FormSubmit AJAX
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

/* Normalizácia textu pred porovnaním */
function normalizeWord(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')      /* bez diakritiky */
    .replace(/ß/g, 'ss')
    .replace(/[0@4$5!1|3€7]/g, (c) => ({
      '0': 'o', '@': 'a', '4': 'a', '$': 's', '5': 's',
      '!': 'i', '1': 'i', '|': 'i', '3': 'e', '€': 'e', '7': 't'
    })[c])
    .replace(/([a-z])[.\-_*~]+(?=[a-z])/g, '$1')            /* k.u.r.v.a → kurva */
    .replace(/([a-z])\1{2,}/g, '$1');                        /* kuuurva → kurva */
}

/* Vráti zoznam nájdených zakázaných slov (v tvare, ako ich napísal používateľ) */
function findBanned(text) {
  if (!text) return [];
  const found = new Set();
  text.split(/\s+/).filter(Boolean).forEach((orig) => {
    /* odstránime interpunkciu na krajoch (ahoj! → ahoj), potom normalizujeme */
    const trimmed = orig.replace(/^[^\p{L}\p{N}@$]+|[^\p{L}\p{N}@$]+$/gu, '');
    const word = normalizeWord(trimmed).replace(/[^a-z]/g, '');
    if (!word || ALLOWED.includes(word)) return;
    if (ALLOWED.some((a) => a.length > 3 && word.startsWith(a))) return;
    const hit = BANNED.exact.includes(word) || BANNED.stems.some((s) => word.startsWith(s));
    if (hit) found.add(trimmed);
  });
  return [...found];
}

function countLinks(text) {
  return (text.match(/(https?:\/\/|www\.)\S+/gi) || []).length;
}

/* Dá sa vyskúšať aj v konzole prehliadača: checkBannedWords('ahoj sh1t') */
window.checkBannedWords = findBanned;

const contactForm = document.getElementById('contact-form');
const submitBtn = document.getElementById('contact-submit');
const statusEl = document.getElementById('form-status');
const checkedFields = ['name', 'message'].map(id => document.getElementById(id)).filter(Boolean);

/* Pod každé kontrolované pole vložíme miesto na upozornenie */
checkedFields.forEach((field) => {
  const warn = document.createElement('p');
  warn.className = 'field-warning';
  warn.id = field.id + '-warning';
  warn.setAttribute('aria-live', 'polite');
  field.insertAdjacentElement('afterend', warn);
  field.setAttribute('aria-describedby', warn.id);
});

/* Skontroluje jedno pole — vráti true, ak je v poriadku */
function validateField(field) {
  const warn = document.getElementById(field.id + '-warning');
  const banned = findBanned(field.value);
  let msg = '';
  if (banned.length === 1) msg = T.bannedOne(banned[0]);
  else if (banned.length > 1) msg = T.bannedMany(banned.join(', '));
  else if (field.id === 'message' && countLinks(field.value) > MAX_LINKS) msg = T.tooManyLinks(MAX_LINKS);

  warn.textContent = msg;
  field.classList.toggle('has-banned', !!msg);
  field.setAttribute('aria-invalid', msg ? 'true' : 'false');
  return !msg;
}

function validateForm() {
  const ok = checkedFields.map(validateField).every(Boolean);
  submitBtn.disabled = !ok;
  return ok;
}

function clearValidation() {
  checkedFields.forEach((f) => {
    f.classList.remove('has-banned');
    f.setAttribute('aria-invalid', 'false');
    const w = document.getElementById(f.id + '-warning');
    if (w) w.textContent = '';
  });
}

/* Kontrola počas písania — s malým oneskorením (debounce) */
let validateTimer = null;
checkedFields.forEach((field) => {
  field.addEventListener('input', () => {
    clearTimeout(validateTimer);
    validateTimer = setTimeout(validateForm, 250);
  });
});

contactForm.addEventListener('submit', function (e) {
  e.preventDefault();

  /* 1) Kontrola zakázaných slov — ak niečo nájde, správa sa neodošle */
  if (!validateForm()) {
    statusEl.textContent = T.blocked;
    const bad = checkedFields.find((f) => f.classList.contains('has-banned'));
    if (bad) {
      bad.focus();
      bad.classList.remove('shake');
      void bad.offsetWidth; /* reštart animácie */
      bad.classList.add('shake');
    }
    return;
  }

  /* 2) Odoslanie cez FormSubmit */
  submitBtn.disabled = true;
  submitBtn.textContent = T.sending;
  statusEl.textContent = '';
  const data = new FormData(contactForm);
  fetch('https://formsubmit.co/ajax/b.rozsypalova@gmail.com', {
    method: 'POST',
    headers: { 'Accept': 'application/json' },
    body: data
  })
    .then(res => res.json())
    .then(() => {
      statusEl.textContent = T.formOk;
      contactForm.reset();
      clearValidation();
    })
    .catch(() => {
      statusEl.textContent = T.formErr;
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = T.sendBtn;
    });
});

/* ============================================================
   JS 5: Motto — (canvas scratch efekt)
   ============================================================ */
(function () {
  const canvas = document.getElementById('scratch-canvas');
  const ctx = canvas.getContext('2d');
  const box = canvas.parentElement;
  let drawing = false;

  function sizeCanvas() {
    const rect = box.getBoundingClientRect();
    canvas.width = rect.width; canvas.height = rect.height;
    paintScratchLayer();
  }
  function paintScratchLayer() {
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#311B2F'); /* plum */
    grad.addColorStop(1, '#050511'); /* ink */
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(245,227,243,0.55)';
    ctx.font = '600 13px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(T.scratchHint, canvas.width / 2, canvas.height / 2);
  }
  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  }
  function scratchAt(x, y) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath(); ctx.arc(x, y, 32, 0, Math.PI * 2); ctx.fill();
  }
  function start(e) { drawing = true; const p = getPos(e); scratchAt(p.x, p.y); }
  function move(e) { if (!drawing) return; e.preventDefault(); const p = getPos(e); scratchAt(p.x, p.y); }
  function end() { drawing = false; }

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
  canvas.addEventListener('touchstart', start, { passive: true });
  canvas.addEventListener('touchmove', move, { passive: false });
  canvas.addEventListener('touchend', end);
  document.getElementById('scratch-reset').addEventListener('click', paintScratchLayer);
  window.addEventListener('resize', sizeCanvas);
  sizeCanvas();
})();

/* ============================================================
   JS 6: Zdieľaný lightbox
   ============================================================ */
const lightbox = document.getElementById('lightbox');
const lightboxContent = document.getElementById('lightbox-content');
const lightboxCaption = document.getElementById('lightbox-caption');
let lbImages = [];
let lbIndex = 0;

function renderLightbox() {
  const item = lbImages[lbIndex];
  if (!item) return;
  if (item.img) {
    lightboxContent.innerHTML = `<img src="${item.img}" alt="${item.caption || ''}">`;
  } else {
    lightboxContent.innerHTML = `<div class="lb-placeholder">${item.caption || ''}</div>`;
  }
  const counter = lbImages.length > 1 ? ` (${lbIndex + 1}/${lbImages.length})` : '';
  lightboxCaption.textContent = (item.caption || '') + counter;
}
function openLightboxAt(images, index) {
  lbImages = images; lbIndex = index;
  renderLightbox();
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
}
function closeLightbox() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  lightboxContent.innerHTML = '';
}
document.getElementById('lightbox-prev').addEventListener('click', () => {
  lbIndex = (lbIndex - 1 + lbImages.length) % lbImages.length;
  renderLightbox();
});
document.getElementById('lightbox-next').addEventListener('click', () => {
  lbIndex = (lbIndex + 1) % lbImages.length;
  renderLightbox();
});
document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') document.getElementById('lightbox-prev').click();
  if (e.key === 'ArrowRight') document.getElementById('lightbox-next').click();
});

function renderTileContent(tile, item) {
  tile.innerHTML = '';
  if (item.img) {
    tile.dataset.hasImg = 'true';
    const img = document.createElement('img');
    img.src = item.img; img.alt = item.caption || '';
    tile.appendChild(img);
  } else {
    tile.dataset.hasImg = 'false';
    const span = document.createElement('span');
    span.textContent = item.caption || '';
    tile.appendChild(span);
  }
}

/* ============================================================
   JS 7: GALÉRIA KATEGÓRIÍ
   ------------------------------------------------------------
   3. parameter (catTexts) = preklady názvov kategórií z window.I18N
   (certCats). Ak chýba, použijú sa anglické texty.
   ============================================================ */
const THUMBS_PER_PAGE = 4;

function initCategoryGallery(rootEl, categoriesData, catTexts) {
  catTexts = catTexts || {};
  const catGrid = rootEl.querySelector('[data-role="cat-grid"]');
  const categoryDetail = rootEl.querySelector('[data-role="category-detail"]');
  const heroTile = rootEl.querySelector('[data-role="hero-tile"]');
  const heroEyebrow = rootEl.querySelector('[data-role="hero-eyebrow"]');
  const heroTitle = rootEl.querySelector('[data-role="hero-title"]');
  const heroDesc = rootEl.querySelector('[data-role="hero-desc"]');
  const thumbs = rootEl.querySelector('[data-role="thumbs"]');
  const backBtn = rootEl.querySelector('[data-role="back-link"]');
  const paginationEl = rootEl.querySelector('[data-role="thumb-pagination"]');
  const prevBtn = rootEl.querySelector('[data-role="thumb-prev"]');
  const nextBtn = rootEl.querySelector('[data-role="thumb-next"]');
  const pageIndicator = rootEl.querySelector('[data-role="thumb-page-indicator"]');

  let currentCatKey = null;
  let currentPage = 0;

  function renderThumbsPage() {
    const cat = categoriesData[currentCatKey];
    const rest = cat.images.slice(1); /* všetky fotky okrem tej veľkej (hero) */
    const totalPages = Math.max(1, Math.ceil(rest.length / THUMBS_PER_PAGE));
    currentPage = Math.max(0, Math.min(currentPage, totalPages - 1));
    const start = currentPage * THUMBS_PER_PAGE;
    const pageItems = rest.slice(start, start + THUMBS_PER_PAGE);

    thumbs.innerHTML = '';
    pageItems.forEach((item, i) => {
      const tile = document.createElement('div');
      tile.className = 'tile';
      renderTileContent(tile, item);
      const absoluteIndex = start + i + 1; /* +1, lebo index 0 je hero fotka */
      tile.addEventListener('click', () => openLightboxAt(cat.images, absoluteIndex));
      thumbs.appendChild(tile);
    });

    if (totalPages <= 1) {
      paginationEl.hidden = true;
    } else {
      paginationEl.hidden = false;
      pageIndicator.textContent = (currentPage + 1) + ' / ' + totalPages;
      prevBtn.disabled = currentPage === 0;
      nextBtn.disabled = currentPage === totalPages - 1;
    }
  }

  function showCategory(key) {
    const cat = categoriesData[key];
    if (!cat) return;
    const tr = catTexts[key] || {};
    currentCatKey = key;
    currentPage = 0;
    catGrid.hidden = true;
    categoryDetail.hidden = false;
    heroEyebrow.textContent = tr.label || key;
    heroTitle.textContent = tr.title || cat.title;
    heroDesc.textContent = tr.desc || cat.desc;

    renderTileContent(heroTile, cat.images[0]);
    heroTile.onclick = () => openLightboxAt(cat.images, 0);

    renderThumbsPage();

    /* Na mobile (šírka ≤ 900px) sa po otvorení kategórie automaticky
       odscrolluje nadol na zobrazenú galériu. */
    if (window.matchMedia('(max-width: 900px)').matches) {
      categoryDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  prevBtn.addEventListener('click', () => { currentPage--; renderThumbsPage(); });
  nextBtn.addEventListener('click', () => { currentPage++; renderThumbsPage(); });

  rootEl.querySelectorAll('.cat-card').forEach(card => {
    card.addEventListener('click', () => showCategory(card.dataset.cat));
  });
  backBtn.addEventListener('click', () => {
    categoryDetail.hidden = true;
    catGrid.hidden = false;
    /* Rovnaký princíp aj pri návrate na zoznam kategórií (len mobile) */
    if (window.matchMedia('(max-width: 900px)').matches) {
      catGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

/* --- Dáta pre Certificates ---------------------------------------
   Každý certifikát = jedna položka { img, caption }.
   • img: URL obrázka certifikátu (napr. z Cloudinary). Kým je null,
     zobrazí sa farebná dlaždica s názvom certifikátu.
   • caption: názov certifikátu (zobrazí sa v galérii aj v lightboxe).
   Prvá položka v zozname je veľký náhľad vľavo hore.
   ---------------------------------------------------------------- */
const certificateCategories = {
  salesforce: {
    title: 'Salesforce Certifications',
    desc: 'Marketing Cloud — Consultant, Developer, Email Specialist and Administrator.',
    images: [
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792059021/SFMC_email.png', caption: 'Salesforce' },
       { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792059021/SFMC_email.png', caption: 'Salesforce Certified Marketing Cloud Email Specialist' },
       { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792059022/SFMC_admin.png', caption: 'Salesforce Certified Marketing Cloud Administrator' }
    ]
  },
  bloomreach: {
    title: 'Bloomreach Academy',
    desc: 'Engagement, Discovery, Jinja and Data Hub.',
    images: [
       { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792058885/certificate-u8gg2x3ywodj-1736179452.pdf', caption: 'Bloomreach Engagement' },
       { img: '', caption: 'Bloomreach Engagement' },
      { img: '', caption: 'Bloomreach Discovery' },
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792058882/certificate-edghmhnnaeuf-1737035330_1.pdf', caption: 'Bloomreach — Jinja Unlocked' },
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792058885/certificate-u8gg2x3ywodj-1736179452.pdf', caption: 'Bloomreach — Jinja Jumpstart' },
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792058882/certificate-es8xnpzi7yb8-1777974275.pdf', caption: 'Bloomreach — Web and App' },
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792058880/certificate-5dqh9r6qz73d-1778048186.pdf', caption: 'Bloomreach — Product Recommendation' },
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792058879/certificate-gqdiytnc787m-1777965406.jpg', caption: 'Bloomreach — Data Hub' },
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792058878/certificate-5opzvxudszuw-1787689048.pdf', caption: 'Bloomreach — Campaign Channels Mastery' },
       { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792058884/certificate-xobnzme556ds-1777968559.jpg', caption: 'Bloomreach — SMS' }
    ]
  },
  technical: {
    title: 'Technical & Data',
    desc: 'Web analytics, reporting and working with data.',
    images: [
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792058850/Google_Analytics_Certification.pdf', caption: 'Google Analytics Certification' },
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792058848/35dc3c7354b944bd813e54c8f6cfc305.png', caption: 'HubSpot Reporting' }
    ]
  },
  business: {
    title: 'Business & Marketing',
    desc: 'Digital marketing, advertising and IBM industry certifications.',
    images: [
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792058851/Google_Ads_Search_Certification.pdf', caption: 'Google Ads Search Certification' },
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792058849/9a9b29e57e5f4bd38f8596e1572b3574.png', caption: 'HubSpot Digital Marketing' }
    ]
  }
};

/* Inicializácia galérie certifikátov */
const certsSection = document.getElementById('certs');
if (certsSection) initCategoryGallery(certsSection, certificateCategories, I18N.certCats);

/* ============================================================
   JS 8: Pexeso (memory game) — 10 dvojíc / 20 kariet
   ============================================================ */
(function () {

  const memCoverImage = 'https://res.cloudinary.com/xbffrklb/image/upload/v1787814858/IMG_8590.jpg';

  const memoryImages = [
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
  const grid = document.getElementById('memory-grid');

  grid.style.setProperty('--mem-cover-img', 'url(' + memCoverImage + ')');
  const movesEl = document.getElementById('game-moves');
  const pairsEl = document.getElementById('game-pairs');
  const winEl = document.getElementById('game-win');
  let cards = [], flipped = [], moves = 0, matched = 0, lock = false;

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function build() {
    grid.innerHTML = '';
    flipped = []; moves = 0; matched = 0; lock = false;
    movesEl.textContent = T.moves + '0';
    pairsEl.textContent = T.pairs + '0 / ' + memoryImages.length;
    winEl.textContent = '';

    const deck = memoryImages.map((url, idx) => ({ url, slot: idx + 1 }));
    cards = shuffle([...deck, ...deck]);
    cards.forEach((item, i) => {
      const card = document.createElement('div');
      card.className = 'mem-card';
      card.dataset.key = item.url + '|' + item.slot;
      card.dataset.index = i;
      card.innerHTML = `
        <div class="mem-card-inner">
          <div class="mem-face mem-front"></div>
          <div class="mem-face mem-back">
            <span class="img-slot mem-img-slot">
              <img src="${item.url}" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
              <span class="img-fallback">IMG ${item.slot}</span>
            </span>
          </div>
        </div>`;
      card.addEventListener('click', () => flipCard(card));
      grid.appendChild(card);
    });
  }
  function flipCard(card) {
    if (lock || card.classList.contains('flipped') || card.classList.contains('matched')) return;
    card.classList.add('flipped');
    flipped.push(card);
    if (flipped.length === 2) {
      moves++; movesEl.textContent = T.moves + moves;
      lock = true;
      const [a, b] = flipped;
      if (a.dataset.key === b.dataset.key) {
        a.classList.add('matched'); b.classList.add('matched');
        matched++;
        pairsEl.textContent = T.pairs + matched + ' / ' + memoryImages.length;
        flipped = []; lock = false;
        if (matched === memoryImages.length) {
          winEl.textContent = T.solved(moves);
        }
      } else {
        setTimeout(() => {
          a.classList.remove('flipped'); b.classList.remove('flipped');
          flipped = []; lock = false;
        }, 700);
      }
    }
  }
  document.getElementById('game-reset').addEventListener('click', build);
  build();
})();

/* ============================================================
   JS 9: Typewriter — postupne píše a maže roly z data-words
   ------------------------------------------------------------
   HTML: <span class="tw-text" data-words="Rola 1|Rola 2|Rola 3"></span>
   ============================================================ */
(function () {
  const el = document.querySelector('.tw-text[data-words]');
  if (!el) return;
  const words = el.dataset.words.split('|').map((w) => w.trim()).filter(Boolean);
  if (!words.length) return;

  /* Pri "obmedzenom pohybe" len zobrazíme prvú rolu, bez animácie */
  if (reduceMotion) { el.textContent = words[0]; return; }

  const TYPE_SPEED = 70;     /* ms na jedno písmeno pri písaní */
  const DELETE_SPEED = 35;   /* ms na jedno písmeno pri mazaní */
  const HOLD_TIME = 1600;    /* ako dlho ostane celé slovo     */
  let wordIndex = 0, charIndex = 0, deleting = false;

  function tick() {
    const word = words[wordIndex];
    if (!deleting) {
      charIndex++;
      el.textContent = word.slice(0, charIndex);
      if (charIndex === word.length) {
        deleting = true;
        return setTimeout(tick, HOLD_TIME);
      }
      return setTimeout(tick, TYPE_SPEED);
    }
    charIndex--;
    el.textContent = word.slice(0, charIndex);
    if (charIndex === 0) {
      deleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      return setTimeout(tick, 350);
    }
    setTimeout(tick, DELETE_SPEED);
  }
  setTimeout(tick, 600);
})();

/* ============================================================
   JS 10: 3D tilt — kocka sa nakláňa podľa polohy myši
   ------------------------------------------------------------
   Len pre myš (na dotykových zariadeniach by to rušilo scroll).
   ============================================================ */
(function () {
  const cards = document.querySelectorAll('.more-card');
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!cards.length || !canHover || reduceMotion) return;

  const MAX_TILT = 10; /* maximálny náklon v stupňoch */

  cards.forEach((card) => {
    let frame = null;

    card.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;   /* 0 … 1 */
      const py = (e.clientY - rect.top) / rect.height;   /* 0 … 1 */

      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rotY = (px - 0.5) * 2 * MAX_TILT;
        const rotX = (0.5 - py) * 2 * MAX_TILT;
        card.classList.add('is-tilting');
        card.style.transform =
          `perspective(900px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateY(-4px)`;
        card.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      });
    });

    card.addEventListener('pointerleave', () => {
      if (frame) cancelAnimationFrame(frame);
      card.classList.remove('is-tilting');
      card.style.transform = '';
    });
  });
})();

/* ============================================================
   JS 11: Kocky bez odkazu (href="#") → štítok "Coming soon"
   ============================================================ */
document.querySelectorAll('.more-card').forEach((card) => {
  const href = card.getAttribute('href');
  if (href && href !== '#') return;
  card.classList.add('is-soon');
  card.setAttribute('aria-disabled', 'true');
  const visual = card.querySelector('.more-card-visual');
  if (visual) {
    const badge = document.createElement('span');
    badge.className = 'more-card-badge';
    badge.textContent = T.soon;
    visual.appendChild(badge);
  }
  card.addEventListener('click', (e) => e.preventDefault());
});


