/* ==================================================================
   SCRIPT.JS — Bohuslava Rozsypalová — Portfolio & CV
   ------------------------------------------------------------------
   Načítava sa s atribútom "defer" — beží až po načítaní celého HTML.
   Obsah:
     JS 0  Texty podľa jazyka (en / sk / de + window.I18N zo stránky)
     JS 1  Obrázky — náhradný text pri chybe načítania
     JS 2  Mobilné menu (hamburger)
     JS 3  Navigácia — aktívna sekcia (menu, pipeline, neón), šípky "scroll", späť hore,
           rozbaľovací životopis na mobile
     JS 4  Postupné objavenie prvkov pri scrollovaní
     JS 5  Kontaktný formulár — zakázané slová + odoslanie (FormSubmit)
     JS 6  Motto — canvas scratch efekt + striedanie motta pri Reset
     JS 7  Lightbox
     JS 8  Galéria certifikátov (dáta + kategórie → detail → lightbox) + rotujúca galéria v About
     JS 9  Pexeso (memory game)
     JS 10 Typewriter — roly v úvode, štatistiky a zručnosti v About
     JS 11 3D tilt kociek (Ďalšie stránky + Certifikáty) + štítok "Coming soon"
   ================================================================== */
'use strict';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => window.matchMedia('(max-width: 900px)').matches;

/* ============================================================
   JS 0: Texty podľa jazyka
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
    blocked: 'Message not sent — please fix the highlighted field.',
    cvMore: 'Show full CV',
    cvLess: 'Show less'
  },
  sk: {
    soon: 'Čoskoro',
    bannedOne: (w) => `Prosím, vynechajte slovo „${w}“.`,
    bannedMany: (w) => `Prosím, vynechajte slová: ${w}.`,
    tooManyLinks: (max) => `Správa môže obsahovať najviac ${max} odkazy.`,
    blocked: 'Správa nebola odoslaná — upravte, prosím, označené pole.',
    cvMore: 'Zobraziť celý životopis',
    cvLess: 'Zobraziť menej'
  },
  de: {
    soon: 'Demnächst',
    bannedOne: (w) => `Bitte verzichten Sie auf das Wort „${w}“.`,
    bannedMany: (w) => `Bitte verzichten Sie auf diese Wörter: ${w}.`,
    tooManyLinks: (max) => `Die Nachricht darf höchstens ${max} Links enthalten.`,
    blocked: 'Nachricht nicht gesendet — bitte das markierte Feld korrigieren.',
    cvMore: 'Ganzen Lebenslauf anzeigen',
    cvLess: 'Weniger anzeigen'
  }
};
/* Poradie: angličtina (základ) ← texty jazyka ← window.I18N zo stránky */
const T = { ...UI_TEXTS.en, ...(UI_TEXTS[LANG] || {}), ...(window.I18N || {}) };

/* ============================================================
   JS 1: chyba načítania 
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
   JS 2: Mobilné menu (hamburger) 
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
   ============================================================ */
const navLinks = document.querySelectorAll('nav a[data-nav]');
const pipelineNodes = document.querySelectorAll('.pipeline-node[data-target]');
const backToTop = document.getElementById('back-to-top');

/* Ak je cieľová sekcia skrytá skočí na viditeľnú */
function scrollToId(id) {
  let target = document.getElementById(id);
  while (target && target.offsetParent === null && target.nextElementSibling) target = target.nextElementSibling;
  target?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
}

document.querySelectorAll('[data-target]').forEach((el) => {
  el.addEventListener('click', () => scrollToId(el.dataset.target));
});
backToTop.addEventListener('click', () => scrollToId('home'));

/* Aktívna = sekcia - neónový názov */
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    entry.target.classList.toggle('is-active', entry.isIntersecting);
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
}, { rootMargin: '-45% 0px -45% 0px' });
document.querySelectorAll('section[id]').forEach((s) => sectionObserver.observe(s));

/* Životopis na mobile - skrytý text */
(function initCvToggle() {
  const cv = document.querySelector('#cv .cv-scroll');
  if (!cv) return;
  cv.id = 'cv-content';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn-ghost cv-toggle';
  btn.setAttribute('aria-controls', cv.id);
  btn.setAttribute('aria-expanded', 'false');
  btn.textContent = T.cvMore;
  cv.after(btn);
  btn.addEventListener('click', () => {
    const open = cv.classList.toggle('is-expanded');
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? T.cvLess : T.cvMore;
    if (!open) document.getElementById('cv').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  });
})();

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
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   /* bez diakritiky */
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


