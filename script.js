/* ================================================================
   FARMOOLOGY — Secure & Optimised JavaScript
   Security: input validation, XSS prevention, rate-limiting,
             null-checks, error boundaries, sanitisation
   Performance: passive listeners, requestAnimationFrame,
                debounced scroll, IntersectionObserver
================================================================ */

'use strict';

/* ────────────────────────────────────────────────────────────────
   SECURITY UTILITIES
──────────────────────────────────────────────────────────────── */

/** Escape HTML to prevent XSS when injecting any user-derived text */
function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Sanitise a phone string — digits, spaces, +, - only */
function sanitisePhone(val) {
  return val.replace(/[^\d\s+\-()]/g, '').trim();
}

/** Validate email with a reasonable pattern */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/** Validate Indian phone: 10+ digits */
function isValidPhone(phone) {
  return /^[+]?[\d\s\-()]{10,15}$/.test(sanitisePhone(phone));
}

/** Safe DOM selector with null guard */
function $(id) {
  return document.getElementById(id) || null;
}

/* ────────────────────────────────────────────────────────────────
   RATE LIMITER — prevent form spam
──────────────────────────────────────────────────────────────── */
const rateLimiter = (() => {
  const map = {};
  return {
    attempt(key, maxAttempts = 3, windowMs = 60000) {
      const now = Date.now();
      if (!map[key] || now - map[key].start > windowMs) {
        map[key] = { count: 1, start: now };
        return true;
      }
      if (map[key].count >= maxAttempts) return false;
      map[key].count++;
      return true;
    }
  };
})();

/* ────────────────────────────────────────────────────────────────
   PRELOADER
──────────────────────────────────────────────────────────────── */
const preloader     = $('preloader');
const preloaderFill = $('preloaderFill');
let   loadProgress  = 0;

const fillInterval = setInterval(() => {
  loadProgress += Math.random() * 12 + 4;
  if (loadProgress > 95) loadProgress = 95;
  if (preloaderFill) preloaderFill.style.width = loadProgress + '%';
}, 80);

window.addEventListener('load', () => {
  clearInterval(fillInterval);
  if (preloaderFill) preloaderFill.style.width = '100%';
  setTimeout(() => {
    if (preloader) preloader.classList.add('hidden');
    document.body.style.overflow = 'auto';
    startHeroCounters();
  }, 500);
});

// Block scroll during load
document.body.style.overflow = 'hidden';

/* ────────────────────────────────────────────────────────────────
   CUSTOM CURSOR (touch-device safe)
──────────────────────────────────────────────────────────────── */
const cursorDot  = $('cursorDot');
const cursorRing = $('cursorRing');

if (window.matchMedia('(hover: hover) and (pointer: fine)').matches
    && cursorDot && cursorRing) {

  let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;
  let rafId = null;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top  = mouseY + 'px';
  }, { passive: true });

  function animRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top  = ringY + 'px';
    rafId = requestAnimationFrame(animRing);
  }
  rafId = requestAnimationFrame(animRing);

  // Hide cursor when leaving window
  document.addEventListener('mouseleave', () => {
    cursorDot.style.opacity  = '0';
    cursorRing.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    cursorDot.style.opacity  = '1';
    cursorRing.style.opacity = '1';
  });

  // Scale up on interactive elements
  const interactiveSelector = 'a, button, .svc-card, .millet-card, .why-card, input, select, textarea';
  document.querySelectorAll(interactiveSelector).forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursorDot.style.transform  = 'translate(-50%,-50%) scale(2)';
      cursorDot.style.background = '#7cb342';
    }, { passive: true });
    el.addEventListener('mouseleave', () => {
      cursorDot.style.transform  = 'translate(-50%,-50%) scale(1)';
      cursorDot.style.background = '';
    }, { passive: true });
  });
}

