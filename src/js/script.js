'use strict';

/* ==========================================================
   UTILITY
========================================================== */
const addEventOnElements = function (elements, eventType, callback) {
  for (let i = 0, len = elements.length; i < len; i++) {
    elements[i].addEventListener(eventType, callback);
  }
};

/* ==========================================================
   STACKING CARDS
========================================================== */
var stackCardsInstance = null;

(function () {
  if (window.innerWidth > 480) return;

  function osHasReducedMotion() {
    if (!window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  var StackCards = function (element) {
    this.element     = element;
    this.items       = this.element.getElementsByClassName('js-stack-cards__item');
    this.scrollingFn = false;
    this.scrolling   = false;
    this.isMenuOpen  = false;
    initStackCardsEffect(this);
    initStackCardsResize(this);
  };

  StackCards.prototype.resetCards = function () {
    this.isMenuOpen = true;
    for (var i = 0; i < this.items.length; i++) {
      this.items[i].style.transform = 'none';
    }
  };

  StackCards.prototype.restoreCards = function () {
    this.isMenuOpen = false;
    setStackCards(this);
  };

  function initStackCardsEffect(element) {
    setStackCards(element);
    var observer = new IntersectionObserver(stackCardsCallback.bind(element), { threshold: [0, 1] });
    observer.observe(element.element);
  }

  function initStackCardsResize(element) {
    element.element.addEventListener('resize-stack-cards', function () {
      setStackCards(element);
      animateStackCards.bind(element);
    });
  }

  function stackCardsCallback(entries) {
    if (entries[0].isIntersecting) {
      if (this.scrollingFn) return;
      stackCardsInitEvent(this);
    } else {
      if (!this.scrollingFn) return;
      window.removeEventListener('scroll', this.scrollingFn);
      this.scrollingFn = false;
    }
  }

  function stackCardsInitEvent(element) {
    element.scrollingFn = stackCardsScrolling.bind(element);
    window.addEventListener('scroll', element.scrollingFn, { passive: true });
  }

  function stackCardsScrolling() {
    if (this.scrolling) return;
    this.scrolling = true;
    window.requestAnimationFrame(animateStackCards.bind(this));
  }

  function setStackCards(element) {
    element.marginY = getComputedStyle(element.element).getPropertyValue('--stack-cards-gap').trim();
    getIntegerFromProperty(element);
    element.elementHeight = element.element.offsetHeight;
    var cardStyle         = getComputedStyle(element.items[0]);
    element.cardTop       = Math.floor(parseFloat(cardStyle.getPropertyValue('top')));
    element.cardHeight    = Math.floor(parseFloat(cardStyle.getPropertyValue('height')));
    element.windowHeight  = window.innerHeight;

    if (isNaN(element.marginY)) {
      element.element.style.paddingBottom = '0px';
    } else {
      element.element.style.paddingBottom = element.marginY * (element.items.length - 1) + 'px';
    }

    for (var i = 0; i < element.items.length; i++) {
      element.items[i].style.transform = isNaN(element.marginY)
        ? 'none'
        : 'translateY(' + element.marginY * i + 'px)';
    }
  }

  function getIntegerFromProperty(element) {
    var node = document.createElement('div');
    node.setAttribute('style', 'opacity:0;visibility:hidden;position:absolute;height:' + element.marginY);
    element.element.appendChild(node);
    element.marginY = parseInt(getComputedStyle(node).getPropertyValue('height'));
    element.element.removeChild(node);
  }

  function animateStackCards() {
    if (this.isMenuOpen || document.body.classList.contains('menu-open')) { this.scrolling = false; return; }
    if (isNaN(this.marginY)) { this.scrolling = false; return; }

    var top = this.element.getBoundingClientRect().top;

    if (this.cardTop - top + this.windowHeight - this.elementHeight - this.cardHeight + this.marginY + this.marginY * this.items.length > 0) {
      this.scrolling = false;
      return;
    }

    for (var i = 0; i < this.items.length; i++) {
      var scrolling = this.cardTop - top - i * (this.cardHeight + this.marginY);
      if (scrolling > 0) {
        var scaling = i === this.items.length - 1 ? 1 : (this.cardHeight - scrolling * 0.05) / this.cardHeight;
        this.items[i].style.transform = 'translateY(' + this.marginY * i + 'px) scale(' + scaling + ')';
      } else {
        this.items[i].style.transform = 'translateY(' + this.marginY * i + 'px)';
      }
    }
    this.scrolling = false;
  }

  var wrapper = document.getElementById('cards');
  if (wrapper && 'IntersectionObserver' in window && !osHasReducedMotion()) {
    wrapper.querySelectorAll('.card').forEach(function (card) {
      card.classList.add('js-stack-cards__item');
    });
    stackCardsInstance = new StackCards(wrapper);
    var resizingId  = false;
    var customEvent = new CustomEvent('resize-stack-cards');
    window.addEventListener('resize', function () {
      clearTimeout(resizingId);
      resizingId = setTimeout(function () {
        if (!document.body.classList.contains('menu-open')) wrapper.dispatchEvent(customEvent);
      }, 500);
    });
  }
}());

/* ==========================================================
   HORIZONTAL SCROLL PIN (desktop only)
========================================================== */
function initHorizontalScrollPin() {
  const sectionPin    = document.querySelector('#sectionPin');
  const pinWrapSticky = document.querySelector('.pin-wrap-sticky');
  const pinWrap       = document.querySelector('.pin-wrap');
  const scrollHint    = document.querySelector('.scroll-hint');

  if (!sectionPin || !pinWrapSticky || !pinWrap) return;
  if (window.innerWidth <= 600) return;

  sectionPin.style.height   = '800vh';
  sectionPin.style.overflow = 'visible';

  pinWrapSticky.style.cssText = `
    height: 100vh; width: 100vw; position: sticky; top: 0;
    overflow-x: hidden; overflow-y: visible; display: flex; align-items: center;
  `;

  pinWrap.style.cssText = `
    display: flex; flex-direction: row; align-items: center;
    gap: 15px; padding: 0 5vw; height: 100%; will-change: transform;
  `;

  function update() {
    const rect     = sectionPin.getBoundingClientRect();
    const total    = sectionPin.offsetHeight - window.innerHeight;
    if (total <= 0) return;
    const progress = Math.max(0, Math.min(1, -rect.top / total));
    const maxSlide = pinWrap.scrollWidth - window.innerWidth;
    pinWrap.style.transform = `translateX(-${progress * maxSlide}px)`;
    if (scrollHint) scrollHint.classList.toggle('visible', progress > 0.005 && progress < 0.99);
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(() => { update(); ticking = false; }); ticking = true; }
  }, { passive: true });

  window.addEventListener('load', () => { update(); setTimeout(update, 300); });
  update();
}

