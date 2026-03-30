import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

// ==========================================
// CONFIGURATION
// ==========================================
const config = {
  frameCount:   300,
  framePrefix:  '/assets/frames/ezgif-frame-',
  frameSuffix:  '.png',
  frameDigits:  3,
  lerpFactor:   0.08,  // 0.05 = silky; 0.15 = snappier
};

// ==========================================
// SCROLL SECTION MILESTONES
// These define at what scroll % each section
// content triggers. Adjusted to match 950vh layout.
// ==========================================
const MILESTONES = {
  hero:        { in: 0.02,  out: 0.17  },
  intro:       { in: 0.20,  out: 0.28  },
  s1:          { in: 0.30,  out: 0.42  },
  s2:          { in: 0.44,  out: 0.56  },
  s3:          { in: 0.58,  out: 0.68  },
  s4:          { in: 0.70,  out: 0.80  },
  proof:       { in: 0.81,  out: 0.89  },
  philosophy:  { in: 0.89,  out: 0.95  },
  cta:         { in: 0.93,  out: 1.00  },
};

// ==========================================
// STATE
// ==========================================
const state = {
  images: [],
  loadedCount: 0,
  targetFrame:  0,
  currentFrame: 0,
  displayedIndex: -1,
  isReady: false,
};

// ==========================================
// DOM
// ==========================================
const canvas      = document.getElementById('scrub-canvas');
const ctx         = canvas.getContext('2d');
const preloader   = document.getElementById('preloader');
const loadingPct  = document.getElementById('loading-percent');
const progressBar = document.getElementById('progress-bar');

// ==========================================
// UTILS
// ==========================================
const pad  = (n, d) => String(n).padStart(d, '0');
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const coverRect = (imgW, imgH, cvsW, cvsH) => {
  const imgR = imgW / imgH;
  const cvsR = cvsW / cvsH;
  const w = cvsR > imgR ? cvsW : cvsH * imgR;
  const h = cvsR > imgR ? cvsW / imgR : cvsH;
  return { x: (cvsW - w) / 2, y: (cvsH - h) / 2, w, h };
};

// ==========================================
// CANVAS RESIZE
// ==========================================
const resizeCanvas = () => {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  state.displayedIndex = -1; // force redraw
};
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ==========================================
// PRELOAD
// ==========================================
const preloadImages = () => new Promise((resolve) => {
  for (let i = 1; i <= config.frameCount; i++) {
    const img = new Image();
    img.src = `${config.framePrefix}${pad(i, config.frameDigits)}${config.frameSuffix}`;

    const onDone = () => {
      state.images[i - 1] = img;
      state.loadedCount++;
      const pct = Math.floor((state.loadedCount / config.frameCount) * 100);
      loadingPct.textContent = pct;
      progressBar.style.width = pct + '%';

      if (state.loadedCount === config.frameCount) {
        setTimeout(() => {
          gsap.to(preloader, {
            opacity: 0, duration: 0.9, ease: 'power2.inOut',
            onComplete: () => {
              preloader.style.visibility = 'hidden';
              document.body.style.overflow = 'auto';
              resolve();
            }
          });
        }, 350);
      }
    };

    img.onload  = onDone;
    img.onerror = onDone; // don't hang on missing frames
  }
});

// ==========================================
// DRAW FRAME
// ==========================================
const drawFrame = (index) => {
  const img = state.images[index];
  if (!img?.complete || !img.naturalWidth) return;
  const { x, y, w, h } = coverRect(img.naturalWidth, img.naturalHeight, canvas.width, canvas.height);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, x, y, w, h);
};

// ==========================================
// RAF RENDER LOOP
// ==========================================
const renderLoop = () => {
  requestAnimationFrame(renderLoop);
  if (!state.isReady) return;

  state.currentFrame = lerp(state.currentFrame, state.targetFrame, config.lerpFactor);
  const idx = clamp(Math.round(state.currentFrame), 0, config.frameCount - 1);

  if (idx !== state.displayedIndex) {
    state.displayedIndex = idx;
    drawFrame(idx);
  }
};