/* ────────────────────────────────────────────────────────────────
   SCROLL PROGRESS BAR
──────────────────────────────────────────────────────────────── */
const scrollProgressEl = $('scrollProgress');
if (scrollProgressEl) {
  window.addEventListener('scroll', () => {
    const total   = document.documentElement.scrollHeight - window.innerHeight;
    if (total <= 0) return;
    const ratio   = Math.min(window.scrollY / total, 1);
    scrollProgressEl.style.transform = `scaleX(${ratio})`;
  }, { passive: true });
}

/* ────────────────────────────────────────────────────────────────
   NAVBAR — scroll state, mobile menu
──────────────────────────────────────────────────────────────── */
const navbar      = $('navbar');
const burger      = $('burger');
const navMenu     = $('navMenu');
const scrollTopBtn = $('scrollTopBtn');

// Debounce helper for scroll
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

window.addEventListener('scroll', () => {
  if (!navbar || !scrollTopBtn) return;
  const scrolled = window.scrollY > 80;
  navbar.classList.toggle('scrolled', scrolled);
  scrollTopBtn.classList.toggle('visible', scrolled);
}, { passive: true });

if (burger && navMenu) {
  burger.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    burger.classList.toggle('active', isOpen);
    burger.setAttribute('aria-expanded', isOpen.toString());
    navMenu.setAttribute('aria-hidden', (!isOpen).toString());
  });

  navMenu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('active');
      navMenu.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      navMenu.setAttribute('aria-hidden', 'true');
    });
  });
}

// Close menu on outside click
document.addEventListener('click', e => {
  if (navbar && !navbar.contains(e.target)) {
    if (burger)  { burger.classList.remove('active'); burger.setAttribute('aria-expanded','false'); }
    if (navMenu) { navMenu.classList.remove('open'); navMenu.setAttribute('aria-hidden','true'); }
  }
}, { passive: true });

// Close on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (burger)  { burger.classList.remove('active'); burger.setAttribute('aria-expanded','false'); }
    if (navMenu) { navMenu.classList.remove('open'); navMenu.setAttribute('aria-hidden','true'); }
  }
});

/* ────────────────────────────────────────────────────────────────
   SCROLL TO TOP
──────────────────────────────────────────────────────────────── */
if (scrollTopBtn) {
  scrollTopBtn.addEventListener('click', () =>
    window.scrollTo({ top: 0, behavior: 'smooth' })
  );
}

/* ────────────────────────────────────────────────────────────────
   SMOOTH ANCHOR SCROLL
──────────────────────────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (!href || href === '#') return;
    try {
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
      }
    } catch (_) { /* invalid selector — let browser handle */ }
  });
});

/* ────────────────────────────────────────────────────────────────
   ACTIVE NAV LINK
──────────────────────────────────────────────────────────────── */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

const activeStyle = document.createElement('style');
activeStyle.textContent = `
  .navbar:not(.scrolled) .nav-link.active-link { color: #7cb342 !important; }
  .navbar.scrolled .nav-link.active-link        { color: #2d8a4e !important; font-weight: 600; }
`;
document.head.appendChild(activeStyle);

const setActiveLink = debounce(() => {
  let active = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 130) active = sec.id;
  });
  navLinks.forEach(l =>
    l.classList.toggle('active-link', l.getAttribute('href') === `#${active}`)
  );
}, 50);

window.addEventListener('scroll', setActiveLink, { passive: true });

/* ────────────────────────────────────────────────────────────────
   SCROLL REVEAL — IntersectionObserver
──────────────────────────────────────────────────────────────── */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });

document.querySelectorAll('[data-reveal]').forEach(el => revealObs.observe(el));

/* ────────────────────────────────────────────────────────────────
   COUNTER ANIMATION
──────────────────────────────────────────────────────────────── */
function animateCounter(el, target, duration = 1800) {
  if (!el || isNaN(target)) return;
  const isLarge = target >= 1000;
  let   start   = 0;
  const step    = target / (duration / 16);

  const timer = setInterval(() => {
    start += step;
    if (start >= target) {
      start = target;
      clearInterval(timer);
    }
    el.textContent = isLarge
      ? Math.floor(start).toLocaleString('en-IN')
      : Math.floor(start);
  }, 16);
}

const counterObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el     = entry.target;
      const target = parseInt(el.dataset.target, 10);
      if (!isNaN(target)) animateCounter(el, target);
      counterObs.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.counter').forEach(el => counterObs.observe(el));

function startHeroCounters() {
  document.querySelectorAll('.ti-num').forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    if (!isNaN(target)) animateCounter(el, target, 2000);
  });
}

/* ────────────────────────────────────────────────────────────────
   SERVICE CARD — 3D TILT
──────────────────────────────────────────────────────────────── */
document.querySelectorAll('.svc-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x    = (e.clientX - rect.left) / rect.width  - 0.5;
    const y    = (e.clientY - rect.top)  / rect.height - 0.5;
    card.style.transform =
      `translateY(-8px) perspective(600px) rotateY(${x * 6}deg) rotateX(${-y * 4}deg)`;
  }, { passive: true });

  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  }, { passive: true });
});

/* ────────────────────────────────────────────────────────────────
   CONTACT FORM — Validated, Sanitised, Rate-Limited
──────────────────────────────────────────────────────────────── */
const contactForm = $('contactForm');
const formCard    = $('formCard');

if (contactForm && formCard) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();

    // ── Rate limit: max 3 submissions per minute ──
    if (!rateLimiter.attempt('contact-form', 3, 60000)) {
      showFormError('Too many submissions. Please wait a minute and try again.');
      return;
    }

    // ── Collect & sanitise values ──
    const nameVal    = escapeHTML(contactForm.name?.value?.trim() || '');
    const phoneVal   = sanitisePhone(contactForm.phone?.value || '');
    const emailVal   = (contactForm.email?.value || '').trim();
    const serviceVal = escapeHTML(contactForm.service?.value || '');
    const msgVal     = escapeHTML(contactForm.message?.value?.trim() || '');

    // ── Client-side validation ──
    const errors = [];
    if (!nameVal || nameVal.length < 2)
      errors.push('Please enter your full name (at least 2 characters).');
    if (!isValidPhone(phoneVal))
      errors.push('Please enter a valid phone number (10–15 digits).');
    if (emailVal && !isValidEmail(emailVal))
      errors.push('Please enter a valid email address.');
    if (msgVal.length > 2000)
      errors.push('Message is too long (max 2000 characters).');

    if (errors.length > 0) {
      showFormError(errors.join('<br>'));
      return;
    }

    // ── Submit UI ──
    const btn  = contactForm.querySelector('.form-submit');
    const span = btn ? btn.querySelector('span') : null;
    if (span) span.textContent = 'Sending…';
    if (btn)  btn.disabled = true;

    // ── Simulate send (replace with real API / FormSpree endpoint) ──
    setTimeout(() => {
      // Safe static HTML — no user data injected into innerHTML
      formCard.innerHTML = `
        <div class="form-success" role="alert" aria-live="polite">
          <div class="form-success-icon" aria-hidden="true">🌿</div>
          <h3>Message Received!</h3>
          <p>Thank you for reaching out to Farmoology.<br/>
             Dr. Kasirao's team will respond within 24 hours.</p>
          <a href="https://wa.me/919398544652"
             target="_blank"
             rel="noopener noreferrer"
             aria-label="Continue conversation on WhatsApp"
             style="display:inline-flex;align-items:center;gap:10px;
                    background:#25D366;color:#fff;padding:14px 28px;
                    border-radius:999px;font-weight:700;margin-top:16px;
                    text-decoration:none;font-size:.95rem;">
            <i class="fab fa-whatsapp" aria-hidden="true"></i>
            Continue on WhatsApp
          </a>
        </div>`;
    }, 1800);
  });
}