window.checkBannedWords = findBanned;

(function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const submitBtn = document.getElementById('contact-submit');
  const statusEl = document.getElementById('form-status');
  const fields = ['name', 'message'].map((id) => document.getElementById(id)).filter(Boolean);

 
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

    /* Odoslanie cez FormSubmit */
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
   JS 6: Motto — canvas scratch efekt 
   ============================================================ */
(function initScratch() {
  const canvas = document.getElementById('scratch-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const box = canvas.parentElement;
  let drawing = false;

  function paintLayer() {
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#354458');   /* slate — rovnaké farby ako v style.css */
    grad.addColorStop(1, '#050511');   /* ink */
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(227,228,245,0.55)';   /* frost */
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

  /* Mottá z data-mottos ("|"); Reset = ďalšie motto + nová vrstva na zotretie */
  const message = box.querySelector('.scratch-message');
  const mottos = (message?.dataset.mottos || '').split('|').map((t) => t.trim()).filter(Boolean);
  let mottoIndex = 0;

  /* "citát — autor" → citát + autor v samostatnom riadku */
  function showMotto(text) {
    const cut = text.lastIndexOf(' — ');
    const quote = cut > -1 ? text.slice(0, cut) : text;
    const author = cut > -1 ? text.slice(cut + 3) : '';
    message.textContent = quote;
    if (author) {
      const span = document.createElement('span');
      span.className = 'motto-author';
      span.textContent = `— ${author}`;
      message.append(span);
    }
  }

  document.getElementById('scratch-reset').addEventListener('click', () => {
    if (mottos.length > 1) {
      mottoIndex = (mottoIndex + 1) % mottos.length;
      showMotto(mottos[mottoIndex]);
    }
    paintLayer();
  });
  new ResizeObserver(resize).observe(box);
})();

/* ============================================================
   JS 7: Lightbox 
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
   ============================================================ */
const certificateCategories = {
  salesforce: {
    cover: 'https://res.cloudinary.com/udbct254/image/upload/v1792137231/sf.png',
    hero: { img: 'https://res.cloudinary.com/udbct254/image/upload/v1792137231/sf.png', caption: 'Salesforce' },
    title: 'Salesforce Certifications',
    desc: 'Marketing Cloud Administrator and Email Specialist.',
    images: [
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792136450/SFMC_admin.jpg', caption: 'Salesforce Certified Marketing Cloud Administrator' },
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792136448/SFMC_email.jpg', caption: 'Salesforce Certified Marketing Cloud Email Specialist' },
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792136624/TrailheadBr.jpg', caption: 'Trailhead — Expeditioner (149 badges, 47,150 points)' }
    ]
  },
  bloomreach: {
    cover: 'https://res.cloudinary.com/udbct254/image/upload/v1792137232/instructor_9pfzdk8i675yn21vhzkxc3y6z_public_1753890490_Copy_of_Bloomreach-Academy-Logo_secondary.1753890490189.png',
    hero: { img: 'https://res.cloudinary.com/udbct254/image/upload/v1792137232/instructor_9pfzdk8i675yn21vhzkxc3y6z_public_1753890490_Copy_of_Bloomreach-Academy-Logo_secondary.1753890490189.png', caption: 'Bloomreach Academy' },
    title: 'Bloomreach Academy',
    desc: 'Jinja, SMS, Data Hub, personalization, recommendations and omnichannel orchestration.',
    images: [
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792136468/certificate-edghmhnnaeuf-1737035330_1.jpg', caption: 'Bloomreach — Jinja Unlocked' },
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792136464/certificate-u8gg2x3ywodj-1736179452.jpg', caption: 'Bloomreach — Jinja Jumpstart: Personalization Intro Course' },
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792136491/certificate-xobnzme556ds-1777968559_-_k%C3%B3pia.jpg', caption: 'Bloomreach — SMS' },
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792136488/certificate-gqdiytnc787m-1777965406_-_k%C3%B3pia.jpg', caption: 'Bloomreach — Data Hub' },
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792136466/certificate-es8xnpzi7yb8-1777974275.jpg', caption: 'Bloomreach — Web & App Personalization' },
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792136472/certificate-5dqh9r6qz73d-1778048186.jpg', caption: 'Bloomreach — Product Recommendations' },
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792136470/certificate-5opzvxudszuw-1787689048.jpg', caption: 'Bloomreach — Campaign Channels Mastery' }
    ]
  },
  technical: {
    cover: 'https://res.cloudinary.com/livyisn3/image/upload/v1792136452/fb2e92e66f1e4d488589097b11ea9be4.jpg',
    hero: { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792136454/35dc3c7354b944bd813e54c8f6cfc305.jpg', caption: 'Data & Integrations' },
    title: 'Data & Integrations',
    desc: 'Web analytics, reporting, data integrations and data analytics.',
    images: [
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792136459/Google_Analytics_Certification.jpg', caption: 'Google Analytics Certification' },
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792136452/fb2e92e66f1e4d488589097b11ea9be4.jpg', caption: 'HubSpot Data Integrations' },
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792136454/35dc3c7354b944bd813e54c8f6cfc305.jpg', caption: 'HubSpot Reporting' },
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792136481/CertificateOfCompletion_Introduction_to_Career_Skills_in_Data_Analytics_2022.jpg', caption: 'LinkedIn Learning — Introduction to Career Skills in Data Analytics' }
    ]
  },
  ai: {
    cover: 'https://res.cloudinary.com/livyisn3/image/upload/v1792136479/CertificateOfCompletion_Industry_Primer_for_Industrials_Technology_Innovation_and_AI.jpg',
    hero: { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792136475/CertificateOfCompletion_AI_for_Project_Management_Boosting_Collaboration_with_Generative_AI.jpg', caption: 'AI' },
    title: 'Artificial Intelligence',
    desc: 'Prompt writing and generative AI in everyday work and project management.',
    images: [
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792136486/CertificateOfCompletion_Microsoft_Copilot_The_Art_of_Prompt_Writing.jpg', caption: 'LinkedIn Learning — Microsoft Copilot: The Art of Prompt Writing' },
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792136479/CertificateOfCompletion_Industry_Primer_for_Industrials_Technology_Innovation_and_AI.jpg', caption: 'LinkedIn Learning — Industry Primer for Industrials Technology Innovation and AI' },
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792136475/CertificateOfCompletion_AI_for_Project_Management_Boosting_Collaboration_with_Generative_AI.jpg', caption: 'LinkedIn Learning — AI for Project Management: Boosting Collaboration with Generative AI' }
    ]
  },
  business: {
    cover: 'https://res.cloudinary.com/livyisn3/image/upload/v1792136461/Google_Ads_Search_Certification.jpg',
    hero: { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792136461/Google_Ads_Search_Certification.jpg', caption: 'Business & Marketing' },
    title: 'Business & Marketing',
    desc: 'Digital marketing, search advertising and German language.',
    images: [
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792136461/Google_Ads_Search_Certification.jpg', caption: 'Google Ads Search Certification' },
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792136457/9a9b29e57e5f4bd38f8596e1572b3574.jpg', caption: 'HubSpot Digital Marketing' },
      { img: 'https://res.cloudinary.com/livyisn3/image/upload/v1792138753/DirektesDeutschBR.png', caption: 'Direktes Deutsch — Level 9 (EMPIRE language school)' }
    ]
  }
};


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

/* Malá galéria v About — všetky certifikáty s obrázkom sa striedajú
   každých 5 sekúnd (prelínanie). Nie je klikateľná. */
(function initCertRotator() {
  const box = document.querySelector('[data-cert-rotator]');
  if (!box) return;
  const items = Object.values(certificateCategories).flatMap((cat) => cat.images).filter((item) => item.img);
  if (!items.length) return;

  const INTERVAL = 5000;   /* ms medzi certifikátmi */
  const caption = document.createElement('figcaption');
  const imgs = items.map((item) => {
    const img = document.createElement('img');
    img.src = item.img;
    img.alt = item.caption || '';
    img.loading = 'lazy';
    img.decoding = 'async';
    box.append(img);
    return img;
  });
  box.append(caption);

  let index = 0;
  function show(i) {
    imgs.forEach((img, k) => img.classList.toggle('is-visible', k === i));
    caption.textContent = items[i].caption || '';
  }
  show(0);
  if (reduceMotion || items.length < 2) return;
  setInterval(() => {
    if (document.hidden) return;   /* na neaktívnej karte nestriedame */
    index = (index + 1) % items.length;
    show(index);
  }, INTERVAL);
})();

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
   JS 10: Typewriter — postupne píše a maže texty dookola
   ------------------------------------------------------------
   • typeLoop(element, zoznam, nastavenia) — píše a maže dookola:
       – roly v úvode → <span class="tw-text" data-words="A|B|C">
       – zručnosti v About → štítky v <ul class="chips" data-skill-ticker>;
         JS ich skryje (ostanú pre čítačky obrazovky) a vypisuje ich
         jednu po druhej
   • typeOnce(element, text) — napíše text raz a nechá ho tak:
       – štatistiky v About → <div class="about-stats" data-type-once>
   ============================================================ */
function typeLoop(el, words, { typeSpeed = 70, deleteSpeed = 35, hold = 1600, gap = 350 } = {}) {
  if (!el || !words.length) return;
  if (reduceMotion) { el.textContent = words.join(' · '); return; }   /* bez animácie */

  let wordIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function tick() {
    const word = words[wordIndex];
    charIndex += deleting ? -1 : 1;
    el.textContent = word.slice(0, charIndex);

    if (!deleting && charIndex === word.length) { deleting = true; return setTimeout(tick, hold); }
    if (deleting && charIndex === 0) {
      deleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      return setTimeout(tick, gap);
    }
    setTimeout(tick, deleting ? deleteSpeed : typeSpeed);
  }
  setTimeout(tick, 600);
}

/* Roly v úvode */
(function initHeroTypewriter() {
  const el = document.querySelector('.tw-text[data-words]');
  if (!el) return;
  typeLoop(el, el.dataset.words.split('|').map((w) => w.trim()).filter(Boolean));
})();

/* Zručnosti v About */
(function initSkillTicker() {
  const list = document.querySelector('[data-skill-ticker]');
  if (!list) return;
  const skills = [...list.querySelectorAll('.chip')].map((li) => li.textContent.trim()).filter(Boolean);
  if (!skills.length) return;

  const ticker = document.createElement('p');
  ticker.className = 'skill-ticker';
  ticker.setAttribute('aria-hidden', 'true');          /* čítačky čítajú pôvodný zoznam */
  ticker.innerHTML = '<span class="skill-ticker-text"></span><span class="tw-caret"></span>';
  list.classList.add('visually-hidden');
  list.after(ticker);

  typeLoop(ticker.querySelector('.skill-ticker-text'), skills, { typeSpeed: 55, deleteSpeed: 25, hold: 1400 });
})();

/* Napíše text raz (písmeno po písmene) s kurzorom; vráti Promise */
function typeOnce(el, text, speed = 45) {
  return new Promise((resolve) => {
    const caret = document.createElement('span');
    caret.className = 'tw-caret';
    caret.setAttribute('aria-hidden', 'true');
    let i = 0;
    el.textContent = '';
    el.append(caret);
    (function step() {
      if (i < text.length) {
        caret.before(text[i++]);
        setTimeout(step, speed);
      } else {
        caret.remove();
        resolve();
      }
    })();
  });
}

/* Štatistiky v About — vypíšu sa raz, keď sa sekcia zobrazí, jedna po druhej */
(function initStatsTypewriter() {
  const box = document.querySelector('[data-type-once]');
  if (!box || reduceMotion) return;
  const parts = [...box.querySelectorAll('.stat strong, .stat span')].map((el) => ({ el, text: el.textContent.trim() }));

  /* Celý text ostáva pre čítačky obrazovky v skrytom <span> */
  box.querySelectorAll('.stat').forEach((stat) => {
    const full = stat.textContent.replace(/\s+/g, ' ').trim();
    [...stat.children].forEach((child) => child.setAttribute('aria-hidden', 'true'));
    const sr = document.createElement('span');
    sr.className = 'visually-hidden';
    sr.textContent = full;
    stat.append(sr);
  });
  parts.forEach(({ el }) => { el.textContent = ''; });

  const observer = new IntersectionObserver(async (entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    observer.disconnect();
    for (const { el, text } of parts) await typeOnce(el, text, el.tagName === 'STRONG' ? 90 : 35);
  }, { threshold: 0.4 });
  observer.observe(box);
})();

/* ============================================================
   JS 11: 3D tilt kociek (Ďalšie stránky + Certifikáty) + "Coming soon"
   ------------------------------------------------------------
   • tilt len pre myš (na dotyku by rušil scroll)
   • kocka s href="#" dostane štítok "Coming soon" a neotvorí sa
   ============================================================ */
(function initMoreCards() {
  const cards = document.querySelectorAll('.more-card, .cat-card');   /* kocky Ďalších stránok aj Certifikátov */
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const MAX_TILT = 10;   /* maximálny náklon v stupňoch */

  cards.forEach((card) => {
    /* Coming soon (len kocky Ďalších stránok — odkazy <a>) */
    if (card.matches('a.more-card') && (!card.getAttribute('href') || card.getAttribute('href') === '#')) {
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
