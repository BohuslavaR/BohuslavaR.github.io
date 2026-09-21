/* ==================================================================
   SCRIPT.JS — Bohuslava Rozsypalová — Portfolio & CV
   ------------------------------------------------------------------
   Obsah:
     JS 0  Preklady textov generovaných skriptom (i18n)
     JS 1  Mobilné menu (hamburger)
     JS 2  Aktívna položka menu + "pipeline" bodky + tlačidlo "späť hore"
     JS 3  Postupné "objavenie sa" prvkov pri scrollovaní
     JS 4  Kontaktný formulár (FormSubmit)
     JS 5  Canvas scratch efekt
     JS 6  Lightbox
     JS 7  Galéria
     JS 8  Pexeso (memory game)
     JS 9  Hero obrázok na pozadí
   ================================================================== */

/* ============================================================
   JS 0: i18n   
   ============================================================ */
const T = Object.assign({
  sending: 'Sending…',
  sendBtn: 'Send message',
  formOk: '✓ Message sent — thank you! I will get back to you soon.',
  formErr: 'Something went wrong. Please email b.rozsypalova@gmail.com directly.',
  scratchHint: 'scratch to reveal',
  moves: 'Moves: ',
  pairs: 'Pairs: ',
  solved: (n) => `🎉 Solved in ${n} moves!`,
  photoCats: {},
  graphicCats: {}
}, window.I18N || {});

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
   JS 2: "pipeline" bodky + tlačidlo späť hore"
   ============================================================ */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('nav a[data-nav]');
const pipelineNodes = document.querySelectorAll('.pipeline-node');
const backToTop = document.getElementById('back-to-top');
backToTop.addEventListener('click', () => document.getElementById('home').scrollIntoView({ behavior: 'smooth' }));

const sectionIds = ['home', 'about', 'motto', 'photo', 'graphic', 'specimen', 'game', 'cv', 'contact'];
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
  node.addEventListener('click', () => document.getElementById(sectionIds[i]).scrollIntoView({ behavior: 'smooth' }));
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
   JS 4: Kontaktný formulár — odošle sa cez FormSubmit AJAX
   ============================================================ */
const contactForm = document.getElementById('contact-form');
const submitBtn = document.getElementById('contact-submit');
contactForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const statusEl = document.getElementById('form-status');
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
   JS 5: Motto —(canvas scratch efekt)
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
    lightboxContent.innerHTML = `<div class="lb-placeholder">${item.caption || ''} — placeholder</div>`;
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
   ============================================================ */
const THUMBS_PER_PAGE = 4;