// ==========================================
// LENIS
// ==========================================
const initLenis = () => {
  const lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false,
    touchMultiplier: 2,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
};

// ==========================================
// FRAME SCRUB (ScrollTrigger)
// ==========================================
const initFrameScrub = () => {
  const container = document.querySelector('.scroll-container');

  ScrollTrigger.create({
    trigger: container,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      state.targetFrame = self.progress * (config.frameCount - 1);
    },
  });
};

// ==========================================
// CONTENT ANIMATIONS
// Helper: animates a block in at a scroll % and out at another %.
// Uses the scroll-container as the trigger with percentage-based positions.
// ==========================================
const animateSection = (id, inPct, outPct, options = {}) => {
  const el = document.getElementById(id);
  if (!el) return;

  const container = document.querySelector('.scroll-container');
  const { 
    fromY = 45, 
    fromX = 0, 
    duration = 0.9,
    ease = 'power3.out',
    delay = 0,
  } = options;

  // Fade IN
  ScrollTrigger.create({
    trigger: container,
    start: `top+=${(inPct * 100)}% top`,
    end:   `top+=${((inPct + 0.06) * 100)}% top`,
    onEnter: () => {
      gsap.to(el, { opacity: 1, y: 0, x: 0, duration, ease, delay });
    },
    onLeaveBack: () => {
      gsap.to(el, { opacity: 0, y: fromY, x: fromX, duration: 0.5, ease: 'power2.in' });
    },
  });

  // Fade OUT
  if (outPct < 1) {
    ScrollTrigger.create({
      trigger: container,
      start: `top+=${(outPct * 100)}% top`,
      end:   `top+=${((outPct + 0.04) * 100)}% top`,
      onEnter: () => {
        gsap.to(el, { opacity: 0, y: -fromY * 0.6, duration: 0.6, ease: 'power2.in' });
      },
      onLeaveBack: () => {
        gsap.to(el, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
      },
    });
  }
};

// ==========================================
// INIT ALL CONTENT ANIMATIONS
// ==========================================
const initContentAnimations = () => {
  const M = MILESTONES;

  // ── HERO ──────────────────────────────────────────────────
  // Set initial states
  gsap.set('#hero-tag, #hero-p, #hero-badge', { opacity: 0 });
  gsap.set('#hero-h1', { opacity: 0, y: 60 });

  const container = document.querySelector('.scroll-container');

  // Hero content animates in right after preloader completes (no scroll needed)
  gsap.to('#hero-block', { opacity: 1, y: 0, duration: 0.01 }); // immediately visible
  gsap.to('#hero-tag',   { opacity: 1, duration: 0.8, delay: 0.2, ease: 'power2.out' });
  gsap.to('#hero-h1',    { opacity: 1, y: 0, duration: 1.1, delay: 0.35, ease: 'power3.out' });
  gsap.to('#hero-p',     { opacity: 0.9, duration: 0.9, delay: 0.65, ease: 'power2.out' });
  gsap.to('#hero-badge', { opacity: 1, duration: 0.8, delay: 1.0, ease: 'back.out(1.5)' });

  // Hero scroll-based exit trigger is still needed
  ScrollTrigger.create({
    trigger: container,
    start: `top+=${M.hero.in * 100}% top`,
    onEnter: () => { /* already visible */ },
    onLeaveBack: () => { /* returning to top — keep visible */ },
  });

  // Hero fades out
  ScrollTrigger.create({
    trigger: container,
    start: `top+=${M.hero.out * 100}% top`,
    onEnter: () => {
      gsap.to('#hero-block', { opacity: 0, y: -30, duration: 0.7, ease: 'power2.in' });
    },
    onLeaveBack: () => {
      gsap.to('#hero-block', { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
      gsap.to('#hero-tag, #hero-p, #hero-badge', { opacity: 1, duration: 0.4 });
    },
  });

  // ── INTRO ──────────────────────────────────────────────────
  animateSection('intro-block', M.intro.in, M.intro.out, { fromY: 40 });
  animateSection('intro-tag',   M.intro.in, M.intro.out, { delay: 0.1 });

  // ── SERVICE 1 ──────────────────────────────────────────────
  animateSection('s1-block',  M.s1.in, M.s1.out, { fromY: 50 });
  animateSection('s1-tag',    M.s1.in, M.s1.out, { delay: 0.1 });
  animateSection('s1-hook',   M.s1.in, M.s1.out, { delay: 0.2 });
  animateSection('s1-metric', M.s1.in, M.s1.out, { delay: 0.4 });

  // ── SERVICE 2 ──────────────────────────────────────────────
  animateSection('s2-block',  M.s2.in, M.s2.out, { fromY: 50, fromX: 30 });
  animateSection('s2-tag',    M.s2.in, M.s2.out, { delay: 0.1 });
  animateSection('s2-hook',   M.s2.in, M.s2.out, { delay: 0.2 });
  animateSection('s2-metric', M.s2.in, M.s2.out, { delay: 0.4 });

  // ── SERVICE 3 ──────────────────────────────────────────────
  animateSection('s3-block',  M.s3.in, M.s3.out, { fromY: 50 });
  animateSection('s3-tag',    M.s3.in, M.s3.out, { delay: 0.1 });
  animateSection('s3-hook',   M.s3.in, M.s3.out, { delay: 0.2 });
  animateSection('s3-metric', M.s3.in, M.s3.out, { delay: 0.4 });

  // ── SERVICE 4 ──────────────────────────────────────────────
  animateSection('s4-block',  M.s4.in, M.s4.out, { fromY: 50, fromX: 30 });
  animateSection('s4-tag',    M.s4.in, M.s4.out, { delay: 0.1 });
  animateSection('s4-hook',   M.s4.in, M.s4.out, { delay: 0.2 });
  animateSection('s4-metric', M.s4.in, M.s4.out, { delay: 0.4 });

  // ── PROOF ──────────────────────────────────────────────────
  animateSection('proof-block', M.proof.in, M.proof.out, { fromY: 40 });
  animateSection('proof-tag',   M.proof.in, M.proof.out, { delay: 0.1 });
  animateSection('proof-cards', M.proof.in, M.proof.out, { delay: 0.3 });

  // Staggered proof cards
  ScrollTrigger.create({
    trigger: container,
    start: `top+=${M.proof.in * 100}% top`,
    onEnter: () => {
      gsap.fromTo('.proof-card',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.15, delay: 0.4, ease: 'power3.out' }
      );
    },
  });

  // ── PHILOSOPHY ─────────────────────────────────────────────
  animateSection('phil-block', M.philosophy.in, M.philosophy.out, { fromY: 40 });
  animateSection('phil-tag',   M.philosophy.in, M.philosophy.out, { delay: 0.1 });

  // ── CTA ────────────────────────────────────────────────────
  animateSection('cta-block',    M.cta.in, 1.0, { fromY: 50 });
  animateSection('cta-tag',      M.cta.in, 1.0, { delay: 0.1 });
  animateSection('cta-primary',  M.cta.in, 1.0, { delay: 0.35 });
  animateSection('cta-footnote', M.cta.in, 1.0, { delay: 0.55 });
};

// ==========================================
// NAVBAR
// ==========================================
const initNavbar = () => {
  const nav = document.getElementById('navbar');
  ScrollTrigger.create({
    start: 'top -80',
    onEnter:     () => nav.classList.add('scrolled'),
    onLeaveBack: () => nav.classList.remove('scrolled'),
  });
};

// ==========================================
// BOOTSTRAP
// ==========================================
const init = async () => {
  document.body.style.overflow = 'hidden';

  initLenis();
  renderLoop(); // start RAF immediately

  await preloadImages();

  drawFrame(0);
  state.isReady = true;

  initFrameScrub();
  initContentAnimations();
  initNavbar();

  ScrollTrigger.refresh();
};

init();