/** Display a form error message safely */
function showFormError(htmlMessage) {
  let errBox = $('formError');
  if (!errBox) {
    errBox = document.createElement('div');
    errBox.id = 'formError';
    errBox.setAttribute('role', 'alert');
    errBox.setAttribute('aria-live', 'assertive');
    errBox.style.cssText = `
      background:#fff0f0;border:1px solid #ffcccc;color:#c0392b;
      border-radius:10px;padding:14px 18px;margin-bottom:18px;
      font-size:.88rem;line-height:1.6;`;
    const form = $('contactForm');
    if (form) form.prepend(errBox);
  }
  errBox.innerHTML = '⚠️ ' + htmlMessage;   // htmlMessage is already escaped or static
  errBox.focus?.();
  setTimeout(() => { if (errBox) errBox.remove(); }, 6000);
}

/* ────────────────────────────────────────────────────────────────
   MILLET CARDS — click to contact
──────────────────────────────────────────────────────────────── */
document.querySelectorAll('.millet-card').forEach(card => {
  card.addEventListener('click', () => {
    const section = document.getElementById('contact');
    if (section) window.scrollTo({ top: section.offsetTop - 80, behavior: 'smooth' });
  });
  // Keyboard accessibility
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', 'Click to enquire about this product');
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      card.click();
    }
  });
});

/* ────────────────────────────────────────────────────────────────
   MARQUEE — pause on hover / focus
──────────────────────────────────────────────────────────────── */
const marqueeTrack = document.querySelector('.marquee-track');
if (marqueeTrack) {
  const pause = () => marqueeTrack.style.animationPlayState = 'paused';
  const run   = () => marqueeTrack.style.animationPlayState = 'running';
  marqueeTrack.addEventListener('mouseenter', pause, { passive: true });
  marqueeTrack.addEventListener('mouseleave', run,   { passive: true });
  marqueeTrack.addEventListener('focusin',    pause, { passive: true });
  marqueeTrack.addEventListener('focusout',   run,   { passive: true });
}

/* ────────────────────────────────────────────────────────────────
   HERO PARALLAX — only on desktop
──────────────────────────────────────────────────────────────── */
if (window.matchMedia('(min-width: 1024px)').matches) {
  const heroContent = document.querySelector('.hero-content');
  window.addEventListener('scroll', () => {
    if (!heroContent) return;
    const y = window.scrollY;
    if (y < window.innerHeight) {
      heroContent.style.transform = `translateY(${y * 0.22}px)`;
      heroContent.style.opacity   = Math.max(0, 1 - y / (window.innerHeight * 0.7));
    }
  }, { passive: true });
}

/* ────────────────────────────────────────────────────────────────
   REDUCED MOTION — respect user preference
──────────────────────────────────────────────────────────────── */
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // Disable parallax and heavy animations
  document.documentElement.style.setProperty('--t', '0.01s');
  const heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    heroContent.style.transform = '';
    heroContent.style.opacity   = '1';
  }
}