/* ==========================================================
   DARK MODE TOGGLE
========================================================== */
function initDarkModeToggle() {
  const htmlElement     = document.documentElement;
  const darkModeToggles = document.querySelectorAll('.dark-mode-toggle');
  if (darkModeToggles.length === 0) return;

  const updateAllToggleIcons = (theme) => {
    darkModeToggles.forEach(toggle => {
      const moonIcon = toggle.querySelector('.moon-icon');
      const sunIcon  = toggle.querySelector('.sun-icon');
      if (!moonIcon || !sunIcon) return;
      if (theme === 'dark') {
        moonIcon.style.opacity   = '0';
        moonIcon.style.transform = 'translate(-50%, -50%) scale(0)';
        sunIcon.style.opacity    = '1';
        sunIcon.style.transform  = 'translate(-50%, -50%) scale(1)';
      } else {
        moonIcon.style.opacity   = '1';
        moonIcon.style.transform = 'translate(-50%, -50%) scale(1)';
        sunIcon.style.opacity    = '0';
        sunIcon.style.transform  = 'translate(-50%, -50%) scale(0)';
      }
    });
  };

  const initTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    htmlElement.setAttribute('data-theme', savedTheme);
    updateAllToggleIcons(savedTheme);
  };

  darkModeToggles.forEach(toggle => {
    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      const newTheme = htmlElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      htmlElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateAllToggleIcons(newTheme);
    });
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      const newTheme = e.matches ? 'dark' : 'light';
      htmlElement.setAttribute('data-theme', newTheme);
      updateAllToggleIcons(newTheme);
    }
  });

  initTheme();
}