function initCategoryGallery(rootEl, categoriesData) {
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
    currentCatKey = key;
    currentPage = 0;
    catGrid.hidden = true;
    categoryDetail.hidden = false;
    heroEyebrow.textContent = cat.label || key;
    heroTitle.textContent = cat.title;
    heroDesc.textContent = cat.desc;

    renderTileContent(heroTile, cat.images[0]);
    heroTile.onclick = () => openLightboxAt(cat.images, 0);

    renderThumbsPage();

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
    if (window.matchMedia('(max-width: 900px)').matches) {
      catGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}


function localizeCats(cats, dict) {
  Object.keys(cats).forEach(key => {
    const tr = (dict || {})[key];
    if (tr) {
      if (tr.title) cats[key].title = tr.title;
      if (tr.desc) cats[key].desc = tr.desc;
      if (tr.label) cats[key].label = tr.label;
    }
  });
  return cats;
}

/* --- Dáta pre Photography  --- */
const photographyCategories = {
  portraits: {
    title: 'Portrait Photography',
    desc: 'Studio and natural-light portraits focused on character and mood.',
    images: [
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787813464/IMG_8443-2.jpg' },
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787813465/IMG_8744.jpg' },
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787813466/IMG_8833.jpg' },
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787813463/IMG_8387-2.jpg' },
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787813467/IMG_9934.jpg' },
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787813467/IMG_9887.jpg' },
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787813468/IMG_9957.jpg' },
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787813453/IMG_0135.jpg' },
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787813455/IMG_2095.jpg' },
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787813455/IMG_2214.jpg' },
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787813455/IMG_2277.jpg' },
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787813456/IMG_2732.jpg' },
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787813468/KAR01006_copy.jpg' },
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787813475/IMG_7921.jpg' }
    ]
  },
  various: {
    title: 'Various',
    desc: 'A mix of everyday moments, street scenes and personal projects.',
    images: [
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787813451/BZK04091_copy.jpg' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787813470/KAR06853_copy.jpg' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787813470/KAR03335-Enhanced-NR_copy.jpg' },
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787813470/KAR06832_copy.jpg' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787813469/KAR03281-Enhanced-NR_copy.jpg' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787813469/KAR03308-Enhanced-NR_copy.jpg' },
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787828900/KAR08037-final_nic_nove.jpg' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787828896/KAR07625-last_speed.jpg' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787828894/KAR07388_nic_nove.jpg' },
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787829413/KAR00609-Enhanced-NR_copy.jpg' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787829415/KAR00701-2.jpg' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787829412/KAR00422-Enhanced-NR_copy.jpg' },
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787829420/KAR01521-Enhanced-NR_copy.jpg' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787829418/KAR01517-Enhanced-NR_copy.jpg' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787829417/KAR01503-Enhanced-NR_copy.jpg' }
    ]
  },
  products: {
    title: 'Product Photography',
    desc: 'Clean, detail-focused shots for e-commerce and branding.',
    images: [
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787813459/IMG_3245.jpg' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787813458/IMG_3226.jpg' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787813457/IMG_3223.jpg' },
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787813459/IMG_3259.jpg' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787813460/IMG_3281.jpg' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787813457/IMG_3167.jpg' },
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787813473/IMG_2854.jpg' },
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787813474/IMG_3297.jpg' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787813473/IMG_3290.jpg' }
    ]
  },
  shelters: {
    title: 'Shelters',
    desc: 'Helping shelters as much as i can with photography.',
    images: [
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787828889/KAR02552.jpg' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787828893/KAR02839.jpg' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787828892/KAR02780.jpg' },
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787828884/KAR02146.jpg' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787828886/KAR02249.jpg' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787828887/KAR02335.jpg' },
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787828883/KAR02037.jpg' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787829003/KAR02428.jpg' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787828879/KAR01492.jpg' },
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787829200/KAR01836.jpg' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787828882/KAR01904.jpg' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787828880/KAR01764.jpg' }
    ]
  }
};

/* --- Dáta pre Graphic Design  */
const graphicCategories = {
  branding: {
    title: 'Brand Identity',
    desc: 'Logos, color systems and visual identities for brands and products.',
    images: [
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787818502/LOGO.png' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787818450/vzor_graficky_upravitelny_format_1.jpg' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787818443/unnamed.jpg' },
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787818813/ziadost_A4_color.jpg' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787818781/IMG_0558.jpg' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787818666/fabia-combi-overview-slider-01.jpg' },
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787818960/Navrh_CassCo_Building_-_nahlad_-_k%C3%B3pia.jpg' }
    ]
  },
  ui: {
    title: 'UI & Web Design',
    desc: 'Interfaces and layouts for websites, apps and digital products.',
    images: [
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787830542/Titulka_3.jpg' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787819015/face-care-M.jpg' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787819004/celok_-_%C5%BEena_-krk_serum_copy.jpg' },
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787819014/Endermologia_muz_-_targety2_copy.jpg' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787818999/celok_-_%C5%BEena_-_ruky.jpg' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787818999/celok_-_%C5%BEena_-_o%C4%8Di_okienko.jpg' },
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787830540/dokonaly_muz_-_menu_hlavne.jpg' }
    ]
  },
  various: {
    title: 'Various',
    desc: 'Posters, mugs, brochures and print-ready materials.',
    images: [
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787821134/bitezstreetfood.png' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787821917/bbeauty.png' },
      { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787829710/Renesakideabook.png' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787821917/renesak.png' }, { img: 'https://res.cloudinary.com/xbffrklb/image/upload/v1787821135/sakura-mug.png' }
    ]
  }
};

/* Inicializácia oboch galérií  */
initCategoryGallery(document.getElementById('photo'), localizeCats(photographyCategories, T.photoCats));
initCategoryGallery(document.getElementById('graphic'), localizeCats(graphicCategories, T.graphicCats));

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
   JS 9: Hero HOME
   ============================================================ */
const HERO_IMAGE = 'https://res.cloudinary.com/livyisn3/image/upload/v1789982651/BCKgrnd_image.png';
document.getElementById('home').style.setProperty('--hero-img', 'url(' + HERO_IMAGE + ')');