/* ────────────────────────────────────────────────────────────────
   OFFERS & NOTIFICATIONS SYSTEM
   Loads from offers/offers.json or auto-detects offers/offer1.jpg etc.
──────────────────────────────────────────────────────────────── */
async function initOfferNotifications() {
  const offerModal      = document.getElementById('offerModal');
  const offerBackdrop   = document.getElementById('offerBackdrop');
  const offerCloseBtn   = document.getElementById('offerCloseBtn');
  const offerDismissBtn = document.getElementById('offerDismissBtn');
  const offerImage      = document.getElementById('offerImage');
  const offerTitle      = document.getElementById('offerTitle');
  const offerSubtitle   = document.getElementById('offerSubtitle');
  const offerBadgeText  = document.getElementById('offerBadgeText');
  const offerActionBtn  = document.getElementById('offerActionBtn');
  const offerActionText = document.getElementById('offerActionText');
  const floatingBtn     = document.getElementById('floatingOfferBtn');
  const floatingCount   = document.getElementById('floatingOfferCount');
  const offerNavBtns    = document.getElementById('offerNavBtns');
  const offerPrevBtn    = document.getElementById('offerPrevBtn');
  const offerNextBtn    = document.getElementById('offerNextBtn');
  const offerDots       = document.getElementById('offerDots');

  if (!offerModal || !offerImage) return;

  let offersList = [];
  let currentIndex = 0;

  // 1. Try to load from offers/offers.json
  try {
    const res = await fetch('offers/offers.json', { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.enabled !== false && Array.isArray(data.offers)) {
        offersList = data.offers.filter(o => o && o.active !== false && o.image);
      }
    }
  } catch (err) {
    // If fetch fails (e.g. file protocol), fallback to image probing
  }

  // 2. If no offers from JSON, auto-probe candidate image filenames in offers/
  if (offersList.length === 0) {
    const candidateFiles = [
      'offers/offer1.jpg',
      'offers/offer1.png',
      'offers/offer2.jpg',
      'offers/offer2.png',
      'offers/notification.jpg',
      'offers/notification.png'
    ];

    const probe = (src) => new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = () => resolve(null);
      img.src = src + '?t=' + Date.now();
    });

    const results = await Promise.all(candidateFiles.map(probe));
    const foundImages = [...new Set(results.filter(Boolean))];

    if (foundImages.length > 0) {
      offersList = foundImages.map(src => ({
        image: src,
        title: 'Special Offer & Announcement 🌿',
        subtitle: 'Contact Dr. Kasirao for personalized organic farming guidance & diagnostic services.',
        badge: 'Seasonal Offer',
        link: 'https://wa.me/919398544652?text=Hello%20Farmoology,%20I%20saw%20your%20offer%20and%20would%20like%20details!',
        buttonText: 'Claim Offer on WhatsApp'
      }));
    }
  }

  // If no offer photos exist, keep modal and floating button hidden
  if (offersList.length === 0) return;

  // Render offer at given index
  function renderOffer(idx) {
    if (idx < 0) idx = offersList.length - 1;
    if (idx >= offersList.length) idx = 0;
    currentIndex = idx;

    const offer = offersList[currentIndex];
    offerImage.src = offer.image;
    offerTitle.textContent = offer.title || 'Special Announcement 🌿';
    offerSubtitle.textContent = offer.subtitle || '';
    if (offerBadgeText) offerBadgeText.textContent = offer.badge || 'New Notification';
    if (offerActionBtn) {
      offerActionBtn.href = offer.link || 'https://wa.me/919398544652';
      if (offerActionText) offerActionText.textContent = offer.buttonText || 'Claim Offer on WhatsApp';
    }

    if (offerDots && offersList.length > 1) {
      offerDots.innerHTML = offersList.map((_, i) =>
        `<span class="offer-dot ${i === currentIndex ? 'active' : ''}" data-idx="${i}"></span>`
      ).join('');
      offerDots.querySelectorAll('.offer-dot').forEach(dot => {
        dot.onclick = () => renderOffer(parseInt(dot.dataset.idx, 10));
      });
    }
  }

  if (offersList.length > 1 && offerNavBtns) {
    offerNavBtns.style.display = 'flex';
    if (offerPrevBtn) offerPrevBtn.onclick = () => renderOffer(currentIndex - 1);
    if (offerNextBtn) offerNextBtn.onclick = () => renderOffer(currentIndex + 1);
  }

  renderOffer(0);

  // Show floating pill button
  if (floatingBtn) {
    floatingBtn.style.display = 'inline-flex';
    if (floatingCount) floatingCount.textContent = offersList.length;
    floatingBtn.onclick = openModal;
  }

  function openModal() {
    offerModal.classList.add('active');
    offerModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('offer-modal-open');
  }

  function closeModal() {
    offerModal.classList.remove('active');
    offerModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('offer-modal-open');
    sessionStorage.setItem('farmoology_offer_seen', 'true');
  }

  if (offerCloseBtn) offerCloseBtn.onclick = closeModal;
  if (offerDismissBtn) offerDismissBtn.onclick = closeModal;
  if (offerBackdrop) offerBackdrop.onclick = closeModal;

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && offerModal.classList.contains('active')) {
      closeModal();
    }
  });

  // Auto-open after 1.5 seconds if visitor hasn't dismissed it in this session
  if (!sessionStorage.getItem('farmoology_offer_seen')) {
    setTimeout(openModal, 1500);
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOfferNotifications);
} else {
  initOfferNotifications();
}