/* ==========================================================
   STAR PRELOADER
   Targets: id="star-path", id="dot" (matching your HTML)
   Hides:   .preloader-wrap via .loaded class
========================================================== */
function initStarPreloader() {
  const pathEl = document.getElementById('star-path');
  const dotEl  = document.getElementById('dot');
  if (!pathEl || !dotEl) return null;

  const R = 100, r = 40, nPoints = 5;
  const pts = [];
  for (let i = 0; i < nPoints * 2; i++) {
    const angle  = (Math.PI / nPoints) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? R : r;
    pts.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
  }
  const allPts = [...pts, pts[0]];

  const fullD = allPts.map((p, i) =>
    (i === 0 ? 'M' : 'L') + ` ${p[0].toFixed(3)},${p[1].toFixed(3)}`
  ).join(' ');
  pathEl.setAttribute('d', fullD);

  const totalLen = pathEl.getTotalLength();
  pathEl.style.strokeDasharray  = totalLen;
  pathEl.style.strokeDashoffset = totalLen;

  const segs = [];
  for (let i = 1; i < allPts.length; i++) {
    const dx = allPts[i][0] - allPts[i-1][0];
    const dy = allPts[i][1] - allPts[i-1][1];
    segs.push(Math.sqrt(dx*dx + dy*dy));
  }
  const totalSegLen = segs.reduce((a, b) => a + b, 0);

  function lerp(a, b, t)  { return a + (b - a) * t; }
  function easeInOut(t)   { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

  function getPointAt(frac) {
    let target = frac * totalSegLen, acc = 0;
    for (let i = 0; i < segs.length; i++) {
      if (acc + segs[i] >= target) {
        const t = (target - acc) / segs[i];
        return [lerp(allPts[i][0], allPts[i+1][0], t), lerp(allPts[i][1], allPts[i+1][1], t)];
      }
      acc += segs[i];
    }
    return allPts[allPts.length - 1];
  }

  const DRAW = 1800, PAUSE = 400, ERASE = 600;
  const CYCLE = DRAW + PAUSE + ERASE;
  let startTime = null, rafId = null;

  function animate(ts) {
    if (!startTime) startTime = ts;
    const elapsed = (ts - startTime) % CYCLE;
    let drawFrac, showDot = true;

    if (elapsed < DRAW) {
      drawFrac = easeInOut(elapsed / DRAW);
    } else if (elapsed < DRAW + PAUSE) {
      drawFrac = 1; showDot = false;
    } else {
      drawFrac = 1 - easeInOut((elapsed - DRAW - PAUSE) / ERASE);
      showDot  = false;
    }

    pathEl.style.strokeDashoffset = totalLen * (1 - drawFrac);

    if (showDot && drawFrac > 0 && drawFrac < 1) {
      const pos = getPointAt(drawFrac);
      dotEl.setAttribute('cx', pos[0].toFixed(3));
      dotEl.setAttribute('cy', pos[1].toFixed(3));
      dotEl.style.opacity = '1';
    } else {
      dotEl.style.opacity = '0';
    }

    rafId = requestAnimationFrame(animate);
  }

  rafId = requestAnimationFrame(animate);
  return function stop() { if (rafId) cancelAnimationFrame(rafId); };
}

/* ==========================================================
   PRELOADER DISMISS
   Targets .preloader-wrap with .loaded (matches your CSS)
   Runs star animation, hides on DOMContentLoaded
========================================================== */
// Start animation immediately — star-path must be in DOM already
const preloaderWrap = document.getElementById('star-preloader');
let stopStarAnim = initStarPreloader();

// Prevent scrolling while preloader is active
document.body.style.overflow = 'hidden';

window.addEventListener('load', function () {
  // Small delay so the star completes at least one full cycle visually
  setTimeout(function () {

    if (preloaderWrap) {
      preloaderWrap.classList.add('loaded');
    }
    document.body.classList.add('loaded');

    // Re-enable scrolling
    document.body.style.overflow = '';

    // Stop animation after fade-out finishes
    setTimeout(function () {
      if (stopStarAnim) stopStarAnim();
    }, 1500);

    initNavbar();
    initHorizontalScrollPin();
    initDarkModeToggle();

  }, 1000); // adjust this delay (ms) to taste
});
/* ==========================================================
   NAVBAR
========================================================== */
function initNavbar() {
  const navToggleBtn = document.querySelector('.nav-toggle-btn');
  const navbar       = document.querySelector('.navbar');
  const overlay      = document.querySelector('.overlay');
  if (!navToggleBtn || !navbar || !overlay) return;

  function openNav() {
    navbar.classList.add('active');
    navToggleBtn.classList.add('active');
    overlay.classList.add('active');
    document.body.classList.add('nav-active', 'menu-open');
    if (stackCardsInstance) stackCardsInstance.resetCards();
    document.querySelectorAll('.card').forEach(c => { c.style.transform = 'none'; });
  }

  function closeNav() {
    navbar.classList.remove('active');
    navToggleBtn.classList.remove('active');
    overlay.classList.remove('active');
    document.body.classList.remove('nav-active', 'menu-open');
    if (stackCardsInstance) setTimeout(() => stackCardsInstance.restoreCards(), 100);
  }

  navToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    navbar.classList.contains('active') ? closeNav() : openNav();
  });

  overlay.addEventListener('click',    (e) => { e.stopPropagation(); closeNav(); });
  overlay.addEventListener('touchend', (e) => { e.preventDefault(); e.stopPropagation(); closeNav(); }, { passive: false });
  navbar.querySelectorAll('.navbar-link').forEach(link => link.addEventListener('click', closeNav));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && navbar.classList.contains('active')) closeNav(); });
}

