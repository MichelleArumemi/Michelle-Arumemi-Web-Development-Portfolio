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
   STACKING CARDS — adapted from CodyHouse _1_stacking-cards
   Original: uses .js-stack-cards + .js-stack-cards__item
   Adapted:  uses #cards + .card (your existing class names)

   How it works (same logic as CodyHouse):
   1. IntersectionObserver watches #cards.
   2. When #cards enters the viewport, a scroll listener is added.
   3. On each scroll frame, animateStackCards() runs:
      - For each card that has started scrolling past its natural position,
        apply a scale() transform that shrinks it slightly as the next
        card slides over it — exactly like the CodyHouse demo.
   4. When #cards leaves the viewport, the scroll listener is removed.
   5. On resize, card measurements are recalculated.
  ========================================================== */

// Make this available globally so navbar can access it
var stackCardsInstance = null;

(function () {

  /* Only run on mobile */
  if (window.innerWidth > 480) return;

  /* Reduced motion: skip animation */
  function osHasReducedMotion() {
    if (!window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ── StackCards constructor (mirrors CodyHouse StackCards) ── */
  var StackCards = function (element) {
    this.element   = element;                                          // #cards
    this.items     = this.element.getElementsByClassName('js-stack-cards__item'); // .card elements
    this.scrollingFn = false;
    this.scrolling   = false;
    this.isMenuOpen  = false;
    initStackCardsEffect(this);
    initStackCardsResize(this);
  };
  
  // Method to reset cards when menu opens
  StackCards.prototype.resetCards = function() {
    this.isMenuOpen = true;
    for (var i = 0; i < this.items.length; i++) {
      this.items[i].style.transform = 'none';
    }
  };
  
  // Method to restore cards when menu closes
  StackCards.prototype.restoreCards = function() {
    this.isMenuOpen = false;
    setStackCards(this);
  };

  /* ── Use Intersection Observer to start/stop scroll listener ── */
  function initStackCardsEffect(element) {
    setStackCards(element);
    var observer = new IntersectionObserver(
      stackCardsCallback.bind(element),
      { threshold: [0, 1] }
    );
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

  /* ── Measure card/wrapper dimensions and set initial transforms ── */
  function setStackCards(element) {
    /* Read --stack-cards-gap from CSS (set on #cards) */
    element.marginY = getComputedStyle(element.element)
      .getPropertyValue('--stack-cards-gap')
      .trim();

    getIntegerFromProperty(element); /* convert marginY to integer px */

    element.elementHeight = element.element.offsetHeight;

    var cardStyle         = getComputedStyle(element.items[0]);
    element.cardTop       = Math.floor(parseFloat(cardStyle.getPropertyValue('top')));
    element.cardHeight    = Math.floor(parseFloat(cardStyle.getPropertyValue('height')));
    element.windowHeight  = window.innerHeight;

    /* Set paddingBottom on wrapper + initial translateY per card */
    if (isNaN(element.marginY)) {
      element.element.style.paddingBottom = '0px';
    } else {
      element.element.style.paddingBottom =
        element.marginY * (element.items.length - 1) + 'px';
    }

    for (var i = 0; i < element.items.length; i++) {
      if (isNaN(element.marginY)) {
        element.items[i].style.transform = 'none';
      } else {
        element.items[i].style.transform =
          'translateY(' + element.marginY * i + 'px)';
      }
    }
  }

  /* Helper: measure CSS length value as integer px */
  function getIntegerFromProperty(element) {
    var node = document.createElement('div');
    node.setAttribute(
      'style',
      'opacity:0;visibility:hidden;position:absolute;height:' + element.marginY
    );
    element.element.appendChild(node);
    element.marginY = parseInt(getComputedStyle(node).getPropertyValue('height'));
    element.element.removeChild(node);
  }

  /* ── Animate: scale cards as they scroll behind each other ── */
  function animateStackCards() {
    // Don't animate if menu is open
    if (this.isMenuOpen || document.body.classList.contains('menu-open')) {
      this.scrolling = false;
      return;
    }
    
    if (isNaN(this.marginY)) {
      this.scrolling = false;
      return;
    }

    var top = this.element.getBoundingClientRect().top;

    /* Exit early if the stack hasn't started animating yet */
    if (
      this.cardTop - top + this.windowHeight - this.elementHeight -
      this.cardHeight + this.marginY + this.marginY * this.items.length > 0
    ) {
      this.scrolling = false;
      return;
    }

    for (var i = 0; i < this.items.length; i++) {
      var scrolling = this.cardTop - top - i * (this.cardHeight + this.marginY);

      if (scrolling > 0) {
        /* Scale shrinks as this card scrolls further behind */
        var scaling =
          i === this.items.length - 1
            ? 1
            : (this.cardHeight - scrolling * 0.05) / this.cardHeight;

        this.items[i].style.transform =
          'translateY(' + this.marginY * i + 'px) scale(' + scaling + ')';
      } else {
        this.items[i].style.transform =
          'translateY(' + this.marginY * i + 'px)';
      }
    }

    this.scrolling = false;
  }

  /* ── Initialise ── */
  var wrapper = document.getElementById('cards');

  if (
    wrapper &&
    'IntersectionObserver' in window &&
    'IntersectionObserverEntry' in window &&
    'intersectionRatio' in window.IntersectionObserverEntry.prototype &&
    !osHasReducedMotion()
  ) {
    /*
      CodyHouse queries by className. We have a single #cards wrapper,
      so we bridge by giving each .card the class js-stack-cards__item
      (added dynamically, no HTML changes needed) and treat #cards as
      the js-stack-cards element.
    */
    var cards = wrapper.querySelectorAll('.card');
    cards.forEach(function (card) {
      card.classList.add('js-stack-cards__item');
    });

    stackCardsInstance = new StackCards(wrapper);
    var resizingId    = false;
    var customEvent   = new CustomEvent('resize-stack-cards');

    window.addEventListener('resize', function () {
      clearTimeout(resizingId);
      resizingId = setTimeout(function () {
        // Don't recalculate if menu is open
        if (!document.body.classList.contains('menu-open')) {
          wrapper.dispatchEvent(customEvent);
        }
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

  sectionPin.style.height   = '500vh';
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
    const rect  = sectionPin.getBoundingClientRect();
    const total = sectionPin.offsetHeight - window.innerHeight;
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
  const htmlElement = document.documentElement;
  
  // Find ALL dark mode toggles (both in header and navbar)
  const darkModeToggles = document.querySelectorAll('.dark-mode-toggle');
  
  if (darkModeToggles.length === 0) return;

  // Function to update ALL toggle icons
  const updateAllToggleIcons = (theme) => {
    darkModeToggles.forEach(toggle => {
      const moonIcon = toggle.querySelector('.moon-icon');
      const sunIcon = toggle.querySelector('.sun-icon');
      
      if (moonIcon && sunIcon) {
        if (theme === 'dark') {
          moonIcon.style.opacity = '0';
          moonIcon.style.transform = 'translate(-50%, -50%) scale(0)';
          sunIcon.style.opacity = '1';
          sunIcon.style.transform = 'translate(-50%, -50%) scale(1)';
        } else {
          moonIcon.style.opacity = '1';
          moonIcon.style.transform = 'translate(-50%, -50%) scale(1)';
          sunIcon.style.opacity = '0';
          sunIcon.style.transform = 'translate(-50%, -50%) scale(0)';
        }
      }
    });
  };

  const initTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    htmlElement.setAttribute('data-theme', savedTheme);
    updateAllToggleIcons(savedTheme);
  };

  // Add click event to ALL toggles
  darkModeToggles.forEach(toggle => {
    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      const isDark = htmlElement.getAttribute('data-theme') === 'dark';
      const newTheme = isDark ? 'light' : 'dark';
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
   PRELOADER
  ========================================================== */
/* ==========================================================
   STAR PRELOADER
   Animated 5-point star that draws and erases continuously
  ========================================================== */
(function initStarPreloader() {
  const preloaderWrap = document.getElementById('star-preloader');
  if (!preloaderWrap) return;

  // Build a 5-point star path with outer radius R, inner radius r
  function starPoints(R, r, points = 5) {
    const pts = [];
    for (let i = 0; i < points * 2; i++) {
      const angle = (Math.PI / points) * i - Math.PI / 2;
      const radius = i % 2 === 0 ? R : r;
      pts.push([
        Math.cos(angle) * radius,
        Math.sin(angle) * radius
      ]);
    }
    return pts;
  }

  const R = 100, r = 40;
  const pts = starPoints(R, r);

  // Close the path back to start
  const allPts = [...pts, pts[0]];

  // Convert to SVG path string
  function toPathD(points) {
    return points.map((p, i) =>
      (i === 0 ? `M` : `L`) + ` ${p[0].toFixed(3)},${p[1].toFixed(3)}`
    ).join(' ');
  }

  // Calculate cumulative distances along the path
  function segLengths(points) {
    const lens = [];
    for (let i = 1; i < points.length; i++) {
      const dx = points[i][0] - points[i-1][0];
      const dy = points[i][1] - points[i-1][1];
      lens.push(Math.sqrt(dx*dx + dy*dy));
    }
    return lens;
  }

  const pathEl = document.getElementById('star-path');
  const dotEl  = document.getElementById('dot');

  if (!pathEl || !dotEl) return;

  const fullD = toPathD(allPts);
  pathEl.setAttribute('d', fullD);

  // Total path length via SVG
  const totalLen = pathEl.getTotalLength();

  // Set up stroke-dasharray / dashoffset for drawing animation
  pathEl.style.strokeDasharray  = totalLen;
  pathEl.style.strokeDashoffset = totalLen;

  // --- Animation ---
  const DRAW_DURATION   = 1800;   // ms to draw full star
  const PAUSE_DURATION  = 400;    // ms pause when fully drawn
  const ERASE_DURATION  = 600;    // ms to erase
  const CYCLE = DRAW_DURATION + PAUSE_DURATION + ERASE_DURATION;

  let startTime = null;

  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

  function getPointAt(frac) {
    // frac 0..1 along allPts
    const totalSegs = allPts.length - 1;
    const segLens = segLengths(allPts);
    const total = segLens.reduce((a,b)=>a+b,0);
    let target = frac * total;
    let acc = 0;
    for (let i = 0; i < segLens.length; i++) {
      if (acc + segLens[i] >= target) {
        const t = (target - acc) / segLens[i];
        return [
          lerp(allPts[i][0], allPts[i+1][0], t),
          lerp(allPts[i][1], allPts[i+1][1], t)
        ];
      }
      acc += segLens[i];
    }
    return allPts[allPts.length-1];
  }

  function animate(ts) {
    if (!startTime) startTime = ts;
    const elapsed = (ts - startTime) % CYCLE;

    let drawFrac, dotVisible = true;

    if (elapsed < DRAW_DURATION) {
      // Drawing phase
      drawFrac = easeInOut(elapsed / DRAW_DURATION);
    } else if (elapsed < DRAW_DURATION + PAUSE_DURATION) {
      // Pause phase — fully drawn
      drawFrac = 1;
      dotVisible = false;
    } else {
      // Erase phase — reverse
      const t = (elapsed - DRAW_DURATION - PAUSE_DURATION) / ERASE_DURATION;
      drawFrac = 1 - easeInOut(t);
      dotVisible = false;
    }

    const offset = totalLen * (1 - drawFrac);
    pathEl.style.strokeDashoffset = offset;

    if (dotVisible && drawFrac > 0 && drawFrac < 1) {
      const pos = getPointAt(drawFrac);
      dotEl.setAttribute('cx', pos[0].toFixed(3));
      dotEl.setAttribute('cy', pos[1].toFixed(3));
      dotEl.style.opacity = '1';
    } else {
      dotEl.style.opacity = '0';
    }

    requestAnimationFrame(animate);
  }

  // Start the animation
  requestAnimationFrame(animate);

  // Hide preloader when page is fully loaded
  window.addEventListener('load', function() {
    setTimeout(function() {
      preloaderWrap.classList.add('loaded');
      document.body.classList.add('loaded');
    }, 500); // Small delay to ensure animation plays at least once
  });
})();

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
    document.body.classList.add('nav-active');
    document.body.classList.add('menu-open');
    
    // Reset cards using the instance
    if (stackCardsInstance && typeof stackCardsInstance.resetCards === 'function') {
      stackCardsInstance.resetCards();
    }
    
    // Also reset manually for immediate effect
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      card.style.transform = 'none';
    });
  }
  
  function closeNav() {
    navbar.classList.remove('active'); 
    navToggleBtn.classList.remove('active');
    overlay.classList.remove('active'); 
    document.body.classList.remove('nav-active');
    document.body.classList.remove('menu-open');
    
    // Restore cards using the instance
    if (stackCardsInstance && typeof stackCardsInstance.restoreCards === 'function') {
      // Small delay to allow menu close animation to complete
      setTimeout(() => {
        stackCardsInstance.restoreCards();
      }, 100);
    }
  }

  navToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    navbar.classList.contains('active') ? closeNav() : openNav();
  });

  overlay.addEventListener('click', (e) => { e.stopPropagation(); closeNav(); });
  overlay.addEventListener('touchend', (e) => {
    e.preventDefault(); e.stopPropagation(); closeNav();
  }, { passive: false });

  navbar.querySelectorAll('.navbar-link').forEach(link => link.addEventListener('click', closeNav));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navbar.classList.contains('active')) closeNav();
  });
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

  // const slideNext = () => { currentPos = currentPos >= totalSlidable ? 0 : currentPos + 1; moveSlider(); };
  // const slidePrev = () => { currentPos = currentPos <= 0 ? totalSlidable : currentPos - 1; moveSlider(); };
const slideNext = () => { if (currentPos < totalSlidable) { currentPos++; moveSlider(); } };
const slidePrev = () => { if (currentPos > 0) { currentPos--; moveSlider(); } };
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
const scrollToTopBtn = document.getElementById('scrollToTop');
let isLaunching = false;

window.addEventListener('scroll', function () {
  if (isLaunching || !scrollToTopBtn) return;
  scrollToTopBtn.classList.toggle('show', window.scrollY > 300);
}, { passive: true });

if (scrollToTopBtn) {
  scrollToTopBtn.addEventListener('click', function () {
    isLaunching = true;
    scrollToTopBtn.classList.add('launching');
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

// Form submission with fetch and user feedback
const form = document.getElementById('contact-form');

if (form) {
  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.querySelector('.span').textContent = 'Sending...';
    }

    const data = new FormData(form);

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      });

    if (response.ok) {
  const successMsg = document.getElementById('success-msg');
  if (successMsg) {
    successMsg.style.display = 'block';
    successMsg.style.opacity = '1';
    successMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Fade out after 3 seconds
    setTimeout(() => {
      successMsg.style.opacity = '0';
      // Hide completely after fade finishes (0.5s transition)
      setTimeout(() => {
        successMsg.style.display = 'none';
      }, 500);
    }, 3000);
  }
  form.reset();
}
    } catch (err) {
      alert('Network error. Please check your connection and try again.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.querySelector('.span').textContent = 'Send Message';
      }
    }
  });
}