/* ==========================================================
   HEADER — frosted glass on scroll
========================================================== */
const header = document.querySelector('[data-header]');
window.addEventListener('scroll', function () {
  if (!header) return;
  header.classList.toggle('active', window.scrollY >= 100);
}, { passive: true });

/* ==========================================================
   SERVICE SLIDER
========================================================== */
const serviceSliders = document.querySelectorAll("[data-slider]:not(.portfolio [data-slider])");

const initServiceSlider = function (currentSlider) {
  const sliderContainer = currentSlider.querySelector('[data-slider-container]');
  const sliderPrevBtn   = currentSlider.querySelector('[data-slider-prev]');
  const sliderNextBtn   = currentSlider.querySelector('[data-slider-next]');
  if (!sliderContainer || !sliderPrevBtn || !sliderNextBtn) return;

  let totalVisible  = Number(getComputedStyle(currentSlider).getPropertyValue('--slider-items'));
  let totalSlidable = sliderContainer.childElementCount - totalVisible;
  let currentPos    = 0;

  const moveSlider = () => {
    sliderContainer.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)';
    sliderContainer.style.transform  = `translateX(-${sliderContainer.children[currentPos].offsetLeft}px)`;
  };

  const slideNext = () => { if (currentPos < totalSlidable) { currentPos++; moveSlider(); } };
  const slidePrev = () => { if (currentPos > 0)             { currentPos--; moveSlider(); } };

  sliderNextBtn.addEventListener('click', slideNext);
  sliderPrevBtn.addEventListener('click', slidePrev);

  let isScrolling = false, accumulatedDelta = 0;
  const threshold = 60;

  currentSlider.addEventListener('wheel', function (event) {
    const isHorizontal    = Math.abs(event.deltaX) > Math.abs(event.deltaY) * 2;
    const isShiftVertical = event.shiftKey && Math.abs(event.deltaY) > 0;
    if (!isHorizontal && !isShiftVertical) return;
    event.preventDefault();
    accumulatedDelta += isHorizontal ? event.deltaX : event.deltaY;
    if (Math.abs(accumulatedDelta) < threshold || isScrolling) return;
    isScrolling = true;
    accumulatedDelta > 0 ? slideNext() : slidePrev();
    accumulatedDelta = 0;
    setTimeout(() => { isScrolling = false; }, 200);
  }, { passive: false });

  window.addEventListener('resize', () => {
    totalVisible  = Number(getComputedStyle(currentSlider).getPropertyValue('--slider-items'));
    totalSlidable = sliderContainer.childElementCount - totalVisible;
    moveSlider();
  });

  moveSlider();
};

serviceSliders.forEach(slider => initServiceSlider(slider));

/* ==========================================================
   TECHNOLOGIES REVEAL
========================================================== */
const revealElements = document.querySelectorAll('.language-item');

if (revealElements.length > 0) {
  const revealOnScroll = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el    = entry.target;
      const index = Array.from(revealElements).indexOf(el);
      if (entry.isIntersecting) {
        setTimeout(() => { el.classList.add('reveal'); el.classList.remove('hidden'); }, index * 100);
      } else {
        setTimeout(() => { el.classList.remove('reveal'); el.classList.add('hidden'); }, index * 100);
      }
    });
  }, { threshold: 0.1 });

  window.addEventListener('load', () => {
    revealElements.forEach(el => { el.classList.add('hidden'); revealOnScroll.observe(el); });
  });
}

/* ==========================================================
   SCROLL TO TOP
========================================================== */
/* ==========================================================
   SCROLL TO TOP
========================================================== */
const scrollToTopBtn = document.getElementById('scrollToTop');
let isLaunching = false;
let lastScrollY = window.scrollY;
let ticking = false;

window.addEventListener('scroll', function () {
  lastScrollY = window.scrollY;
  
  if (!ticking) {
    window.requestAnimationFrame(function() {
      if (!scrollToTopBtn || isLaunching) return;
      
      // Only show when scrolled down more than 300px AND not at the very top
      // Add a small buffer to prevent flashing
      if (lastScrollY > 300 && lastScrollY > 50) {
        scrollToTopBtn.classList.add('show');
      } else {
        scrollToTopBtn.classList.remove('show');
      }
      
      ticking = false;
    });
    
    ticking = true;
  }
}, { passive: true });

if (scrollToTopBtn) {
  scrollToTopBtn.addEventListener('click', function () {
    isLaunching = true;
    scrollToTopBtn.classList.add('launching');
    scrollToTopBtn.classList.remove('show'); // Hide immediately on click
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const checkInterval = setInterval(() => {
      if (window.scrollY <= 5) {
        clearInterval(checkInterval);
        scrollToTopBtn.classList.remove('launching', 'show');
        isLaunching = false;
      }
    }, 50);

    setTimeout(() => {
      if (isLaunching) {
        clearInterval(checkInterval);
        scrollToTopBtn.classList.remove('launching', 'show');
        isLaunching = false;
      }
    }, 1500);
  });
  
  // Also hide on scroll to top
  window.addEventListener('scrollend', function() {
    if (window.scrollY < 10 && !isLaunching) {
      scrollToTopBtn.classList.remove('show');
    }
  });
}
/* ==========================================================
   SCROLL REVEAL
========================================================== */
const scrollRevealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.section-title, .title-wrapper, .section .section-text')
    .forEach((el, i) => {
      el.classList.add(i % 2 === 0 ? 'scroll-reveal-left' : 'scroll-reveal-right');
      scrollRevealObserver.observe(el);
    });
  document.querySelectorAll('.service-card, .language-item, .contact-wrapper, .footer-content')
    .forEach(el => { el.classList.add('scroll-reveal'); scrollRevealObserver.observe(el); });
});

/* ==========================================================
   CONTACT FORM
========================================================== */
const form = document.getElementById('contact-form');

if (form) {
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.querySelector('.span').textContent = 'Sending...'; }

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        const successMsg = document.getElementById('success-msg');
        if (successMsg) {
          successMsg.style.display = 'block';
          successMsg.style.opacity = '1';
          successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          setTimeout(() => {
            successMsg.style.opacity = '0';
            setTimeout(() => { successMsg.style.display = 'none'; }, 500);
          }, 3000);
        }
        form.reset();
      }
    } catch (err) {
      alert('Network error. Please check your connection and try again.');
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.querySelector('.span').textContent = 'Send Message'; }
    }
  });
}